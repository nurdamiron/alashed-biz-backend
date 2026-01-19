import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config/index.js';
import { registerRoutes } from './http/routes/index.js';
import { initContainer } from './di/container.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: config.isDev
      ? {
          level: 'info',
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          },
        }
      : {
          level: 'warn',
          // Structured JSON logs for production
          formatters: {
            level: (label) => ({ level: label }),
            bindings: (bindings) => ({
              pid: bindings.pid,
              host: bindings.hostname,
              service: 'alashed-api',
              version: '2.0.0',
            }),
          },
          timestamp: () => `,"time":"${new Date().toISOString()}"`,
        },
  });

  // CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return cb(null, true);
      }

      const allowedOrigins = config.cors.allowedOrigins || [];
      // Allow if origin matches any allowed origin
      if (allowedOrigins.some(allowed => origin.includes(allowed.replace(/https?:\/\//, '')))) {
        return cb(null, true);
      }

      // Allow localhost in development
      if (config.isDev && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return cb(null, true);
      }

      // Allow Vercel preview deployments
      if (origin.includes('vercel.app')) {
        return cb(null, true);
      }

      cb(null, true); // Allow all for now, tighten later if needed
    },
    credentials: true,
  });

  // JWT
  await app.register(jwt, {
    secret: config.jwt.secret,
  });

  // Rate Limiting (simplified)
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // WebSocket
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
    },
  });

  // Multipart (File Uploads)
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });

  // Static files (Serve uploads)
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
  });

  // Swagger / OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Alashed Business API',
        description: 'Orders, Tasks, Inventory Management API',
        version: '2.0.0',
      },
      servers: [
        {
          url: config.isDev ? `http://localhost:${config.port}` : 'https://api.yourdomain.com',
        },
      ],
      components: {
        securitySchemes: {
          Bearer: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Initialize DI container
  initContainer();

  // Register routes
  await registerRoutes(app);

  // Request logging hook
  app.addHook('onRequest', async (request) => {
    request.log.info({
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    }, 'incoming request');
  });

  // Response logging hook
  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    }, 'request completed');
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error({
      err: error,
      method: request.method,
      url: request.url,
      statusCode: error.statusCode || 500,
    }, 'request error');

    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        details: error.validation,
      });
    }

    return reply.status(error.statusCode || 500).send({
      error: config.isDev ? error.message : 'Internal Server Error',
    });
  });

  return app;
}
