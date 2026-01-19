import { FastifyInstance } from 'fastify';
import { getContainer } from '../../di/container.js';
import { authMiddleware, getAuthUser } from '../../middleware/authMiddleware.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const container = getContainer();

  // POST /api/auth/login (with stricter rate limit for brute force protection)
  app.post('/auth/login', {
    config: {
      rateLimit: {
        max: 5, // Only 5 login attempts
        timeWindow: '5 minutes',
        keyGenerator: (request) => request.ip, // Always by IP for login
        errorResponseBuilder: () => ({
          error: 'Too Many Login Attempts',
          message: 'Слишком много попыток входа. Попробуйте через 5 минут.',
        }),
      },
    },
  }, async (request, reply) => {
    const { username, password } = request.body as { username: string; password: string };

    const result = await container.loginHandler.execute({ username, password });

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
    const user = getAuthUser(request);
    const result = await container.getCurrentUserHandler.execute({
      userId: user.userId,
    });

    if (result.isFailure) {
      return reply.status(404).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // POST /api/auth/refresh
  app.post('/auth/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    const result = await container.refreshTokenHandler.execute({ refreshToken });

    if (result.isFailure) {
      return reply.status(401).send({ error: result.error });
    }

    return reply.send(result.value);
  });

  // PUT /api/auth/preferences
  app.put('/auth/preferences', {
    preHandler: [authMiddleware],
    schema: {
      body: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { theme } = request.body as { theme?: 'light' | 'dark' };
    const user = getAuthUser(request);

    const result = await container.updateUserPreferencesHandler.execute({
      userId: user.userId,
      theme,
    });

    if (result.isFailure) {
      return reply.status(400).send({ error: result.error });
    }

    return reply.send({ success: true });
  });
}
