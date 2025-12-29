import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query, transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { NotificationService } from '../../../notifications/infrastructure/services/NotificationService.js';

export interface ReserveStockRequest {
  orderId: number;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export class ReserveStockHandler implements UseCase<ReserveStockRequest, void> {
  constructor(private readonly notificationService: NotificationService) {}

  async execute(request: ReserveStockRequest): Promise<Result<void>> {
    try {
      return await transaction(async (client) => {
        // Проверяем наличие товаров и резервируем
        for (const item of request.items) {
          // Проверить наличие товара
          const productResult = await client.query(
            `SELECT id, name, quantity FROM products WHERE id = $1 AND is_active = true`,
            [item.productId]
          );

          if (productResult.rows.length === 0) {
            return Result.fail(`Product ${item.productId} not found or inactive`);
          }

          const product = productResult.rows[0];
          const availableQty = product.quantity;

          // Проверяем достаточно ли товара
          if (availableQty < item.quantity) {
            return Result.fail(
              `Insufficient stock for product "${product.name}". Available: ${availableQty}, Required: ${item.quantity}`
            );
          }

          const newQty = availableQty - item.quantity;

          // Уменьшаем количество товара (резервируем)
          await client.query(
            `UPDATE products SET quantity = quantity - $1, updated_at = NOW() WHERE id = $2`,
            [item.quantity, item.productId]
          );

          // Проверяем низкий остаток после резервирования
          const productWithMinStock = await client.query(
            `SELECT min_stock_level FROM products WHERE id = $1`,
            [item.productId]
          );

          if (productWithMinStock.rows.length > 0) {
            const minStockLevel = productWithMinStock.rows[0].min_stock_level;

            // Если товар закончился
            if (newQty === 0) {
              await this.notificationService.notifyOutOfStock(item.productId, product.name);
            }
            // Если ниже минимального уровня
            else if (minStockLevel && newQty <= minStockLevel) {
              await this.notificationService.notifyLowStock(
                item.productId,
                product.name,
                newQty,
                minStockLevel
              );
            }
          }

          // Создаем запись о резервировании
          await client.query(
            `INSERT INTO stock_reservations (order_id, product_id, quantity, status, reserved_at, expires_at)
             VALUES ($1, $2, $3, 'active', NOW(), NOW() + INTERVAL '24 hours')`,
            [request.orderId, item.productId, item.quantity]
          );

          // Добавляем запись в историю
          await client.query(
            `INSERT INTO stock_history (product_id, quantity_change, quantity_before, quantity_after, reason, document_type, created_at)
             VALUES ($1, $2, $3, $4, $5, 'sale', NOW())`,
            [
              item.productId,
              -item.quantity,
              availableQty,
              availableQty - item.quantity,
              `Резервирование для заказа #${request.orderId}`,
            ]
          );
        }

        return Result.ok(undefined);
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to reserve stock');
    }
  }
}
