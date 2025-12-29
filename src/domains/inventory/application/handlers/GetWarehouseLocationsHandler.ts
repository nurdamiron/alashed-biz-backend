import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { WarehouseLocation } from '../../domain/entities/WarehouseLocation.js';

interface GetWarehouseLocationsRequest {
  isActive?: boolean;
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

export class GetWarehouseLocationsHandler implements UseCase<GetWarehouseLocationsRequest, WarehouseLocationDto[]> {
  async execute(request: GetWarehouseLocationsRequest): Promise<Result<WarehouseLocationDto[]>> {
    try {
      let sql = 'SELECT * FROM warehouse_locations WHERE 1=1';
      const params: any[] = [];

      if (request.isActive !== undefined) {
        sql += ' AND is_active = $1';
        params.push(request.isActive);
      }

      sql += ' ORDER BY code ASC';

      const result = await query(sql, params);
      const locations = result.rows.map((row) => {
        const loc = WarehouseLocation.fromPersistence(row);
        return {
          id: loc.id!,
          code: loc.code,
          name: loc.name,
          zone: loc.zone,
          aisle: loc.aisle,
          rack: loc.rack,
          shelf: loc.shelf,
          capacity: loc.capacity,
          description: loc.description,
          isActive: loc.isActive,
          createdAt: loc.createdAt.toISOString(),
        };
      });

      return Result.ok(locations);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get warehouse locations');
    }
  }
}
