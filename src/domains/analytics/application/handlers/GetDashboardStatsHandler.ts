import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { DashboardStatsDto } from '../dto/AnalyticsDto.js';

export class GetDashboardStatsHandler implements UseCase<void, DashboardStatsDto> {
  async execute(): Promise<Result<DashboardStatsDto>> {
    try {
      const [orders, products, tasks, customers] = await Promise.all([
        query(`SELECT COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as revenue,
          COUNT(*) as total_orders, COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders
          FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'`),
        query(`SELECT COUNT(*) as total, COUNT(CASE WHEN quantity <= min_stock_level AND quantity > 0 THEN 1 END) as low_stock,
          COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock FROM products WHERE is_active = true`),
        query(`SELECT COUNT(CASE WHEN status NOT IN ('completed', 'cancelled') THEN 1 END) as active,
          COUNT(CASE WHEN status = 'completed' AND completed_at >= CURRENT_DATE THEN 1 END) as completed_today FROM tasks`),
        query(`SELECT COUNT(*) as total FROM customers`),
      ]);
      return Result.ok({
        revenue: parseFloat(orders.rows[0].revenue) || 0, totalOrders: parseInt(orders.rows[0].total_orders) || 0,
        pendingOrders: parseInt(orders.rows[0].pending_orders) || 0, completedOrders: parseInt(orders.rows[0].completed_orders) || 0,
        lowStockCount: parseInt(products.rows[0].low_stock) || 0, outOfStockCount: parseInt(products.rows[0].out_of_stock) || 0,
        activeTasksCount: parseInt(tasks.rows[0].active) || 0, completedTasksToday: parseInt(tasks.rows[0].completed_today) || 0,
        totalProducts: parseInt(products.rows[0].total) || 0, totalCustomers: parseInt(customers.rows[0].total) || 0,
      });
    } catch (error) { return Result.fail(error instanceof Error ? error.message : 'Failed'); }
  }
}
