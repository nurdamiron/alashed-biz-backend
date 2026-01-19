import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { WebSocketService } from '../../../../shared/infrastructure/websocket/WebSocketService.js';
import type { PushService, PushPayload } from './PushService.js';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface CreateNotificationParams {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  url?: string;
}

/**
 * Сервис для создания автоматических уведомлений
 */
export class NotificationService {
  private wsService?: WebSocketService;
  private pushService?: PushService;

  setWebSocketService(wsService: WebSocketService): void {
    this.wsService = wsService;
  }

  setPushService(pushService: PushService): void {
    this.pushService = pushService;
  }

  private getPushIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      info: '/icon-192x192.png',
      warning: '/icon-192x192.png',
      error: '/icon-192x192.png',
      success: '/icon-192x192.png',
    };
    return icons[type];
  }
  /**
   * Создать уведомление для пользователя
   */
  async create(params: CreateNotificationParams): Promise<void> {
    const notificationType = params.type || 'info';

    try {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         VALUES ($1, $2, $3, $4, false, NOW())`,
        [params.userId, params.title, params.message, notificationType]
      );

      // Broadcast via WebSocket
      if (this.wsService) {
        this.wsService.broadcastToUser(params.userId, {
          type: 'new_notification',
          data: {
            title: params.title,
            message: params.message,
            type: notificationType,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Send Push notification
      if (this.pushService) {
        await this.pushService.sendToUser(params.userId, {
          title: params.title,
          body: params.message,
          icon: this.getPushIcon(notificationType),
          tag: `notification-${Date.now()}`,
          data: {
            url: params.url || '/',
            type: notificationType,
          },
        });
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  /**
   * Создать уведомления для всех пользователей с определенной ролью
   */
  async createForRole(role: string, title: string, message: string, type?: NotificationType, url?: string): Promise<void> {
    const notificationType = type || 'info';

    try {
      await query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         SELECT id, $1, $2, $3, false, NOW()
         FROM users
         WHERE role = $4`,
        [title, message, notificationType, role]
      );

      // Broadcast via WebSocket
      if (this.wsService) {
        this.wsService.broadcastToRole(role, {
          type: 'new_notification',
          data: {
            title,
            message,
            type: notificationType,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Send Push notification to role
      if (this.pushService) {
        await this.pushService.sendToRole(role, {
          title,
          body: message,
          icon: this.getPushIcon(notificationType),
          tag: `notification-role-${role}-${Date.now()}`,
          data: {
            url: url || '/',
            type: notificationType,
          },
        });
      }
    } catch (error) {
      console.error('Failed to create notifications for role:', error);
    }
  }

  /**
   * Уведомление о низком остатке товара
   */
  async notifyLowStock(productId: number, productName: string, currentQty: number, minQty: number): Promise<void> {
    await this.createForRole(
      'admin',
      'Низкий остаток товара',
      `Товар "${productName}" (ID: ${productId}) почти закончился. Остаток: ${currentQty} шт. (минимум: ${minQty} шт.)`,
      'warning'
    );

    await this.createForRole(
      'manager',
      'Низкий остаток товара',
      `Товар "${productName}" (ID: ${productId}) почти закончился. Остаток: ${currentQty} шт. (минимум: ${minQty} шт.)`,
      'warning'
    );

    // Broadcast specific low_stock event
    if (this.wsService) {
      this.wsService.broadcast({
        type: 'low_stock',
        data: {
          productId,
          productName,
          currentQuantity: currentQty,
          minStockLevel: minQty,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Уведомление о том что товар закончился
   */
  async notifyOutOfStock(productId: number, productName: string): Promise<void> {
    await this.createForRole(
      'admin',
      'Товар закончился',
      `Товар "${productName}" (ID: ${productId}) закончился на складе!`,
      'error'
    );

    await this.createForRole(
      'manager',
      'Товар закончился',
      `Товар "${productName}" (ID: ${productId}) закончился на складе!`,
      'error'
    );

    // Broadcast specific out_of_stock event
    if (this.wsService) {
      this.wsService.broadcast({
        type: 'out_of_stock',
        data: {
          productId,
          productName,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Уведомление о новом заказе
   */
  async notifyNewOrder(orderId: number, employeeId?: number): Promise<void> {
    if (employeeId) {
      // Найти userId по employeeId
      const result = await query(
        `SELECT user_id FROM employees WHERE id = $1`,
        [employeeId]
      );

      if (result.rows.length > 0 && result.rows[0].user_id) {
        await this.create({
          userId: result.rows[0].user_id,
          title: 'Новый заказ',
          message: `Вам назначен новый заказ #${orderId}`,
          type: 'info',
        });
      }
    }

    // Уведомить админов и менеджеров
    await this.createForRole(
      'admin',
      'Новый заказ',
      `Создан новый заказ #${orderId}`,
      'info'
    );

    // Broadcast specific new_order event
    if (this.wsService) {
      this.wsService.broadcast({
        type: 'new_order',
        data: {
          orderId,
          employeeId,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Уведомление о просроченной задаче
   */
  async notifyTaskOverdue(taskId: number, taskTitle: string, assigneeId?: number): Promise<void> {
    if (assigneeId) {
      // Найти userId по employeeId
      const result = await query(
        `SELECT user_id FROM employees WHERE id = $1`,
        [assigneeId]
      );

      if (result.rows.length > 0 && result.rows[0].user_id) {
        await this.create({
          userId: result.rows[0].user_id,
          title: 'Задача просрочена',
          message: `Задача "${taskTitle}" (ID: ${taskId}) просрочена!`,
          type: 'warning',
        });
      }
    }

    // Уведомить менеджеров
    await this.createForRole(
      'manager',
      'Задача просрочена',
      `Задача "${taskTitle}" (ID: ${taskId}) просрочена!`,
      'warning'
    );

    // Broadcast specific task_overdue event
    if (this.wsService) {
      this.wsService.broadcast({
        type: 'task_overdue',
        data: {
          taskId,
          taskTitle,
          assigneeId,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Уведомление о задаче приближающейся к дедлайну
   */
  async notifyTaskDeadlineApproaching(taskId: number, taskTitle: string, hoursLeft: number, assigneeId?: number): Promise<void> {
    if (assigneeId) {
      const result = await query(
        `SELECT user_id FROM employees WHERE id = $1`,
        [assigneeId]
      );

      if (result.rows.length > 0 && result.rows[0].user_id) {
        await this.create({
          userId: result.rows[0].user_id,
          title: 'Приближается дедлайн',
          message: `До дедлайна задачи "${taskTitle}" (ID: ${taskId}) осталось ${hoursLeft} часов`,
          type: 'warning',
        });
      }
    }
  }

  /**
   * Уведомление о новой задаче
   */
  async notifyNewTask(taskId: number, taskTitle: string, assigneeId: number): Promise<void> {
    const result = await query(
      `SELECT user_id FROM employees WHERE id = $1`,
      [assigneeId]
    );

    if (result.rows.length > 0 && result.rows[0].user_id) {
      await this.create({
        userId: result.rows[0].user_id,
        title: 'Новая задача',
        message: `Вам назначена новая задача: "${taskTitle}" (ID: ${taskId})`,
        type: 'info',
      });
    }

    // Broadcast specific new_task event
    if (this.wsService) {
      this.wsService.broadcast({
        type: 'new_task',
        data: {
          taskId,
          taskTitle,
          assigneeId,
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Уведомление об успешной фискализации
   */
  async notifyFiscalReceiptCreated(orderId: number, receiptUrl: string): Promise<void> {
    await this.createForRole(
      'admin',
      'Фискальный чек создан',
      `Фискальный чек для заказа #${orderId} успешно создан. URL: ${receiptUrl}`,
      'success'
    );
  }

  /**
   * Уведомление об ошибке фискализации
   */
  async notifyFiscalReceiptError(orderId: number, error: string): Promise<void> {
    await this.createForRole(
      'admin',
      'Ошибка фискализации',
      `Не удалось создать фискальный чек для заказа #${orderId}. Ошибка: ${error}`,
      'error'
    );
  }
}
