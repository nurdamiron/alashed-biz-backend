import { Entity } from '../../../../shared/domain/Entity.js';

export interface ProductLocationProps {
  id?: number;
  productId: number;
  locationId: number;
  locationCode?: string;
  quantity: number;
  reservedQty: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductLocation extends Entity<ProductLocationProps> {
  get id(): number | undefined {
    return this.props.id;
  }

  get productId(): number {
    return this.props.productId;
  }

  get locationId(): number {
    return this.props.locationId;
  }

  get locationCode(): string | undefined {
    return this.props.locationCode;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get reservedQty(): number {
    return this.props.reservedQty;
  }

  get availableQty(): number {
    return this.props.quantity - this.props.reservedQty;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: ProductLocationProps) {
    super(props);
  }

  public static create(props: Omit<ProductLocationProps, 'id' | 'reservedQty' | 'createdAt' | 'updatedAt'>): ProductLocation {
    return new ProductLocation({
      ...props,
      reservedQty: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPersistence(row: any): ProductLocation {
    return new ProductLocation({
      id: row.id,
      productId: row.product_id,
      locationId: row.location_id,
      locationCode: row.location_code,
      quantity: parseInt(row.quantity || 0),
      reservedQty: parseInt(row.reserved_qty || 0),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public adjustQuantity(delta: number): void {
    this.props.quantity += delta;
    if (this.props.quantity < 0) {
      this.props.quantity = 0;
    }
    this.props.updatedAt = new Date();
  }

  public reserve(quantity: number): void {
    if (this.availableQty < quantity) {
      throw new Error('Not enough available quantity to reserve');
    }
    this.props.reservedQty += quantity;
    this.props.updatedAt = new Date();
  }

  public releaseReservation(quantity: number): void {
    this.props.reservedQty -= quantity;
    if (this.props.reservedQty < 0) {
      this.props.reservedQty = 0;
    }
    this.props.updatedAt = new Date();
  }
}
