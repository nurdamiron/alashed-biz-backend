import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const container = getContainer();

  // POST /api/auth/login
  app.post('/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                employeeId: { type: 'number', nullable: true },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    const result = await container.loginHandler.execute({ email, password });

    if (result.isFailure) {
      return reply.status(401).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // GET /api/auth/me
  app.get('/auth/me', {
    preHandler: [authMiddleware],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            employeeId: { type: 'number', nullable: true },
          },
        },
      },
    },
  }, async (request, reply) => {
    const result = await container.getCurrentUserHandler.execute({
      userId: request.user!.userId,
    });

    if (result.isFailure) {
      return reply.status(404).send({ error: result.error });
    }

    return reply.send(result.value);
  });
}
