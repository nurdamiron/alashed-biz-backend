import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware, getAuthUser } from '../../middleware/authMiddleware.js';

interface SubscribeBody {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

interface UnsubscribeBody {
  endpoint: string;
}

export async function pushRoutes(app: FastifyInstance): Promise<void> {
  const c = getContainer();

  // Get VAPID public key (no auth required)
  app.get('/push/vapid-key', async (_req, reply) => {
    const publicKey = c.pushService.getVapidPublicKey();
    if (!publicKey) {
      return reply.status(503).send({
        error: 'Push notifications not configured',
      });
    }
    return reply.send({ publicKey });
  });

  // Subscribe to push notifications
  app.post<{ Body: SubscribeBody }>(
    '/push/subscribe',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);
      const { subscription } = req.body;

      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return reply.status(400).send({
          error: 'Invalid subscription data',
        });
      }

      const userAgent = req.headers['user-agent'];
      const success = await c.pushService.subscribe(user.userId, subscription, userAgent);

      if (success) {
        return reply.send({ success: true, message: 'Subscribed to push notifications' });
      } else {
        return reply.status(500).send({ error: 'Failed to subscribe' });
      }
    }
  );

  // Unsubscribe from push notifications
  app.post<{ Body: UnsubscribeBody }>(
    '/push/unsubscribe',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const { endpoint } = req.body;

      if (!endpoint) {
        return reply.status(400).send({ error: 'Endpoint is required' });
      }

      const success = await c.pushService.unsubscribe(endpoint);

      if (success) {
        return reply.send({ success: true, message: 'Unsubscribed from push notifications' });
      } else {
        return reply.status(500).send({ error: 'Failed to unsubscribe' });
      }
    }
  );

  // Unsubscribe all devices for current user
  app.delete(
    '/push/unsubscribe-all',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);
      const success = await c.pushService.unsubscribeUser(user.userId);

      if (success) {
        return reply.send({ success: true, message: 'Unsubscribed all devices' });
      } else {
        return reply.status(500).send({ error: 'Failed to unsubscribe' });
      }
    }
  );

  // Test push notification (admin only)
  app.post(
    '/push/test',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);

      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const count = await c.pushService.sendToUser(user.userId, {
        title: 'Тестовое уведомление',
        body: 'Push-уведомления работают!',
        tag: 'test',
        data: {
          url: '/',
          type: 'test',
        },
      });

      return reply.send({
        success: count > 0,
        message: count > 0 ? `Sent to ${count} device(s)` : 'No active subscriptions found',
      });
    }
  );

  // Broadcast push notification (admin only)
  app.post(
    '/push/broadcast',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);

      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { title, body } = req.body as { title?: string; body?: string };

      const count = await c.pushService.broadcast({
        title: title || 'Broadcast Test',
        body: body || 'Это тестовое broadcast уведомление',
        tag: `broadcast-${Date.now()}`,
        data: {
          url: '/',
          type: 'broadcast',
        },
      });

      return reply.send({
        success: count > 0,
        message: `Broadcast sent to ${count} device(s)`,
        count,
      });
    }
  );

  // Test daily quote (admin only)
  app.post(
    '/push/test-quote',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);

      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      try {
        const quote = await c.quoteScheduler.sendTestQuote();
        return reply.send({
          success: true,
          quote,
        });
      } catch (error) {
        console.error('Test quote error:', error);
        return reply.status(500).send({ error: 'Failed to send test quote' });
      }
    }
  );

  // Debug endpoint - get subscription stats (admin only)
  app.get(
    '/push/debug',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);

      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { query } = await import('../../shared/infrastructure/database/PostgresConnection.js');

      try {
        // Get subscription stats
        const stats = await query(`
          SELECT
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE is_active = true) as active,
            COUNT(*) FILTER (WHERE endpoint LIKE '%web.push.apple.com%') as apple,
            COUNT(*) FILTER (WHERE endpoint LIKE '%fcm.googleapis.com%') as fcm
          FROM push_subscriptions
        `);

        // Get recent subscriptions with user info
        const recent = await query(`
          SELECT
            ps.id,
            ps.user_id,
            u.full_name as user_name,
            u.role as user_role,
            CASE
              WHEN ps.endpoint LIKE '%web.push.apple.com%' THEN 'Apple'
              WHEN ps.endpoint LIKE '%fcm.googleapis.com%' THEN 'FCM'
              ELSE 'Other'
            END as platform,
            ps.is_active,
            ps.created_at,
            ps.last_used_at
          FROM push_subscriptions ps
          LEFT JOIN users u ON ps.user_id = u.id
          ORDER BY ps.created_at DESC
          LIMIT 10
        `);

        return reply.send({
          stats: stats.rows[0],
          recentSubscriptions: recent.rows,
          vapidConfigured: !!c.pushService.getVapidPublicKey(),
          frontendUrl: process.env.FRONTEND_URL || 'https://biz.alashed.kz',
        });
      } catch (error) {
        console.error('Debug endpoint error:', error);
        return reply.status(500).send({ error: 'Failed to get debug info' });
      }
    }
  );
}
