import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function aiRoutes(app: FastifyInstance): Promise<void> {
  const c = getContainer();
  app.post('/ai/chat', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { message, history } = req.body as { message: string; history?: any[] };
    const result = await c.sendMessageHandler.execute({ message, history });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });
}
