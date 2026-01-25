import { TaskReminderService } from './TaskReminderService.js';

/**
 * Сервис для планирования периодических задач
 * Запускает напоминания о задачах каждые 3 часа
 */
export class TaskSchedulerService {
  private reminderService: TaskReminderService;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly INTERVAL_MS = 3 * 60 * 60 * 1000; // 3 часа в миллисекундах

  constructor(reminderService: TaskReminderService) {
    this.reminderService = reminderService;
  }

  /**
   * Запустить планировщик
   */
  start(): void {
    if (this.intervalId) {
      console.log('[TaskSchedulerService] Scheduler is already running');
      return;
    }

    console.log('[TaskSchedulerService] Starting task reminder scheduler (every 3 hours)...');

    // Отправить напоминания сразу при запуске (опционально)
    this.sendRemindersWithErrorHandling();

    // Затем запускать каждые 3 часа
    this.intervalId = setInterval(() => {
      this.sendRemindersWithErrorHandling();
    }, this.INTERVAL_MS);

    console.log('[TaskSchedulerService] Scheduler started successfully');
  }

  /**
   * Остановить планировщик
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[TaskSchedulerService] Scheduler stopped');
    }
  }

  /**
   * Отправить напоминания с обработкой ошибок
   */
  private async sendRemindersWithErrorHandling(): Promise<void> {
    try {
      await this.reminderService.sendTaskReminders();
    } catch (error) {
      console.error('[TaskSchedulerService] Error in scheduled task reminder:', error);
      // Не прерываем работу планировщика при ошибке
    }
  }

  /**
   * Проверить, запущен ли планировщик
   */
  isRunning(): boolean {
    return this.intervalId !== null;
  }

  /**
   * Получить интервал в миллисекундах
   */
  getInterval(): number {
    return this.INTERVAL_MS;
  }
}
