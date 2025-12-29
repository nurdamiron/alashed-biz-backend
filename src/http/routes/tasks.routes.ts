import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function tasksRoutes(app: FastifyInstance): Promise<void> {
  const container = getContainer();

  app.get('/tasks', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { status, assigneeId, priority, limit, offset } = request.query as any;
    const result = await container.getTasksHandler.execute({
      status, assigneeId: assigneeId ? parseInt(assigneeId, 10) : undefined,
      priority, limit: limit ? parseInt(limit, 10) : 50, offset: offset ? parseInt(offset, 10) : 0,
    });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  app.post('/tasks', { preHandler: [authMiddleware] }, async (request, reply) => {
    const result = await container.createTaskHandler.execute({ ...(request.body as any), createdById: request.user?.userId });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.status(201).send(result.value);
  });

  app.get('/tasks/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const result = await container.getTaskByIdHandler.execute({ taskId: id });
    return result.isFailure ? reply.status(404).send({ error: result.error }) : reply.send(result.value);
  });

  app.put('/tasks/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const result = await container.updateTaskHandler.execute({ taskId: id, ...(request.body as any) });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  app.delete('/tasks/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const result = await container.deleteTaskHandler.execute({ taskId: id });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send({ success: true });
  });

  app.put('/tasks/:id/status', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const { status } = request.body as { status: string };
    const result = await container.updateTaskStatusHandler.execute({ taskId: id, status });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  app.post('/tasks/:id/comments', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const { comment } = request.body as { comment: string };
    const result = await container.addTaskCommentHandler.execute({ taskId: id, userId: request.user!.userId, comment });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.status(201).send(result.value);
  });
}
