import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { TopProductsDto } from '../dto/AnalyticsDto.js';

export interface GetTopProductsRequest {
  limit?: number; // Default 10
  fromDate?: string;
  toDate?: string;
}

export class GetTopProductsHandler implements UseCase<GetTopProductsRequest, TopProductsDto> {
  async execute(request: GetTopProductsRequest): Promise<Result<TopProductsDto>> {
    try {
      const limit = request.limit || 10;
      const fromDate = request.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = request.toDate || new Date().toISOString().split('T')[0];

      const result = await query(
        `SELECT
          p.id as product_id,
          p.name as product_name,
          p.sku,
          c.name as category_name,
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.subtotal) as total_revenue,
          COUNT(DISTINCT o.id) as orders_count
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         JOIN products p ON oi.product_id = p.id
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE o.status = 'delivered'
           AND o.created_at >= $1::date
           AND o.created_at < ($2::date + INTERVAL '1 day')
         GROUP BY p.id, p.name, p.sku, c.name
         ORDER BY total_revenue DESC
         LIMIT $3`,
        [fromDate, toDate, limit]
      );

      const products = result.rows.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        sku: row.sku,
        categoryName: row.category_name,
        totalQuantitySold: parseInt(row.total_quantity_sold),
        totalRevenue: parseFloat(row.total_revenue),
        ordersCount: parseInt(row.orders_count),
      }));

      return Result.ok({
        products,
        period: {
          from: fromDate,
          to: toDate,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get top products');
    }
  }
}
