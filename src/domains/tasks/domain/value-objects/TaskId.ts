import { ValueObject } from '../../../../shared/domain/ValueObject.js';

interface TaskIdProps {
  value: number;
}

export class TaskId extends ValueObject<TaskIdProps> {
  get value(): number {
    return this.props.value;
  }

  private constructor(props: TaskIdProps) {
    super(props);
  }

  public static create(id: number): TaskId {
    if (id <= 0) {
      throw new Error('TaskId must be positive');
    }
    return new TaskId({ value: id });
  }

  public toString(): string {
    return this.value.toString();
  }
}
