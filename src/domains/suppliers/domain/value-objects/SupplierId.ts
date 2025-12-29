import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface SupplierIdProps {
  value: number;
}

export class SupplierId extends ValueObject<SupplierIdProps> {
  get value(): number {
    return this.props.value;
  }

  private constructor(props: SupplierIdProps) {
    super(props);
  }

  public static create(id: number): SupplierId {
    if (!id || id <= 0) {
      throw new Error('Supplier ID must be a positive number');
    }
    return new SupplierId({ value: id });
  }
}
