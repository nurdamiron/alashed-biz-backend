import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { WarehouseLocation } from '../../domain/entities/WarehouseLocation.js';

interface CreateWarehouseLocationRequest {
  code: string;
  name?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  capacity?: number;
  description?: string;
}

interface WarehouseLocationDto {
  id: number;
  code: string;
  name?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  capacity?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export class CreateWarehouseLocationHandler implements UseCase<CreateWarehouseLocationRequest, WarehouseLocationDto> {
  async execute(request: CreateWarehouseLocationRequest): Promise<Result<WarehouseLocationDto>> {
    try {
      // Проверить, не существует ли локация с таким кодом
      const existing = await query('SELECT id FROM warehouse_locations WHERE code = $1', [
        request.code.trim().toUpperCase(),
      ]);

      if (existing.rows.length > 0) {
        return Result.fail('Location with this code already exists');
      }

      // Создать локацию
      const location = WarehouseLocation.create(request);

      const result = await query(
        `INSERT INTO warehouse_locations (code, name, zone, aisle, rack, shelf, capacity, description, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          location.code,
          location.name,
          location.zone,
          location.aisle,
          location.rack,
          location.shelf,
          location.capacity,
          location.description,
          location.isActive,
          location.createdAt,
        ]
      );

      location.setId(result.rows[0].id);

      return Result.ok({
        id: location.id!,
        code: location.code,
        name: location.name,
        zone: location.zone,
        aisle: location.aisle,
        rack: location.rack,
        shelf: location.shelf,
        capacity: location.capacity,
        description: location.description,
        isActive: location.isActive,
        createdAt: location.createdAt.toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create warehouse location');
    }
  }
}
