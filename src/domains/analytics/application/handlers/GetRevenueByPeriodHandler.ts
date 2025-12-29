import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { RevenueByPeriodDto } from '../dto/AnalyticsDto.js';

export interface GetRevenueByPeriodRequest {
  period: 'daily' | 'weekly' | 'monthly';
  fromDate?: string;
  toDate?: string;
}

export class GetRevenueByPeriodHandler implements UseCase<GetRevenueByPeriodRequest, RevenueByPeriodDto> {
  async execute(request: GetRevenueByPeriodRequest): Promise<Result<RevenueByPeriodDto>> {
    try {
      const fromDate = request.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = request.toDate || new Date().toISOString().split('T')[0];

      let dateFormat: string;
      let groupBy: string;

      switch (request.period) {
        case 'daily':
          dateFormat = 'YYYY-MM-DD';
          groupBy = `DATE(created_at)`;
          break;
        case 'weekly':
          dateFormat = 'IYYY-"W"IW'; // ISO week format
          groupBy = `DATE_TRUNC('week', created_at)`;
          break;
        case 'monthly':
          dateFormat = 'YYYY-MM';
          groupBy = `DATE_TRUNC('month', created_at)`;
          break;
        default:
          return Result.fail('Invalid period. Must be daily, weekly, or monthly');
      }

      const result = await query(
        `SELECT
          TO_CHAR(${groupBy}, '${dateFormat}') as date,
          COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as revenue,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as orders_count,
          COALESCE(AVG(CASE WHEN status = 'delivered' THEN total_amount ELSE NULL END), 0) as average_order_value
         FROM orders
         WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
         GROUP BY ${groupBy}
         ORDER BY ${groupBy}`,
        [fromDate, toDate]
      );

      const data = result.rows.map((row) => ({
        date: row.date,
        revenue: parseFloat(row.revenue) || 0,
        ordersCount: parseInt(row.orders_count) || 0,
        averageOrderValue: parseFloat(row.average_order_value) || 0,
      }));

      const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
      const totalOrders = data.reduce((sum, item) => sum + item.ordersCount, 0);

      return Result.ok({
        data,
        period: request.period,
        totalRevenue,
        totalOrders,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get revenue by period');
    }
  }
}
