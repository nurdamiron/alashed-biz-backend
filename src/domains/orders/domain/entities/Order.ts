import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { OrderId } from '../value-objects/OrderId.js';
import { OrderStatus } from '../value-objects/OrderStatus.js';
import { Money } from '../value-objects/Money.js';
import { OrderItem } from './OrderItem.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export interface OrderProps {
  id?: OrderId;
  customerId: number;
  customerName: string;
  customerPhone: string;
  employeeId?: number;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: Money;
  discount: Money;
  paymentMethod?: string;
  paymentStatus: string;
  deliveryAddress?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends AggregateRoot<OrderProps> {
  get id(): OrderId | undefined {
    return this.props.id;
  }

  get customerId(): number {
    return this.props.customerId;
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get customerPhone(): string {
    return this.props.customerPhone;
  }

  get employeeId(): number | undefined {
    return this.props.employeeId;
  }

  get items(): OrderItem[] {
    return [...this.props.items];
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get totalAmount(): Money {
    return this.props.totalAmount;
  }

  get discount(): Money {
    return this.props.discount;
  }

  get paymentMethod(): string | undefined {
    return this.props.paymentMethod;
  }

  get paymentStatus(): string {
    return this.props.paymentStatus;
  }

  get deliveryAddress(): string | undefined {
    return this.props.deliveryAddress;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: OrderProps) {
    super(props);
  }

  public static create(props: Omit<OrderProps, 'id' | 'status' | 'totalAmount' | 'discount' | 'paymentStatus' | 'createdAt' | 'updatedAt'> & {
    discount?: Money;
  }): Order {
    if (!props.items || props.items.length === 0) {
      throw new ValidationError('Order must have at least one item');
    }

    const discount = props.discount || Money.zero();
    const itemsTotal = props.items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero()
    );
    const totalAmount = itemsTotal.subtract(discount);

    return new Order({
      ...props,
      status: OrderStatus.pending(),
      totalAmount,
      discount,
      paymentStatus: 'unpaid',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPersistence(row: any, items: OrderItem[]): Order {
    return new Order({
      id: OrderId.create(row.id),
      customerId: row.customer_id,
      customerName: row.customer_name || row.name || '',
      customerPhone: row.customer_phone || row.phone || '',
      employeeId: row.employee_id,
      items,
      status: OrderStatus.create(row.status),
      totalAmount: Money.create(parseFloat(row.total_amount)),
      discount: Money.create(parseFloat(row.discount || 0)),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status || 'unpaid',
      deliveryAddress: row.delivery_address,
      notes: row.notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public changeStatus(newStatus: OrderStatus): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new ValidationError(
        `Cannot transition from ${this.props.status.value} to ${newStatus.value}`
      );
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();
  }

  public setId(id: OrderId): void {
    if (this.props.id) {
      throw new Error('Order already has an ID');
    }
    this.props.id = id;
  }
}
