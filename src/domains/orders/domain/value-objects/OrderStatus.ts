import { ValueObject } from '../../../../shared/domain/ValueObject.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export type OrderStatusValue =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

// Русские статусы для обратной совместимости
const STATUS_MAP: Record<string, OrderStatusValue> = {
  'Ожидание': 'pending',
  'Подтверждён': 'confirmed',
  'В процессе': 'in_progress',
  'Готов': 'ready',
  'Отправлено': 'shipped',
  'Доставлено': 'delivered',
  'Отменён': 'cancelled',
  'pending': 'pending',
  'confirmed': 'confirmed',
  'in_progress': 'in_progress',
  'ready': 'ready',
  'shipped': 'shipped',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
};

const VALID_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['ready', 'cancelled'],
  ready: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

interface OrderStatusProps {
  value: OrderStatusValue;
}

export class OrderStatus extends ValueObject<OrderStatusProps> {
  get value(): OrderStatusValue {
    return this.props.value;
  }

  private constructor(props: OrderStatusProps) {
    super(props);
  }

  public static create(status: string): OrderStatus {
    const normalized = STATUS_MAP[status];

    if (!normalized) {
      throw new ValidationError(`Invalid order status: ${status}`);
    }

    return new OrderStatus({ value: normalized });
  }

  public static pending(): OrderStatus {
    return new OrderStatus({ value: 'pending' });
  }

  public canTransitionTo(newStatus: OrderStatus): boolean {
    return VALID_TRANSITIONS[this.value].includes(newStatus.value);
  }

  public isPending(): boolean {
    return this.value === 'pending';
  }

  public isCompleted(): boolean {
    return this.value === 'delivered';
  }

  public isCancelled(): boolean {
    return this.value === 'cancelled';
  }

  public isActive(): boolean {
    return !this.isCompleted() && !this.isCancelled();
  }

  public toRussian(): string {
    const map: Record<OrderStatusValue, string> = {
      pending: 'Ожидание',
      confirmed: 'Подтверждён',
      in_progress: 'В процессе',
      ready: 'Готов',
      shipped: 'Отправлено',
      delivered: 'Доставлено',
      cancelled: 'Отменён',
    };
    return map[this.value];
  }
}
