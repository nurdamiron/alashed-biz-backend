import { FastifyInstance } from 'fastify';
import { authMiddleware, getAuthUser } from '../../middleware/authMiddleware.js';
import { PdfReportService } from '../../domains/reports/infrastructure/services/PdfReportService.js';
import { query } from '../../shared/infrastructure/database/PostgresConnection.js';

export async function reportsRoutes(app: FastifyInstance): Promise<void> {
  const pdfService = new PdfReportService();

  // GET /api/reports/order/:id - Download order receipt as PDF
  app.get<{ Params: { id: string } }>(
    '/reports/order/:id',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { id } = request.params;

      // Get order with items
      const orderResult = await query(
        `SELECT o.id, o.total, o.status, o.created_at,
                c.name as customer_name, c.phone as customer_phone
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.id
         WHERE o.id = $1`,
        [id]
      );

      if (orderResult.rows.length === 0) {
        return reply.status(404).send({ error: 'Order not found' });
      }

      const order = orderResult.rows[0];

      // Get order items
      const itemsResult = await query(
        `SELECT oi.quantity, oi.unit_price as price, p.name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [id]
      );

      const pdfData = {
        id: order.id,
        customerName: order.customer_name || 'Клиент',
        customerPhone: order.customer_phone || '-',
        total: parseFloat(order.total),
        status: order.status,
        createdAt: order.created_at,
        items: itemsResult.rows.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
        })),
      };

      const pdfBuffer = await pdfService.generateOrderReceipt(pdfData);

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="order-${id}.pdf"`)
        .send(pdfBuffer);
    }
  );

  // GET /api/reports/sales - Download sales report as PDF
  app.get<{ Querystring: { fromDate?: string; toDate?: string } }>(
    '/reports/sales',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const user = getAuthUser(request);
      if (user.role !== 'admin' && user.role !== 'manager') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const { fromDate, toDate } = request.query;
      const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = toDate || new Date().toISOString().split('T')[0];

      // Get summary
      const summaryResult = await query(
        `SELECT
           COALESCE(SUM(total), 0) as total_revenue,
           COUNT(*) as total_orders,
           COALESCE(AVG(total), 0) as avg_order_value
         FROM orders
         WHERE status NOT IN ('cancelled')
           AND created_at >= $1 AND created_at <= $2`,
        [from, to + ' 23:59:59']
      );

      // Get top products
      const topProductsResult = await query(
        `SELECT p.name,
                SUM(oi.quantity) as quantity,
                SUM(oi.quantity * oi.unit_price) as revenue
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.status NOT IN ('cancelled')
           AND o.created_at >= $1 AND o.created_at <= $2
         GROUP BY p.id, p.name
         ORDER BY revenue DESC
         LIMIT 10`,
        [from, to + ' 23:59:59']
      );

      // Get sales by day
      const salesByDayResult = await query(
        `SELECT
           DATE(created_at) as date,
           COALESCE(SUM(total), 0) as revenue,
           COUNT(*) as orders
         FROM orders
         WHERE status NOT IN ('cancelled')
           AND created_at >= $1 AND created_at <= $2
         GROUP BY DATE(created_at)
         ORDER BY date DESC`,
        [from, to + ' 23:59:59']
      );

      const summary = summaryResult.rows[0];
      const reportData = {
        period: `${from} - ${to}`,
        totalRevenue: parseFloat(summary.total_revenue),
        totalOrders: parseInt(summary.total_orders),
        averageOrderValue: parseFloat(summary.avg_order_value),
        topProducts: topProductsResult.rows.map((p) => ({
          name: p.name,
          quantity: parseInt(p.quantity),
          revenue: parseFloat(p.revenue),
        })),
        salesByDay: salesByDayResult.rows.map((d) => ({
          date: new Date(d.date).toLocaleDateString('ru-RU'),
          revenue: parseFloat(d.revenue),
          orders: parseInt(d.orders),
        })),
      };

      const pdfBuffer = await pdfService.generateSalesReport(reportData);

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="sales-report-${from}-${to}.pdf"`)
        .send(pdfBuffer);
    }
  );

  // GET /api/reports/inventory - Download inventory report as PDF
  app.get<{ Querystring: { lowStock?: string } }>(
    '/reports/inventory',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { lowStock } = request.query;

      let sql = `
        SELECT id, name, sku, stock_quantity as stock,
               min_stock_level as min_stock, price, category
        FROM products
        WHERE is_active = TRUE
      `;

      if (lowStock === 'true') {
        sql += ' AND stock_quantity <= min_stock_level';
      }

      sql += ' ORDER BY stock_quantity ASC';

      const result = await query(sql);

      const items = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        sku: row.sku || '',
        stock: row.stock,
        minStock: row.min_stock || 0,
        price: parseFloat(row.price),
        category: row.category || '',
      }));

      const title = lowStock === 'true' ? 'Товары с низким остатком' : 'Отчёт по складу';
      const pdfBuffer = await pdfService.generateInventoryReport(items, title);

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="inventory-report.pdf"`)
        .send(pdfBuffer);
    }
  );

  // GET /api/reports/orders - Download orders list as PDF
  app.get<{ Querystring: { fromDate?: string; toDate?: string; status?: string } }>(
    '/reports/orders',
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const user = getAuthUser(request);
      if (user.role !== 'admin' && user.role !== 'manager') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const { fromDate, toDate, status } = request.query;
      const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const to = toDate || new Date().toISOString().split('T')[0];

      let sql = `
        SELECT o.id, o.total, o.status, o.created_at,
               c.name as customer_name, c.phone as customer_phone
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        WHERE o.created_at >= $1 AND o.created_at <= $2
      `;
      const params: any[] = [from, to + ' 23:59:59'];

      if (status) {
        sql += ' AND o.status = $3';
        params.push(status);
      }

      sql += ' ORDER BY o.created_at DESC';

      const result = await query(sql, params);

      const orders = result.rows.map((row) => ({
        id: row.id,
        customerName: row.customer_name || 'Клиент',
        customerPhone: row.customer_phone || '-',
        total: parseFloat(row.total),
        status: row.status,
        createdAt: row.created_at,
        items: [],
      }));

      const pdfBuffer = await pdfService.generateOrdersReport(orders, `${from} - ${to}`);

      return reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="orders-report-${from}-${to}.pdf"`)
        .send(pdfBuffer);
    }
  );
}
