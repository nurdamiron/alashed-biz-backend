import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { ordersRoutes } from './orders.routes.js';
import { tasksRoutes } from './tasks.routes.js';
import { inventoryRoutes } from './inventory.routes.js';
import { analyticsRoutes } from './analytics.routes.js';
import { staffRoutes } from './staff.routes.js';
import { employeesRoutes } from './employees.routes.js';
import { notificationsRoutes } from './notifications.routes.js';
import { pushRoutes } from './push.routes.js';
import { aiRoutes } from './ai.routes.js';
import { suppliersRoutes } from './suppliers.routes.js';
import { fiscalRoutes } from './fiscal.routes.js';
import { websocketRoutes } from './websocket.routes.js';
import { uploadRoutes } from './upload.routes.js';
import { reportsRoutes } from './reports.routes.js';
import { smsRoutes } from './sms.routes.js';

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

  // Register all domain routes with /api prefix
  await app.register(async (api) => {
    await api.register(authRoutes);
    await api.register(ordersRoutes);
    await api.register(tasksRoutes);
    await api.register(inventoryRoutes);
    await api.register(suppliersRoutes);
    await api.register(fiscalRoutes);
    await api.register(analyticsRoutes);
    await api.register(staffRoutes); // Legacy
    await api.register(employeesRoutes); // New CRUD API
    await api.register(notificationsRoutes);
    await api.register(pushRoutes);
    await api.register(aiRoutes);
    await api.register(uploadRoutes);
    await api.register(reportsRoutes);
    await api.register(smsRoutes);
  }, { prefix: '/api' });

  // WebSocket (without /api prefix)
  await app.register(websocketRoutes);
}
