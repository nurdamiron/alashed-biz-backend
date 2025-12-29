import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository.js';
import { GetSuppliersDto, SupplierDto } from '../dto/SupplierDto.js';
import { SupplierMapper } from '../mappers/SupplierMapper.js';

export class GetSuppliersHandler implements UseCase<GetSuppliersDto, { suppliers: SupplierDto[]; total: number }> {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(request: GetSuppliersDto): Promise<Result<{ suppliers: SupplierDto[]; total: number }>> {
    try {
      const filters = {
        isActive: request.isActive,
        search: request.search,
      };

      const pagination = {
        limit: request.limit || 50,
        offset: request.offset || 0,
      };

      const [suppliers, total] = await Promise.all([
        this.supplierRepository.findAll(filters, pagination),
        this.supplierRepository.count(filters),
      ]);

      return Result.ok({
        suppliers: SupplierMapper.toDtoList(suppliers),
        total,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get suppliers');
    }
  }
}
