import { query, transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { IProductRepository, ProductFilters, PaginationParams } from '../../domain/repositories/IProductRepository.js';
import { Product } from '../../domain/entities/Product.js';
import { ProductId } from '../../domain/value-objects/ProductId.js';
import { StockLog } from '../../domain/entities/StockLog.js';

export class PostgresProductRepository implements IProductRepository {
  async findById(id: ProductId): Promise<Product | null> {
    const result = await query(
      `SELECT p.*, c.name as category_name, b.name as brand_name, u.abbreviation as unit_name, s.name as supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN units_of_measurement u ON p.unit_id = u.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = $1`, [id.value]
    );
    return result.rows.length ? Product.fromPersistence(result.rows[0]) : null;
  }

  async findAll(filters?: ProductFilters, pagination?: PaginationParams): Promise<Product[]> {
    let sql = `SELECT p.*, c.name as category_name, b.name as brand_name, u.abbreviation as unit_name, s.name as supplier_name
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               LEFT JOIN brands b ON p.brand_id = b.id
               LEFT JOIN units_of_measurement u ON p.unit_id = u.id
               LEFT JOIN suppliers s ON p.supplier_id = s.id
               WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (filters?.categoryId) { sql += ` AND p.category_id = $${idx++}`; params.push(filters.categoryId); }
    if (filters?.brandId) { sql += ` AND p.brand_id = $${idx++}`; params.push(filters.brandId); }
    if (filters?.isLowStock) { sql += ` AND p.quantity <= p.min_stock_level AND p.quantity > 0`; }
    if (filters?.isOutOfStock) { sql += ` AND p.quantity = 0`; }
    if (filters?.isActive !== undefined) { sql += ` AND p.is_active = $${idx++}`; params.push(filters.isActive); }

    sql += ` ORDER BY p.name ASC`;
    if (pagination) { sql += ` LIMIT $${idx++} OFFSET $${idx++}`; params.push(pagination.limit, pagination.offset); }

    const result = await query(sql, params);
    return result.rows.map(row => Product.fromPersistence(row));
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const result = await query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = $1`, [barcode]
    );
    return result.rows.length ? Product.fromPersistence(result.rows[0]) : null;
  }

  async search(searchQuery: string): Promise<Product[]> {
    const result = await query(
      `SELECT p.*, c.name as category_name, b.name as brand_name, s.name as supplier_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.name ILIKE $1 OR p.sku ILIKE $1 OR p.barcode ILIKE $1 OR p.gtin ILIKE $1 OR c.name ILIKE $1
       ORDER BY p.name ASC LIMIT 50`, [`%${searchQuery}%`]
    );
    return result.rows.map(row => Product.fromPersistence(row));
  }

  async save(product: Product): Promise<Product> {
    const result = await query(
      `INSERT INTO products (name, sku, description, category_id, brand_id, supplier_id, unit_id, price, cost_price, quantity, min_stock_level, barcode, gtin, serial_numbers, images, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`,
      [product.name, product.sku?.value, product.description, product.categoryId, product.brandId, product.supplierId, product.unitId,
       product.price.amount, product.costPrice?.amount, product.quantity.value, product.minStockLevel,
       product.barcode, product.gtin, product.serialNumbers, product.images, product.isActive, product.createdAt, product.updatedAt]
    );
    product.setId(ProductId.create(result.rows[0].id));
    return product;
  }

  async update(product: Product): Promise<void> {
    await query(
      `UPDATE products SET name=$1, description=$2, price=$3, cost_price=$4, min_stock_level=$5, barcode=$6, gtin=$7, category_id=$8, brand_id=$9, supplier_id=$10, updated_at=$11 WHERE id=$12`,
      [product.name, product.description, product.price.amount, product.costPrice?.amount, product.minStockLevel,
       product.barcode, product.gtin, product.categoryId, product.brandId, product.supplierId, product.updatedAt, product.id?.value]
    );
  }

  async adjustStock(id: ProductId, log: StockLog): Promise<void> {
    await transaction(async (client) => {
      await client.query(`UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2`, [log.quantityAfter, id.value]);
      await client.query(
        `INSERT INTO stock_history (product_id, quantity_change, quantity_before, quantity_after, reason, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id.value, log.quantityChange, log.quantityBefore, log.quantityAfter, log.reason, log.userId, log.createdAt]
      );
    });
  }

  async getStockLogs(id: ProductId, limit: number = 50): Promise<StockLog[]> {
    const result = await query(
      `SELECT sh.*, u.full_name as user_name FROM stock_history sh
       LEFT JOIN users u ON sh.user_id = u.id WHERE sh.product_id = $1
       ORDER BY sh.created_at DESC LIMIT $2`, [id.value, limit]
    );
    return result.rows.map(row => StockLog.fromPersistence(row));
  }

  async count(filters?: ProductFilters): Promise<number> {
    let sql = `SELECT COUNT(*) FROM products WHERE 1=1`;
    const params: any[] = [];
    if (filters?.isActive !== undefined) { sql += ` AND is_active = $1`; params.push(filters.isActive); }
    const result = await query(sql, params);
    return parseInt(result.rows[0].count, 10);
  }

  async getLowStockProducts(): Promise<Product[]> {
    const result = await query(
      `SELECT p.*, c.name as category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.quantity <= p.min_stock_level AND p.is_active = true ORDER BY p.quantity ASC`
    );
    return result.rows.map(row => Product.fromPersistence(row));
  }
}
