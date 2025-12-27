import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function inventoryRoutes(app: FastifyInstance): Promise<void> {
  const c = getContainer();

  app.get('/inventory', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { categoryId, brandId, isLowStock, isOutOfStock, limit, offset } = req.query as any;
    const result = await c.getProductsHandler.execute({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      brandId: brandId ? parseInt(brandId) : undefined,
      isLowStock: isLowStock === 'true', isOutOfStock: isOutOfStock === 'true',
      limit: limit ? parseInt(limit) : 50, offset: offset ? parseInt(offset) : 0,
    });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  app.get('/inventory/search', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { q } = req.query as { q: string };
    const result = await c.searchProductsHandler.execute({ query: q || '' });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  app.get('/inventory/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { id } = req.params as { id: number };
    const result = await c.getProductByIdHandler.execute({ productId: id });
    return result.isFailure ? reply.status(404).send({ error: result.error }) : reply.send(result.value);
  });

  app.put('/inventory/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { id } = req.params as { id: number };
    const result = await c.updateProductHandler.execute({ productId: id, ...(req.body as any) });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  app.put('/inventory/:id/stock', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { id } = req.params as { id: number };
    const { delta, reason } = req.body as { delta: number; reason?: string };
    const result = await c.adjustStockHandler.execute({ productId: id, delta, reason, userId: req.user?.userId });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  app.get('/inventory/:id/logs', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { id } = req.params as { id: number };
    const result = await c.getStockLogsHandler.execute({ productId: id });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });
}
