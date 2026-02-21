import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function ordersRoutes(app: FastifyInstance): Promise<void> {
  const container = getContainer();

  // GET /api/orders
  app.get('/orders', {
    preHandler: [authMiddleware],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          limit: { type: 'integer' },
          offset: { type: 'integer', default: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            orders: { type: 'array' },
            total: { type: 'integer' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { status, limit, offset } = request.query as any;

    const result = await container.getOrdersHandler.execute({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // POST /api/orders
  app.post('/orders', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const body = request.body as any;
    // Normalize field names: frontend sends 'client'/'phone', backend expects 'customerName'/'customerPhone'
    const normalized = {
      ...body,
      customerName: body.customerName || body.client || '',
      customerPhone: body.customerPhone || body.phone || '',
      items: body.items || [],
    };

    if (!normalized.items || normalized.items.length === 0) {
      return reply.status(400).send({ error: 'Order must have at least one item' });
    }
    if (!normalized.customerName) {
      return reply.status(400).send({ error: 'Customer name is required' });
    }

    const result = await container.createOrderHandler.execute(normalized);

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.status(201).send(result.value);
  });

  // GET /api/orders/search
  app.get('/orders/search', {
    preHandler: [authMiddleware],
    schema: {
      querystring: {
        type: 'object',
        required: ['q'],
        properties: {
          q: { type: 'string', minLength: 2 },
        },
      },
    },
  }, async (request, reply) => {
    const { q } = request.query as { q: string };

    const result = await container.searchOrdersHandler.execute({ query: q });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // GET /api/orders/:id
  app.get('/orders/:id', {
    preHandler: [authMiddleware],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    const result = await container.getOrderByIdHandler.execute({ orderId: id });

    if (result.isFailure) {
      return reply.status(404).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // PUT /api/orders/:id/status
  app.put('/orders/:id/status', {
    preHandler: [authMiddleware],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
        },
      },
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string' },
          note: { type: 'string' },
          cashierId: { type: 'integer' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const { status, note, cashierId } = request.body as { status: string; note?: string; cashierId?: number };

    const result = await container.updateOrderStatusHandler.execute({
      orderId: id,
      status,
      note,
      cashierId,
    });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // POST /api/orders/:id/cancel
  app.post('/orders/:id/cancel', {
    preHandler: [authMiddleware],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
        },
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const { reason } = request.body as { reason?: string };

    const result = await container.cancelOrderHandler.execute({
      orderId: id,
      reason,
    });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send(result.value);
  });
}
