import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function notificationsRoutes(app: FastifyInstance): Promise<void> {
  const c = getContainer();
  app.get('/events', { preHandler: [authMiddleware] }, async (req, reply) => {
    const result = await c.getNotificationsHandler.execute({ userId: req.user!.userId });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });
  app.put('/events/read', { preHandler: [authMiddleware] }, async (req, reply) => {
    const result = await c.markAllReadHandler.execute({ userId: req.user!.userId });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });
}
