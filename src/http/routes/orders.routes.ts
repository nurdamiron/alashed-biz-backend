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
          limit: { type: 'integer', default: 50 },
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
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'customerName', 'customerPhone', 'items'],
        properties: {
          customerId: { type: 'integer' },
          customerName: { type: 'string' },
          customerPhone: { type: 'string' },
          employeeId: { type: 'integer' },
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['productId', 'productName', 'quantity', 'unitPrice'],
              properties: {
                productId: { type: 'integer' },
                productName: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
                unitPrice: { type: 'number' },
                discount: { type: 'number' },
              },
            },
          },
          paymentMethod: { type: 'string' },
          deliveryAddress: { type: 'string' },
          notes: { type: 'string' },
          discount: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    const result = await container.createOrderHandler.execute(request.body as any);

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
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };
    const { status, note } = request.body as { status: string; note?: string };

    const result = await container.updateOrderStatusHandler.execute({
      orderId: id,
      status,
      note,
    });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send(result.value);
  });
}
