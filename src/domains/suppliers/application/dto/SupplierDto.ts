export interface SupplierDto {
  id: number;
  name: string;
  tin?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  tin?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  tin?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
}

export interface GetSuppliersDto {
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
