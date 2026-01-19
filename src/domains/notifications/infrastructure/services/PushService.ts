import webpush from 'web-push';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Service for sending Web Push notifications
 */
export class PushService {
  private isConfigured = false;

  constructor() {
    this.configure();
  }

  private configure(): void {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@alashed.kz';

    if (vapidPublicKey && vapidPrivateKey) {
      webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
      this.isConfigured = true;
      console.log('Push notifications configured successfully');
    } else {
      console.warn('VAPID keys not configured. Push notifications disabled.');
      console.warn('Generate keys with: npx web-push generate-vapid-keys');
    }
  }

  /**
   * Get VAPID public key for frontend subscription
   */
  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  /**
   * Subscribe a user to push notifications
   */
  async subscribe(userId: number, subscription: PushSubscriptionData, userAgent?: string): Promise<boolean> {
    try {
      // Check if subscription already exists
      const existing = await query(
        'SELECT id FROM push_subscriptions WHERE endpoint = $1',
        [subscription.endpoint]
      );

      if (existing.rows.length > 0) {
        // Update existing subscription
        await query(
          `UPDATE push_subscriptions
           SET user_id = $1, p256dh = $2, auth = $3, user_agent = $4, is_active = TRUE, last_used_at = NOW()
           WHERE endpoint = $5`,
          [userId, subscription.keys.p256dh, subscription.keys.auth, userAgent, subscription.endpoint]
        );
      } else {
        // Insert new subscription
        await query(
          `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent]
        );
      }

      console.log(`Push subscription saved for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to save push subscription:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(endpoint: string): Promise<boolean> {
    try {
      await query(
        'UPDATE push_subscriptions SET is_active = FALSE WHERE endpoint = $1',
        [endpoint]
      );
      console.log('Push subscription deactivated');
      return true;
    } catch (error) {
      console.error('Failed to deactivate push subscription:', error);
      return false;
    }
  }

  /**
   * Unsubscribe all subscriptions for a user
   */
  async unsubscribeUser(userId: number): Promise<boolean> {
    try {
      await query(
        'UPDATE push_subscriptions SET is_active = FALSE WHERE user_id = $1',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
      return false;
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: number, payload: PushPayload): Promise<number> {
    if (!this.isConfigured) {
      console.warn('Push notifications not configured, skipping');
      return 0;
    }

    try {
      const result = await query(
        'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1 AND is_active = TRUE',
        [userId]
      );

      if (result.rows.length === 0) {
        return 0;
      }

      let sentCount = 0;
      const failedIds: number[] = [];

      for (const row of result.rows) {
        const subscription = {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        };

        try {
          await this.sendNotification(subscription, payload);
          sentCount++;

          // Update last_used_at
          await query(
            'UPDATE push_subscriptions SET last_used_at = NOW() WHERE id = $1',
            [row.id]
          );
        } catch (error: any) {
          console.error(`Failed to send push to subscription ${row.id}:`, error.message);

          // If subscription is invalid (410 Gone or 404), mark as inactive
          if (error.statusCode === 410 || error.statusCode === 404) {
            failedIds.push(row.id);
          }
        }
      }

      // Deactivate invalid subscriptions
      if (failedIds.length > 0) {
        await query(
          'UPDATE push_subscriptions SET is_active = FALSE WHERE id = ANY($1)',
          [failedIds]
        );
      }

      console.log(`Sent push notification to user ${userId}: ${sentCount}/${result.rows.length} successful`);
      return sentCount;
    } catch (error) {
      console.error('Failed to send push to user:', error);
      return 0;
    }
  }

  /**
   * Send push notification to all users with a specific role
   */
  async sendToRole(role: string, payload: PushPayload): Promise<number> {
    if (!this.isConfigured) {
      return 0;
    }

    try {
      const result = await query(
        `SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
         FROM push_subscriptions ps
         JOIN users u ON ps.user_id = u.id
         WHERE u.role = $1 AND ps.is_active = TRUE`,
        [role]
      );

      let sentCount = 0;
      const failedIds: number[] = [];

      for (const row of result.rows) {
        const subscription = {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        };

        try {
          await this.sendNotification(subscription, payload);
          sentCount++;
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            failedIds.push(row.id);
          }
        }
      }

      if (failedIds.length > 0) {
        await query(
          'UPDATE push_subscriptions SET is_active = FALSE WHERE id = ANY($1)',
          [failedIds]
        );
      }

      console.log(`Sent push notification to role ${role}: ${sentCount}/${result.rows.length} successful`);
      return sentCount;
    } catch (error) {
      console.error('Failed to send push to role:', error);
      return 0;
    }
  }

  /**
   * Broadcast push notification to all active subscriptions
   */
  async broadcast(payload: PushPayload): Promise<number> {
    if (!this.isConfigured) {
      return 0;
    }

    try {
      const result = await query(
        'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE is_active = TRUE'
      );

      let sentCount = 0;
      const failedIds: number[] = [];

      for (const row of result.rows) {
        const subscription = {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        };

        try {
          await this.sendNotification(subscription, payload);
          sentCount++;
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            failedIds.push(row.id);
          }
        }
      }

      if (failedIds.length > 0) {
        await query(
          'UPDATE push_subscriptions SET is_active = FALSE WHERE id = ANY($1)',
          [failedIds]
        );
      }

      console.log(`Broadcast push notification: ${sentCount}/${result.rows.length} successful`);
      return sentCount;
    } catch (error) {
      console.error('Failed to broadcast push:', error);
      return 0;
    }
  }

  /**
   * Internal method to send a notification
   */
  private async sendNotification(subscription: PushSubscriptionData, payload: PushPayload): Promise<void> {
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      tag: payload.tag,
      data: payload.data,
      actions: payload.actions,
    });

    console.log('[PUSH] Sending to endpoint:', subscription.endpoint.substring(0, 60) + '...');
    console.log('[PUSH] Payload:', notificationPayload);

    const result = await webpush.sendNotification(subscription, notificationPayload, {
      TTL: 60 * 60, // 1 hour
      urgency: 'high',
    });

    console.log('[PUSH] Response status:', result.statusCode);
    console.log('[PUSH] Response headers:', JSON.stringify(result.headers));
    console.log('[PUSH] Response body:', result.body);
  }

  /**
   * Clean up old inactive subscriptions (older than 30 days)
   */
  async cleanup(): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM push_subscriptions
         WHERE is_active = FALSE AND last_used_at < NOW() - INTERVAL '30 days'
         RETURNING id`
      );
      console.log(`Cleaned up ${result.rowCount} old push subscriptions`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to cleanup push subscriptions:', error);
      return 0;
    }
  }
}
