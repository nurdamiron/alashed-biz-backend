import { Supplier } from '../entities/Supplier.js';
import { SupplierId } from '../value-objects/SupplierId.js';

export interface SupplierFilters {
  isActive?: boolean;
  search?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface ISupplierRepository {
  findById(id: SupplierId): Promise<Supplier | null>;
  findAll(filters?: SupplierFilters, pagination?: PaginationParams): Promise<Supplier[]>;
  findByTin(tin: string): Promise<Supplier | null>;
  save(supplier: Supplier): Promise<Supplier>;
  update(supplier: Supplier): Promise<void>;
  delete(id: SupplierId): Promise<void>;
  count(filters?: SupplierFilters): Promise<number>;
}
