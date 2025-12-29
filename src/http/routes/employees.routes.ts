import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function employeesRoutes(app: FastifyInstance): Promise<void> {
  const container = getContainer();

  // GET /api/employees - Список сотрудников
  app.get('/employees', {
    preHandler: [authMiddleware],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          includeInactive: { type: 'boolean' },
          department: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            employees: { type: 'array' },
            total: { type: 'integer' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { includeInactive, department } = request.query as any;

    const result = await container.getEmployeesHandler.execute({
      includeInactive: includeInactive === 'true',
      department,
    });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // POST /api/employees - Создать сотрудника
  app.post('/employees', {
    preHandler: [authMiddleware],
    schema: {
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          userId: { type: 'integer' },
          name: { type: 'string' },
          department: { type: 'string' },
          position: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
    },
  }, async (request, reply) => {
    const result = await container.createEmployeeHandler.execute(request.body as any);

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.status(201).send(result.value);
  });

  // GET /api/employees/:id - Получить сотрудника
  app.get('/employees/:id', {
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

    const result = await container.getEmployeeByIdHandler.execute({ employeeId: id });

    if (result.isFailure) {
      return reply.status(404).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // PUT /api/employees/:id - Обновить сотрудника
  app.put('/employees/:id', {
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
          name: { type: 'string' },
          department: { type: 'string' },
          position: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: number };

    const result = await container.updateEmployeeHandler.execute({
      employeeId: id,
      ...(request.body as any),
    });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // DELETE /api/employees/:id - Деактивировать сотрудника
  app.delete('/employees/:id', {
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

    const result = await container.deleteEmployeeHandler.execute({ employeeId: id });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.status(204).send();
  });
}
