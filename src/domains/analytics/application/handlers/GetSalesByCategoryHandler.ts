import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { SalesByCategoryReportDto } from '../dto/AnalyticsDto.js';

export interface GetSalesByCategoryRequest {
  fromDate?: string;
  toDate?: string;
}

export class GetSalesByCategoryHandler implements UseCase<GetSalesByCategoryRequest, SalesByCategoryReportDto> {
  async execute(request: GetSalesByCategoryRequest): Promise<Result<SalesByCategoryReportDto>> {
    try {
      const fromDate = request.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = request.toDate || new Date().toISOString().split('T')[0];

      const result = await query(
        `SELECT
          c.id as category_id,
          c.name as category_name,
          SUM(oi.subtotal) as total_revenue,
          SUM(oi.quantity) as total_quantity_sold,
          COUNT(DISTINCT o.id) as orders_count
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE o.status = 'delivered'
           AND o.created_at >= $1::date
           AND o.created_at < ($2::date + INTERVAL '1 day')
         GROUP BY c.id, c.name
         ORDER BY total_revenue DESC`,
        [fromDate, toDate]
      );

      const totalRevenue = result.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0);

      const categories = result.rows.map((row) => ({
        categoryId: row.category_id,
        categoryName: row.category_name || 'Без категории',
        totalRevenue: parseFloat(row.total_revenue) || 0,
        totalQuantitySold: parseInt(row.total_quantity_sold) || 0,
        ordersCount: parseInt(row.orders_count) || 0,
        percentage: totalRevenue > 0 ? (parseFloat(row.total_revenue) / totalRevenue) * 100 : 0,
      }));

      return Result.ok({
        categories,
        totalRevenue,
        period: {
          from: fromDate,
          to: toDate,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get sales by category');
    }
  }
}
