import { FastifyReply } from 'fastify';

export class HttpResponse {
  static ok<T>(reply: FastifyReply, data: T): FastifyReply {
    return reply.status(200).send(data);
  }

  static created<T>(reply: FastifyReply, data: T): FastifyReply {
    return reply.status(201).send(data);
  }

  static noContent(reply: FastifyReply): FastifyReply {
    return reply.status(204).send();
  }

  static badRequest(reply: FastifyReply, message: string, errors?: Record<string, string>): FastifyReply {
    return reply.status(400).send({ error: message, errors });
  }

  static unauthorized(reply: FastifyReply, message: string = 'Unauthorized'): FastifyReply {
    return reply.status(401).send({ error: message });
  }

  static forbidden(reply: FastifyReply, message: string = 'Forbidden'): FastifyReply {
    return reply.status(403).send({ error: message });
  }

  static notFound(reply: FastifyReply, message: string = 'Not found'): FastifyReply {
    return reply.status(404).send({ error: message });
  }

  static internalError(reply: FastifyReply, message: string = 'Internal server error'): FastifyReply {
    return reply.status(500).send({ error: message });
  }
}
