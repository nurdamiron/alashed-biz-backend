import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function fiscalRoutes(app: FastifyInstance): Promise<void> {
  const container = getContainer();

  // POST /api/fiscal/receipts
  app.post(
    '/fiscal/receipts',
    {
      preHandler: [authMiddleware],
      schema: {
        body: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'integer' },
            cashierId: { type: 'integer' },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await container.createFiscalReceiptHandler.execute(request.body as any);

      if (result.isFailure) {
        return reply.status(400).send({ error: result.error });
      }

      return reply.status(201).send(result.value);
    }
  );

  // GET /api/fiscal/receipts/:orderId
  app.get(
    '/fiscal/receipts/:orderId',
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: 'object',
          required: ['orderId'],
          properties: {
            orderId: { type: 'integer' },
          },
        },
      },
    },
    async (request, reply) => {
      const { orderId } = request.params as { orderId: number };

      const result = await container.getFiscalReceiptByOrderIdHandler.execute({ orderId });

      if (result.isFailure) {
        return reply.status(404).send({ error: result.error });
      }

      return reply.send(result.value);
    }
  );
}
