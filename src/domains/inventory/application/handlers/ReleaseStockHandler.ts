import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query, transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export interface ReleaseStockRequest {
  orderId: number;
  reason?: string;
}

/**
 * Освобождает зарезервированный товар обратно на склад
 * Используется при отмене заказа
 */
export class ReleaseStockHandler implements UseCase<ReleaseStockRequest, void> {
  async execute(request: ReleaseStockRequest): Promise<Result<void>> {
    try {
      return await transaction(async (client) => {
        // Найти все активные резервирования для заказа
        const reservationsResult = await client.query(
          `SELECT id, product_id, quantity FROM stock_reservations
           WHERE order_id = $1 AND status = 'active'`,
          [request.orderId]
        );

        if (reservationsResult.rows.length === 0) {
          return Result.ok(undefined); // Нет активных резервирований
        }

        // Вернуть товары на склад
        for (const reservation of reservationsResult.rows) {
          const { product_id, quantity } = reservation;

          // Получить текущее количество
          const productResult = await client.query(
            `SELECT quantity FROM products WHERE id = $1`,
            [product_id]
          );

          if (productResult.rows.length === 0) {
            continue; // Товар удален, пропускаем
          }

          const currentQty = productResult.rows[0].quantity;

          // Вернуть товар на склад
          await client.query(
            `UPDATE products SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2`,
            [quantity, product_id]
          );

          // Обновить статус резервирования
          await client.query(
            `UPDATE stock_reservations SET status = 'released', released_at = NOW(), notes = $1 WHERE id = $2`,
            [request.reason || 'Заказ отменен', reservation.id]
          );

          // Добавить запись в историю
          await client.query(
            `INSERT INTO stock_history (product_id, quantity_change, quantity_before, quantity_after, reason, document_type, created_at)
             VALUES ($1, $2, $3, $4, $5, 'return', NOW())`,
            [
              product_id,
              quantity,
              currentQty,
              currentQty + quantity,
              request.reason || `Отмена резервирования для заказа #${request.orderId}`,
            ]
          );
        }

        return Result.ok(undefined);
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to release stock');
    }
  }
}
