import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { LowStockReportDto } from '../dto/AnalyticsDto.js';

export class GetLowStockReportHandler implements UseCase<void, LowStockReportDto> {
  async execute(): Promise<Result<LowStockReportDto>> {
    try {
      const result = await query(
        `SELECT
          p.id as product_id,
          p.name as product_name,
          p.sku,
          c.name as category_name,
          p.quantity as current_quantity,
          p.min_stock_level,
          (p.min_stock_level - p.quantity) as difference,
          s.name as supplier_name,
          (SELECT MAX(sh.created_at)
           FROM stock_history sh
           WHERE sh.product_id = p.id
           AND sh.quantity_change > 0
           AND sh.document_type = 'receipt') as last_restock_date
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN suppliers s ON p.supplier_id = s.id
         WHERE p.is_active = true
           AND p.quantity <= p.min_stock_level
         ORDER BY
           CASE WHEN p.quantity = 0 THEN 0 ELSE 1 END,
           (p.min_stock_level - p.quantity) DESC`
      );

      const items = result.rows.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        sku: row.sku,
        categoryName: row.category_name,
        currentQuantity: parseInt(row.current_quantity),
        minStockLevel: parseInt(row.min_stock_level),
        difference: parseInt(row.difference),
        supplierName: row.supplier_name,
        lastRestockDate: row.last_restock_date ? new Date(row.last_restock_date).toISOString() : undefined,
      }));

      const outOfStockCount = items.filter((item) => item.currentQuantity === 0).length;
      const lowStockCount = items.filter((item) => item.currentQuantity > 0).length;

      return Result.ok({
        items,
        outOfStockCount,
        lowStockCount,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get low stock report');
    }
  }
}
