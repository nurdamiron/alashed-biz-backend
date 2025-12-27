import { Entity } from '../../../../shared/domain/Entity.js';
import { Money } from '../value-objects/Money.js';

export interface OrderItemProps {
  id?: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: Money;
  discount: Money;
  subtotal: Money;
}

export class OrderItem extends Entity<OrderItemProps> {
  get id(): number | undefined {
    return this.props.id;
  }

  get productId(): number {
    return this.props.productId;
  }

  get productName(): string {
    return this.props.productName;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get unitPrice(): Money {
    return this.props.unitPrice;
  }

  get discount(): Money {
    return this.props.discount;
  }

  get subtotal(): Money {
    return this.props.subtotal;
  }

  private constructor(props: OrderItemProps) {
    super(props);
  }

  public static create(props: Omit<OrderItemProps, 'subtotal' | 'discount'> & { discount?: Money }): OrderItem {
    const discount = props.discount || Money.zero();
    const grossTotal = props.unitPrice.multiply(props.quantity);
    const subtotal = grossTotal.subtract(discount);

    return new OrderItem({
      ...props,
      discount,
      subtotal,
    });
  }

  public static fromPersistence(row: any): OrderItem {
    return new OrderItem({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name || row.name || 'Unknown',
      quantity: row.quantity,
      unitPrice: Money.create(parseFloat(row.unit_price || row.price)),
      discount: Money.create(parseFloat(row.discount || 0)),
      subtotal: Money.create(parseFloat(row.subtotal || row.total)),
    });
  }
}
