export interface NotificationDto {
  id: number; userId: number; title: string; message?: string; type: string;
  isRead: boolean; readAt?: string; createdAt: string;
}
export interface NotificationsListDto { notifications: NotificationDto[]; total: number; unreadCount: number; }
