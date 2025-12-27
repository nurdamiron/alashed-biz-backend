import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface ProductIdProps { value: number; }

export class ProductId extends ValueObject<ProductIdProps> {
  get value(): number { return this.props.value; }
  private constructor(props: ProductIdProps) { super(props); }
  public static create(id: number): ProductId {
    if (id <= 0) throw new Error('ProductId must be positive');
    return new ProductId({ value: id });
  }
  public toString(): string { return this.value.toString(); }
}
