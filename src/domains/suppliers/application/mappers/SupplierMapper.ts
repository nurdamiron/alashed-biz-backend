import { Supplier } from '../../domain/entities/Supplier.js';
import { SupplierDto } from '../dto/SupplierDto.js';

export class SupplierMapper {
  public static toDto(supplier: Supplier): SupplierDto {
    return {
      id: supplier.id!.value,
      name: supplier.name,
      tin: supplier.tin?.value,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      contactPerson: supplier.contactPerson,
      notes: supplier.notes,
      isActive: supplier.isActive,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    };
  }

  public static toDtoList(suppliers: Supplier[]): SupplierDto[] {
    return suppliers.map((supplier) => SupplierMapper.toDto(supplier));
  }
}
