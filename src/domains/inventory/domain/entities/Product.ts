import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { ProductId } from '../value-objects/ProductId.js';
import { SKU } from '../value-objects/SKU.js';
import { Quantity } from '../value-objects/Quantity.js';
import { Money } from '../../../orders/domain/value-objects/Money.js';
import { StockLog } from './StockLog.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export interface ProductProps {
  id?: ProductId;
  name: string;
  sku?: SKU;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  brandId?: number;
  brandName?: string;
  unitId?: number;
  unitName?: string;
  price: Money;
  costPrice?: Money;
  quantity: Quantity;
  minStockLevel: number;
  barcode?: string;
  isActive: boolean;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends AggregateRoot<ProductProps> {
  get id(): ProductId | undefined { return this.props.id; }
  get name(): string { return this.props.name; }
  get sku(): SKU | undefined { return this.props.sku; }
  get description(): string | undefined { return this.props.description; }
  get categoryId(): number | undefined { return this.props.categoryId; }
  get categoryName(): string | undefined { return this.props.categoryName; }
  get brandId(): number | undefined { return this.props.brandId; }
  get brandName(): string | undefined { return this.props.brandName; }
  get unitId(): number | undefined { return this.props.unitId; }
  get unitName(): string | undefined { return this.props.unitName; }
  get price(): Money { return this.props.price; }
  get costPrice(): Money | undefined { return this.props.costPrice; }
  get quantity(): Quantity { return this.props.quantity; }
  get minStockLevel(): number { return this.props.minStockLevel; }
  get barcode(): string | undefined { return this.props.barcode; }
  get isActive(): boolean { return this.props.isActive; }
  get images(): string[] { return this.props.images || []; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isLowStock(): boolean { return this.props.quantity.isLow(this.props.minStockLevel); }
  get isOutOfStock(): boolean { return this.props.quantity.isZero(); }

  private constructor(props: ProductProps) { super(props); }

  public static create(props: Omit<ProductProps, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Product {
    if (!props.name?.trim()) throw new ValidationError('Product name is required');
    return new Product({
      ...props,
      sku: props.sku || SKU.generate(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPersistence(row: any): Product {
    return new Product({
      id: ProductId.create(row.id),
      name: row.name,
      sku: row.sku ? SKU.create(row.sku) : undefined,
      description: row.description,
      categoryId: row.category_id,
      categoryName: row.category_name,
      brandId: row.brand_id,
      brandName: row.brand_name,
      unitId: row.unit_id,
      unitName: row.unit_name || row.unit_abbreviation,
      price: Money.create(parseFloat(row.price || 0)),
      costPrice: row.cost_price ? Money.create(parseFloat(row.cost_price)) : undefined,
      quantity: Quantity.create(parseInt(row.quantity || 0)),
      minStockLevel: parseInt(row.min_stock_level || 5),
      barcode: row.barcode,
      isActive: row.is_active !== false,
      images: row.images || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public adjustStock(delta: number, reason?: string, userId?: number): StockLog {
    const before = this.props.quantity.value;
    this.props.quantity = delta > 0 ? this.props.quantity.add(delta) : this.props.quantity.subtract(Math.abs(delta));
    this.props.updatedAt = new Date();

    return StockLog.create({
      productId: this.props.id?.value || 0,
      quantityChange: delta,
      quantityBefore: before,
      quantityAfter: this.props.quantity.value,
      reason,
      userId,
    });
  }

  public update(props: Partial<Pick<ProductProps, 'name' | 'description' | 'price' | 'costPrice' | 'minStockLevel' | 'barcode' | 'categoryId' | 'brandId'>>): void {
    Object.assign(this.props, props);
    this.props.updatedAt = new Date();
  }

  public setId(id: ProductId): void {
    if (this.props.id) throw new Error('Product already has an ID');
    this.props.id = id;
  }
}
