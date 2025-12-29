import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import {
  ISupplierRepository,
  SupplierFilters,
  PaginationParams,
} from '../../domain/repositories/ISupplierRepository.js';
import { Supplier } from '../../domain/entities/Supplier.js';
import { SupplierId } from '../../domain/value-objects/SupplierId.js';

export class PostgresSupplierRepository implements ISupplierRepository {
  async findById(id: SupplierId): Promise<Supplier | null> {
    const result = await query('SELECT * FROM suppliers WHERE id = $1', [id.value]);
    return result.rows.length ? Supplier.fromPersistence(result.rows[0]) : null;
  }

  async findAll(filters?: SupplierFilters, pagination?: PaginationParams): Promise<Supplier[]> {
    let sql = 'SELECT * FROM suppliers WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (filters?.isActive !== undefined) {
      sql += ` AND is_active = $${idx++}`;
      params.push(filters.isActive);
    }

    if (filters?.search) {
      sql += ` AND (name ILIKE $${idx++} OR tin ILIKE $${idx++} OR phone ILIKE $${idx++})`;
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ' ORDER BY name ASC';

    if (pagination) {
      sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(pagination.limit, pagination.offset);
    }

    const result = await query(sql, params);
    return result.rows.map((row) => Supplier.fromPersistence(row));
  }

  async findByTin(tin: string): Promise<Supplier | null> {
    const result = await query('SELECT * FROM suppliers WHERE tin = $1', [tin]);
    return result.rows.length ? Supplier.fromPersistence(result.rows[0]) : null;
  }

  async save(supplier: Supplier): Promise<Supplier> {
    const result = await query(
      `INSERT INTO suppliers (name, tin, phone, email, address, contact_person, notes, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        supplier.name,
        supplier.tin?.value,
        supplier.phone,
        supplier.email,
        supplier.address,
        supplier.contactPerson,
        supplier.notes,
        supplier.isActive,
        supplier.createdAt,
        supplier.updatedAt,
      ]
    );

    supplier.setId(SupplierId.create(result.rows[0].id));
    return supplier;
  }

  async update(supplier: Supplier): Promise<void> {
    await query(
      `UPDATE suppliers
       SET name = $1, tin = $2, phone = $3, email = $4, address = $5,
           contact_person = $6, notes = $7, is_active = $8, updated_at = $9
       WHERE id = $10`,
      [
        supplier.name,
        supplier.tin?.value,
        supplier.phone,
        supplier.email,
        supplier.address,
        supplier.contactPerson,
        supplier.notes,
        supplier.isActive,
        supplier.updatedAt,
        supplier.id?.value,
      ]
    );
  }

  async delete(id: SupplierId): Promise<void> {
    await query('DELETE FROM suppliers WHERE id = $1', [id.value]);
  }

  async count(filters?: SupplierFilters): Promise<number> {
    let sql = 'SELECT COUNT(*) FROM suppliers WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (filters?.isActive !== undefined) {
      sql += ` AND is_active = $${idx++}`;
      params.push(filters.isActive);
    }

    if (filters?.search) {
      sql += ` AND (name ILIKE $${idx++} OR tin ILIKE $${idx++} OR phone ILIKE $${idx++})`;
      const searchPattern = `%${filters.search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count, 10);
  }
}
