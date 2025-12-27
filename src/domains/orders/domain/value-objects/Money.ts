import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount;
  }

  get currency(): string {
    return this.props.currency;
  }

  private constructor(props: MoneyProps) {
    super(props);
  }

  public static create(amount: number, currency: string = 'KZT'): Money {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    // Round to 2 decimal places
    const rounded = Math.round(amount * 100) / 100;
    return new Money({ amount: rounded, currency });
  }

  public static zero(currency: string = 'KZT'): Money {
    return new Money({ amount: 0, currency });
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return Money.create(this.amount - other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  public format(): string {
    return new Intl.NumberFormat('ru-KZ', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(this.amount);
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot operate on different currencies: ${this.currency} vs ${other.currency}`);
    }
  }
}
