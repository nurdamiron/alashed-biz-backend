import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { ProductLocation } from '../../domain/entities/ProductLocation.js';

interface GetProductLocationsRequest {
  productId: number;
}

interface ProductLocationDto {
  id: number;
  productId: number;
  locationId: number;
  locationCode: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
  createdAt: string;
  updatedAt: string;
}

export class GetProductLocationsHandler implements UseCase<GetProductLocationsRequest, ProductLocationDto[]> {
  async execute(request: GetProductLocationsRequest): Promise<Result<ProductLocationDto[]>> {
    try {
      const result = await query(
        `SELECT pl.*, wl.code as location_code
         FROM product_locations pl
         JOIN warehouse_locations wl ON pl.location_id = wl.id
         WHERE pl.product_id = $1 AND pl.quantity > 0
         ORDER BY wl.code ASC`,
        [request.productId]
      );

      const locations = result.rows.map((row) => {
        const loc = ProductLocation.fromPersistence(row);
        return {
          id: loc.id!,
          productId: loc.productId,
          locationId: loc.locationId,
          locationCode: loc.locationCode!,
          quantity: loc.quantity,
          reservedQty: loc.reservedQty,
          availableQty: loc.availableQty,
          createdAt: loc.createdAt.toISOString(),
          updatedAt: loc.updatedAt.toISOString(),
        };
      });

      return Result.ok(locations);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get product locations');
    }
  }
}
