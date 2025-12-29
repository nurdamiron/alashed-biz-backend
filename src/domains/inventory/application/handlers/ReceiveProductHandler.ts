import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';

interface ReceiveProductRequest {
  productId: number;
  locationId: number;
  quantity: number;
  supplierId?: number;
  documentNumber?: string;
  notes?: string;
  userId?: number;
}

export class ReceiveProductHandler implements UseCase<ReceiveProductRequest, void> {
  async execute(request: ReceiveProductRequest): Promise<Result<void>> {
    try {
      await transaction(async (client) => {
        // 1. Обновить общее количество товара
        await client.query(
          'UPDATE products SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2',
          [request.quantity, request.productId]
        );

        // 2. Добавить/обновить product_locations
        const existingLocation = await client.query(
          'SELECT id, quantity FROM product_locations WHERE product_id = $1 AND location_id = $2',
          [request.productId, request.locationId]
        );

        if (existingLocation.rows.length > 0) {
          // Обновить существующую локацию
          await client.query(
            'UPDATE product_locations SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2',
            [request.quantity, existingLocation.rows[0].id]
          );
        } else {
          // Создать новую запись
          await client.query(
            `INSERT INTO product_locations (product_id, location_id, quantity, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [request.productId, request.locationId, request.quantity]
          );
        }

        // 3. Записать в stock_history
        const product = await client.query('SELECT quantity FROM products WHERE id = $1', [request.productId]);
        const newQty = parseInt(product.rows[0].quantity);

        await client.query(
          `INSERT INTO stock_history (product_id, quantity_change, quantity_before, quantity_after, reason, user_id, supplier_id, location_id, document_type, document_number, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [
            request.productId,
            request.quantity,
            newQty - request.quantity,
            newQty,
            request.notes || 'Приемка товара',
            request.userId,
            request.supplierId,
            request.locationId,
            'receipt',
            request.documentNumber,
          ]
        );
      });

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to receive product');
    }
  }
}
