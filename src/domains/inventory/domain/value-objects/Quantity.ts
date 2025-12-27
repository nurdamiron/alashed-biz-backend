import { ValueObject } from '../../../../shared/domain/ValueObject.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

interface QuantityProps { value: number; }

export class Quantity extends ValueObject<QuantityProps> {
  get value(): number { return this.props.value; }
  private constructor(props: QuantityProps) { super(props); }

  public static create(value: number): Quantity {
    if (value < 0) throw new ValidationError('Quantity cannot be negative');
    return new Quantity({ value: Math.floor(value) });
  }

  public static zero(): Quantity { return new Quantity({ value: 0 }); }

  public add(amount: number): Quantity { return Quantity.create(this.value + amount); }
  public subtract(amount: number): Quantity { return Quantity.create(this.value - amount); }
  public isZero(): boolean { return this.value === 0; }
  public isLow(threshold: number): boolean { return this.value <= threshold; }
}
