import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  const c = getContainer();
  app.get('/analytics/dashboard', { preHandler: [authMiddleware] }, async (req, reply) => {
    const result = await c.getDashboardStatsHandler.execute();
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });
}
