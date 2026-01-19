import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware, getAuthUser } from '../../middleware/authMiddleware.js';

export async function smsRoutes(app: FastifyInstance): Promise<void> {
  const c = getContainer();

  // GET /api/sms/status - Get SMS service status
  app.get('/sms/status', { preHandler: [authMiddleware] }, async (req, reply) => {
    const user = getAuthUser(req);
    if (user.role !== 'admin') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const balance = await c.smsService.getBalance();
    return reply.send({
      enabled: c.smsService.isServiceEnabled(),
      balance,
    });
  });

  // POST /api/sms/send - Send custom SMS (admin only)
  app.post<{ Body: { phone: string; message: string } }>(
    '/sms/send',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);
      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { phone, message } = req.body;

      if (!phone || !message) {
        return reply.status(400).send({ error: 'Phone and message are required' });
      }

      const result = await c.smsService.sendCustomMessage(phone, message);
      return reply.send(result);
    }
  );

  // POST /api/sms/notify-order/:orderId - Notify customer about order
  app.post<{ Params: { orderId: string }; Body: { status?: string; reason?: string } }>(
    '/sms/notify-order/:orderId',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);
      if (user.role !== 'admin' && user.role !== 'manager') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const orderId = parseInt(req.params.orderId);
      const { status, reason } = req.body;

      if (!status) {
        // Notify about order creation
        const result = await c.smsService.notifyOrderCreated(orderId);
        if (!result) {
          return reply.status(404).send({ error: 'Order not found or customer has no phone' });
        }
        return reply.send(result);
      }

      // Notify about status change
      const result = await c.smsService.notifyOrderStatusChanged(orderId, status, reason);
      if (!result) {
        return reply.status(404).send({ error: 'Order not found or customer has no phone' });
      }
      return reply.send(result);
    }
  );

  // POST /api/sms/test - Send test SMS
  app.post<{ Body: { phone: string } }>(
    '/sms/test',
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const user = getAuthUser(req);
      if (user.role !== 'admin') {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { phone } = req.body;
      if (!phone) {
        return reply.status(400).send({ error: 'Phone is required' });
      }

      const result = await c.smsService.sendCustomMessage(
        phone,
        'Тестовое сообщение. SMS уведомления работают!'
      );
      return reply.send(result);
    }
  );
}
