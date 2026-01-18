import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: string;
}

export function getAuthUser(request: FastifyRequest): AuthenticatedUser {
  return (request as any).user as AuthenticatedUser;
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();

    const payload = request.user as any;
    (request as any).user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    } as AuthenticatedUser;
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = (request as any).user as AuthenticatedUser | undefined;
    if (!user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(user.role)) {
      reply.status(403).send({ error: 'Forbidden' });
      return;
    }
  };
}
