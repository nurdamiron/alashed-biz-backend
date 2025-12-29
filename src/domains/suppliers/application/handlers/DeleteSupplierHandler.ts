import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository.js';
import { SupplierId } from '../../domain/value-objects/SupplierId.js';

interface DeleteSupplierRequest {
  supplierId: number;
}

export class DeleteSupplierHandler implements UseCase<DeleteSupplierRequest, void> {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(request: DeleteSupplierRequest): Promise<Result<void>> {
    try {
      const supplier = await this.supplierRepository.findById(SupplierId.create(request.supplierId));

      if (!supplier) {
        return Result.fail('Supplier not found');
      }

      // Мягкое удаление (деактивация)
      supplier.deactivate();
      await this.supplierRepository.update(supplier);

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to delete supplier');
    }
  }
}
