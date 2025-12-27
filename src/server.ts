import { buildApp } from './app.js';
import { config, validateConfig } from './config/index.js';
import { closePool } from './shared/infrastructure/database/PostgresConnection.js';

async function start(): Promise<void> {
  // Validate config
  validateConfig();

  // Build app
  const app = await buildApp();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      await closePool();
      process.exit(0);
    });
  });

  // Start server
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`
🚀 Server is running!

   Local:   http://localhost:${config.port}
   Docs:    http://localhost:${config.port}/docs
   Health:  http://localhost:${config.port}/health

   Environment: ${config.nodeEnv}
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
