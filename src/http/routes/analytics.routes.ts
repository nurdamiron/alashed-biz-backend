import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  const c = getContainer();

  // Dashboard stats
  app.get('/analytics/dashboard', { preHandler: [authMiddleware] }, async (req, reply) => {
    const result = await c.getDashboardStatsHandler.execute();
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  // Sales report with date filters
  app.get('/analytics/sales-report', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { fromDate, toDate } = req.query as { fromDate?: string; toDate?: string };
    const result = await c.getSalesReportHandler.execute({ fromDate, toDate });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  // Top products
  app.get('/analytics/top-products', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { limit, fromDate, toDate } = req.query as { limit?: number; fromDate?: string; toDate?: string };
    const result = await c.getTopProductsHandler.execute({ limit, fromDate, toDate });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  // Revenue by period (daily, weekly, monthly)
  app.get('/analytics/revenue-by-period', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { period, fromDate, toDate } = req.query as { period: 'daily' | 'weekly' | 'monthly'; fromDate?: string; toDate?: string };
    if (!period || !['daily', 'weekly', 'monthly'].includes(period)) {
      return reply.status(400).send({ error: 'Invalid period. Must be daily, weekly, or monthly' });
    }
    const result = await c.getRevenueByPeriodHandler.execute({ period, fromDate, toDate });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  // Sales by category
  app.get('/analytics/sales-by-category', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { fromDate, toDate } = req.query as { fromDate?: string; toDate?: string };
    const result = await c.getSalesByCategoryHandler.execute({ fromDate, toDate });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  // Employee performance
  app.get('/analytics/employee-performance', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { fromDate, toDate, department } = req.query as { fromDate?: string; toDate?: string; department?: string };
    const result = await c.getEmployeePerformanceHandler.execute({ fromDate, toDate, department });
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });

  // Low stock report
  app.get('/analytics/low-stock', { preHandler: [authMiddleware] }, async (req, reply) => {
    const result = await c.getLowStockReportHandler.execute();
    return result.isFailure ? reply.status(400).send({ error: result.error }) : reply.send(result.value);
  });
}
