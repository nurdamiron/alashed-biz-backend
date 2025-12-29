import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository.js';
import { SupplierId } from '../../domain/value-objects/SupplierId.js';
import { TIN } from '../../domain/value-objects/TIN.js';
import { UpdateSupplierDto, SupplierDto } from '../dto/SupplierDto.js';
import { SupplierMapper } from '../mappers/SupplierMapper.js';

interface UpdateSupplierRequest extends UpdateSupplierDto {
  supplierId: number;
}

export class UpdateSupplierHandler implements UseCase<UpdateSupplierRequest, SupplierDto> {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(request: UpdateSupplierRequest): Promise<Result<SupplierDto>> {
    try {
      const supplier = await this.supplierRepository.findById(SupplierId.create(request.supplierId));

      if (!supplier) {
        return Result.fail('Supplier not found');
      }

      // Обновить данные
      supplier.update({
        name: request.name,
        tin: request.tin ? TIN.create(request.tin) : undefined,
        phone: request.phone,
        email: request.email,
        address: request.address,
        contactPerson: request.contactPerson,
        notes: request.notes,
      });

      // Сохранить
      await this.supplierRepository.update(supplier);

      return Result.ok(SupplierMapper.toDto(supplier));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to update supplier');
    }
  }
}
