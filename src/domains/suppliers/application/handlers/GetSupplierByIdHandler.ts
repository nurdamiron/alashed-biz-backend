import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository.js';
import { SupplierId } from '../../domain/value-objects/SupplierId.js';
import { SupplierDto } from '../dto/SupplierDto.js';
import { SupplierMapper } from '../mappers/SupplierMapper.js';

interface GetSupplierByIdRequest {
  supplierId: number;
}

export class GetSupplierByIdHandler implements UseCase<GetSupplierByIdRequest, SupplierDto> {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(request: GetSupplierByIdRequest): Promise<Result<SupplierDto>> {
    try {
      const supplier = await this.supplierRepository.findById(SupplierId.create(request.supplierId));

      if (!supplier) {
        return Result.fail('Supplier not found');
      }

      return Result.ok(SupplierMapper.toDto(supplier));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get supplier');
    }
  }
}
