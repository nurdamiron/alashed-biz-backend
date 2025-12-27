import { Product } from '../entities/Product.js';
import { ProductId } from '../value-objects/ProductId.js';
import { StockLog } from '../entities/StockLog.js';

export interface ProductFilters {
  categoryId?: number;
  brandId?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  isActive?: boolean;
}

export interface PaginationParams { limit: number; offset: number; }

export interface IProductRepository {
  findById(id: ProductId): Promise<Product | null>;
  findAll(filters?: ProductFilters, pagination?: PaginationParams): Promise<Product[]>;
  findByBarcode(barcode: string): Promise<Product | null>;
  search(query: string): Promise<Product[]>;
  save(product: Product): Promise<Product>;
  update(product: Product): Promise<void>;
  adjustStock(id: ProductId, log: StockLog): Promise<void>;
  getStockLogs(id: ProductId, limit?: number): Promise<StockLog[]>;
  count(filters?: ProductFilters): Promise<number>;
  getLowStockProducts(): Promise<Product[]>;
}
