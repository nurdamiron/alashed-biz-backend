import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();

    const payload = request.user as any;
    request.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(request.user.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }
  };
}
