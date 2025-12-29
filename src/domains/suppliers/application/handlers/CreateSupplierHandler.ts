import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ISupplierRepository } from '../../domain/repositories/ISupplierRepository.js';
import { Supplier } from '../../domain/entities/Supplier.js';
import { TIN } from '../../domain/value-objects/TIN.js';
import { CreateSupplierDto, SupplierDto } from '../dto/SupplierDto.js';
import { SupplierMapper } from '../mappers/SupplierMapper.js';

export class CreateSupplierHandler implements UseCase<CreateSupplierDto, SupplierDto> {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async execute(request: CreateSupplierDto): Promise<Result<SupplierDto>> {
    try {
      // Проверить, не существует ли поставщик с таким ИИН/БИН
      if (request.tin) {
        const existing = await this.supplierRepository.findByTin(request.tin);
        if (existing) {
          return Result.fail('Supplier with this TIN already exists');
        }
      }

      // Создать поставщика
      const supplier = Supplier.create({
        name: request.name,
        tin: request.tin ? TIN.create(request.tin) : undefined,
        phone: request.phone,
        email: request.email,
        address: request.address,
        contactPerson: request.contactPerson,
        notes: request.notes,
      });

      // Сохранить
      const savedSupplier = await this.supplierRepository.save(supplier);

      return Result.ok(SupplierMapper.toDto(savedSupplier));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create supplier');
    }
  }
}
