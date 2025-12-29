import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { SalesReportDto } from '../dto/AnalyticsDto.js';

export interface GetSalesReportRequest {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
}

export class GetSalesReportHandler implements UseCase<GetSalesReportRequest, SalesReportDto> {
  async execute(request: GetSalesReportRequest): Promise<Result<SalesReportDto>> {
    try {
      const fromDate = request.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = request.toDate || new Date().toISOString().split('T')[0];

      const result = await query(
        `SELECT
          COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as total_revenue,
          COUNT(*) as total_orders,
          COALESCE(AVG(CASE WHEN status = 'delivered' THEN total_amount ELSE NULL END), 0) as average_order_value,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
         FROM orders
         WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')`,
        [fromDate, toDate]
      );

      const row = result.rows[0];

      return Result.ok({
        totalRevenue: parseFloat(row.total_revenue) || 0,
        totalOrders: parseInt(row.total_orders) || 0,
        averageOrderValue: parseFloat(row.average_order_value) || 0,
        completedOrders: parseInt(row.completed_orders) || 0,
        cancelledOrders: parseInt(row.cancelled_orders) || 0,
        pendingOrders: parseInt(row.pending_orders) || 0,
        period: {
          from: fromDate,
          to: toDate,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get sales report');
    }
  }
}
