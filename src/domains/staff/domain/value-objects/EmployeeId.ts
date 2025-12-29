import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface EmployeeIdProps {
  value: number;
}

export class EmployeeId extends ValueObject<EmployeeIdProps> {
  get value(): number {
    return this.props.value;
  }

  private constructor(props: EmployeeIdProps) {
    super(props);
  }

  public static create(id: number): EmployeeId {
    if (!id || id <= 0) {
      throw new Error('Employee ID must be a positive number');
    }
    return new EmployeeId({ value: id });
  }
}
