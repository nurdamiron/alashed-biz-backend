import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface OrderIdProps {
  value: number;
}

export class OrderId extends ValueObject<OrderIdProps> {
  get value(): number {
    return this.props.value;
  }

  private constructor(props: OrderIdProps) {
    super(props);
  }

  public static create(id: number): OrderId {
    if (id <= 0) {
      throw new Error('OrderId must be positive');
    }
    return new OrderId({ value: id });
  }

  public static fromString(id: string): OrderId {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('Invalid OrderId format');
    }
    return OrderId.create(parsed);
  }

  public toString(): string {
    return this.value.toString();
  }
}
