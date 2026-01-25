import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { NotificationService } from '../../../notifications/infrastructure/services/NotificationService.js';

interface TaskForReminder {
  id: number;
  title: string;
  deadline: Date;
  priority: string;
  assigneeId: number;
  userId: number;
  status: string;
  hoursUntilDeadline: number;
}

interface GroupedTasks {
  [userId: number]: {
    userId: number;
    assigneeId: number;
    tasks: TaskForReminder[];
  };
}

/**
 * Сервис для отправки периодических напоминаний о задачах
 */
export class TaskReminderService {
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Основной метод для отправки напоминаний о задачах
   * Вызывается периодически (каждые 3 часа)
   */
  async sendTaskReminders(): Promise<void> {
    try {
      console.log('[TaskReminderService] Checking tasks for reminders...');

      // 1. Получить задачи, требующие напоминания
      const tasksNeedingReminder = await this.getTasksNeedingReminder();

      if (tasksNeedingReminder.length === 0) {
        console.log('[TaskReminderService] No tasks need reminders at this time.');
        return;
      }

      console.log(`[TaskReminderService] Found ${tasksNeedingReminder.length} tasks needing reminders`);

      // 2. Группировать задачи по исполнителю
      const groupedByUser = this.groupTasksByUser(tasksNeedingReminder);

      // 3. Отправить сводное уведомление каждому пользователю
      for (const userId in groupedByUser) {
        const userGroup = groupedByUser[userId];
        await this.sendGroupedReminder(userGroup);
      }

      console.log('[TaskReminderService] Reminders sent successfully');
    } catch (error) {
      console.error('[TaskReminderService] Error sending task reminders:', error);
    }
  }

  /**
   * Получить задачи, которым нужно напоминание
   * Критерии:
   * - Статус: pending или in_progress
   * - Дедлайн в ближайшие 48 часов
   * - Последнее напоминание было отправлено более 3 часов назад (или никогда)
   */
  private async getTasksNeedingReminder(): Promise<TaskForReminder[]> {
    const result = await query(
      `
      SELECT
        t.id,
        t.title,
        t.deadline,
        t.priority,
        t.status,
        ta.employee_id as assignee_id,
        e.user_id,
        EXTRACT(EPOCH FROM (t.deadline - NOW())) / 3600 as hours_until_deadline
      FROM tasks t
      INNER JOIN task_assignees ta ON t.id = ta.task_id
      INNER JOIN employees e ON ta.employee_id = e.id
      WHERE
        t.status IN ('pending', 'in_progress')
        AND t.deadline IS NOT NULL
        AND t.deadline > NOW()
        AND t.deadline <= NOW() + INTERVAL '48 hours'
        AND e.user_id IS NOT NULL
        AND (
          t.last_reminder_sent_at IS NULL
          OR t.last_reminder_sent_at <= NOW() - INTERVAL '3 hours'
        )
      ORDER BY t.deadline ASC, t.priority DESC
      `
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      deadline: new Date(row.deadline),
      priority: row.priority,
      assigneeId: row.assignee_id,
      userId: row.user_id,
      status: row.status,
      hoursUntilDeadline: parseFloat(row.hours_until_deadline),
    }));
  }

  /**
   * Группировать задачи по исполнителю
   */
  private groupTasksByUser(tasks: TaskForReminder[]): GroupedTasks {
    const grouped: GroupedTasks = {};

    for (const task of tasks) {
      if (!grouped[task.userId]) {
        grouped[task.userId] = {
          userId: task.userId,
          assigneeId: task.assigneeId,
          tasks: [],
        };
      }
      grouped[task.userId].tasks.push(task);
    }

    // Сортировать задачи внутри каждой группы по срочности
    for (const userId in grouped) {
      grouped[userId].tasks.sort((a, b) => {
        // Сначала по времени до дедлайна
        if (a.hoursUntilDeadline !== b.hoursUntilDeadline) {
          return a.hoursUntilDeadline - b.hoursUntilDeadline;
        }
        // Затем по приоритету
        const priorityOrder: { [key: string]: number } = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      });
    }

    return grouped;
  }

  /**
   * Отправить сводное уведомление пользователю о его задачах
   */
  private async sendGroupedReminder(userGroup: {
    userId: number;
    assigneeId: number;
    tasks: TaskForReminder[];
  }): Promise<void> {
    const { userId, tasks } = userGroup;

    // Ограничить количество задач в уведомлении (топ-3 самых срочных)
    const topTasks = tasks.slice(0, 3);
    const remainingCount = tasks.length - topTasks.length;

    // Сформировать сообщение
    const title = this.getNotificationTitle(tasks.length);
    const message = this.buildNotificationMessage(topTasks, remainingCount);
    const type = this.determineNotificationType(topTasks[0]);

    // Отправить уведомление
    await this.notificationService.create({
      userId,
      title,
      message,
      type,
    });

    // Обновить время последнего напоминания для всех задач пользователя
    await this.updateLastReminderTime(tasks.map((t) => t.id));

    console.log(`[TaskReminderService] Sent reminder to user ${userId} for ${tasks.length} task(s)`);
  }

  /**
   * Определить заголовок уведомления
   */
  private getNotificationTitle(taskCount: number): string {
    if (taskCount === 1) {
      return '⏰ Напоминание о задаче';
    }
    return `⏰ Напоминание о задачах (${taskCount})`;
  }

  /**
   * Построить текст сообщения
   */
  private buildNotificationMessage(tasks: TaskForReminder[], remainingCount: number): string {
    const lines: string[] = [];

    lines.push('Пожалуйста, обновите статус следующих задач:');
    lines.push('');

    for (const task of tasks) {
      const timeInfo = this.formatTimeUntilDeadline(task.hoursUntilDeadline);
      const priorityEmoji = this.getPriorityEmoji(task.priority);
      lines.push(`${priorityEmoji} "${task.title}"`);
      lines.push(`   ${timeInfo}`);
      lines.push('');
    }

    if (remainingCount > 0) {
      lines.push(`...и еще ${remainingCount} задач(и)`);
    }

    return lines.join('\n');
  }

  /**
   * Форматировать время до дедлайна
   */
  private formatTimeUntilDeadline(hours: number): string {
    if (hours < 0) {
      return '⚠️ Просрочено!';
    } else if (hours < 1) {
      const minutes = Math.floor(hours * 60);
      return `🔥 Осталось ${minutes} мин!`;
    } else if (hours < 24) {
      const roundedHours = Math.floor(hours);
      return `⏳ Осталось ${roundedHours} ч.`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return `📅 Осталось ${days} д. ${remainingHours} ч.`;
    }
  }

  /**
   * Получить эмодзи для приоритета
   */
  private getPriorityEmoji(priority: string): string {
    const emojiMap: { [key: string]: string } = {
      urgent: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };
    return emojiMap[priority] || '⚪';
  }

  /**
   * Определить тип уведомления на основе самой срочной задачи
   */
  private determineNotificationType(task: TaskForReminder): 'info' | 'warning' | 'error' {
    if (task.hoursUntilDeadline < 6) {
      return 'error'; // Критически мало времени
    } else if (task.hoursUntilDeadline < 24) {
      return 'warning'; // Меньше суток
    }
    return 'info'; // Более суток
  }

  /**
   * Обновить время последнего напоминания для задач
   */
  private async updateLastReminderTime(taskIds: number[]): Promise<void> {
    if (taskIds.length === 0) return;

    await query(
      `UPDATE tasks
       SET last_reminder_sent_at = NOW()
       WHERE id = ANY($1)`,
      [taskIds]
    );
  }
}
