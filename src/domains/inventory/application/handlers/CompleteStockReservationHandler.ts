import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query, transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export interface CompleteStockReservationRequest {
  orderId: number;
}

/**
 * Завершает резервирование товара при доставке заказа
 * Товар уже списан со склада при резервировании, здесь просто меняем статус
 */
export class CompleteStockReservationHandler implements UseCase<CompleteStockReservationRequest, void> {
  async execute(request: CompleteStockReservationRequest): Promise<Result<void>> {
    try {
      return await transaction(async (client) => {
        // Обновить все активные резервирования на completed
        await client.query(
          `UPDATE stock_reservations
           SET status = 'completed', released_at = NOW(), notes = 'Заказ доставлен'
           WHERE order_id = $1 AND status = 'active'`,
          [request.orderId]
        );

        return Result.ok(undefined);
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to complete stock reservation');
    }
  }
}
