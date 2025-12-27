import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { NotificationsListDto, NotificationDto } from '../dto/NotificationDto.js';

export class GetNotificationsHandler implements UseCase<{ userId: number; limit?: number }, NotificationsListDto> {
  async execute(req: { userId: number; limit?: number }): Promise<Result<NotificationsListDto>> {
    try {
      const [notifs, counts] = await Promise.all([
        query(`SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`, [req.userId, req.limit || 50]),
        query(`SELECT COUNT(*) as total, COUNT(CASE WHEN is_read = false THEN 1 END) as unread FROM notifications WHERE user_id = $1`, [req.userId]),
      ]);
      const notifications: NotificationDto[] = notifs.rows.map(r => ({
        id: r.id, userId: r.user_id, title: r.title, message: r.message, type: r.type,
        isRead: r.is_read, readAt: r.read_at?.toISOString(), createdAt: new Date(r.created_at).toISOString(),
      }));
      return Result.ok({ notifications, total: parseInt(counts.rows[0].total), unreadCount: parseInt(counts.rows[0].unread) });
    } catch (error) { return Result.fail(error instanceof Error ? error.message : 'Failed'); }
  }
}
