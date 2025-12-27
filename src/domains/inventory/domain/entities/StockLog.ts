import { Entity } from '../../../../shared/domain/Entity.js';

export interface StockLogProps {
  id?: number;
  productId: number;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reason?: string;
  userId?: number;
  userName?: string;
  createdAt: Date;
}

export class StockLog extends Entity<StockLogProps> {
  get id(): number | undefined { return this.props.id; }
  get productId(): number { return this.props.productId; }
  get quantityChange(): number { return this.props.quantityChange; }
  get quantityBefore(): number { return this.props.quantityBefore; }
  get quantityAfter(): number { return this.props.quantityAfter; }
  get reason(): string | undefined { return this.props.reason; }
  get userId(): number | undefined { return this.props.userId; }
  get userName(): string | undefined { return this.props.userName; }
  get createdAt(): Date { return this.props.createdAt; }

  private constructor(props: StockLogProps) { super(props); }

  public static create(props: Omit<StockLogProps, 'id' | 'createdAt'>): StockLog {
    return new StockLog({ ...props, createdAt: new Date() });
  }

  public static fromPersistence(row: any): StockLog {
    return new StockLog({
      id: row.id,
      productId: row.product_id,
      quantityChange: row.quantity_change,
      quantityBefore: row.quantity_before,
      quantityAfter: row.quantity_after,
      reason: row.reason,
      userId: row.user_id,
      userName: row.user_name || row.full_name,
      createdAt: new Date(row.created_at),
    });
  }
}
