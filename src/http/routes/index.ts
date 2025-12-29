import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { ordersRoutes } from './orders.routes.js';
import { tasksRoutes } from './tasks.routes.js';
import { inventoryRoutes } from './inventory.routes.js';
import { analyticsRoutes } from './analytics.routes.js';
import { staffRoutes } from './staff.routes.js';
import { employeesRoutes } from './employees.routes.js';
import { notificationsRoutes } from './notifications.routes.js';
import { aiRoutes } from './ai.routes.js';
import { suppliersRoutes } from './suppliers.routes.js';
import { fiscalRoutes } from './fiscal.routes.js';
import { websocketRoutes } from './websocket.routes.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  }));

  // API info
  app.get('/', async () => ({
    name: 'Alashed Business API',
    version: '2.0.0',
    docs: '/docs',
  }));

  // Register all domain routes
  await app.register(authRoutes);
  await app.register(ordersRoutes);
  await app.register(tasksRoutes);
  await app.register(inventoryRoutes);
  await app.register(suppliersRoutes);
  await app.register(fiscalRoutes);
  await app.register(analyticsRoutes);
  await app.register(staffRoutes); // Legacy
  await app.register(employeesRoutes); // New CRUD API
  await app.register(notificationsRoutes);
  await app.register(aiRoutes);
  await app.register(websocketRoutes); // WebSocket for real-time updates
}
