import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function suppliersRoutes(app: FastifyInstance): Promise<void> {
  const container = getContainer();

  // GET /api/suppliers
  app.get(
    '/suppliers',
    {
      preHandler: [authMiddleware],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean' },
            search: { type: 'string' },
            limit: { type: 'integer', default: 50 },
            offset: { type: 'integer', default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              suppliers: { type: 'array' },
              total: { type: 'integer' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { isActive, search, limit, offset } = request.query as any;

      const result = await container.getSuppliersHandler.execute({
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });

      if (result.isFailure) {
        return reply.status(400).send({ error: result.error });
      }

      return reply.send(result.value);
    }
  );

  // POST /api/suppliers
  app.post(
    '/suppliers',
    {
      preHandler: [authMiddleware],
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1 },
            tin: { type: 'string', pattern: '^\\d{12}$' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            contactPerson: { type: 'string' },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await container.createSupplierHandler.execute(request.body as any);

      if (result.isFailure) {
        return reply.status(400).send({ error: result.error });
      }

      return reply.status(201).send(result.value);
    }
  );

  // GET /api/suppliers/:id
  app.get(
    '/suppliers/:id',
    {
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
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };

      const result = await container.getSupplierByIdHandler.execute({ supplierId: id });

      if (result.isFailure) {
        return reply.status(404).send({ error: result.error });
      }

      return reply.send(result.value);
    }
  );

  // PUT /api/suppliers/:id
  app.put(
    '/suppliers/:id',
    {
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
            name: { type: 'string', minLength: 1 },
            tin: { type: 'string', pattern: '^\\d{12}$' },
            phone: { type: 'string' },
            email: { type: 'string', format: 'email' },
            address: { type: 'string' },
            contactPerson: { type: 'string' },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };

      const result = await container.updateSupplierHandler.execute({
        supplierId: id,
        ...(request.body as any),
      });

      if (result.isFailure) {
        return reply.status(400).send({ error: result.error });
      }

      return reply.send(result.value);
    }
  );

  // DELETE /api/suppliers/:id
  app.delete(
    '/suppliers/:id',
    {
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
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };

      const result = await container.deleteSupplierHandler.execute({ supplierId: id });

      if (result.isFailure) {
        return reply.status(400).send({ error: result.error });
      }

      return reply.status(204).send();
    }
  );
}
