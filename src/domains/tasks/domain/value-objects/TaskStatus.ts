import { ValueObject } from '../../../../shared/domain/ValueObject.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export type TaskStatusValue = 'pending' | 'in_progress' | 'completed' | 'cancelled';

const STATUS_MAP: Record<string, TaskStatusValue> = {
  'К выполнению': 'pending',
  'В процессе': 'in_progress',
  'Готово': 'completed',
  'Отменено': 'cancelled',
  'pending': 'pending',
  'in_progress': 'in_progress',
  'completed': 'completed',
  'cancelled': 'cancelled',
};

const VALID_TRANSITIONS: Record<TaskStatusValue, TaskStatusValue[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'pending', 'cancelled'],
  completed: ['pending'], // Can reopen
  cancelled: ['pending'], // Can reopen
};

interface TaskStatusProps {
  value: TaskStatusValue;
}

export class TaskStatus extends ValueObject<TaskStatusProps> {
  get value(): TaskStatusValue {
    return this.props.value;
  }

  private constructor(props: TaskStatusProps) {
    super(props);
  }

  public static create(status: string): TaskStatus {
    const normalized = STATUS_MAP[status];
    if (!normalized) {
      throw new ValidationError(`Invalid task status: ${status}`);
    }
    return new TaskStatus({ value: normalized });
  }

  public static pending(): TaskStatus {
    return new TaskStatus({ value: 'pending' });
  }

  public canTransitionTo(newStatus: TaskStatus): boolean {
    return VALID_TRANSITIONS[this.value].includes(newStatus.value);
  }

  public isCompleted(): boolean {
    return this.value === 'completed';
  }

  public isActive(): boolean {
    return this.value === 'pending' || this.value === 'in_progress';
  }

  public toRussian(): string {
    const map: Record<TaskStatusValue, string> = {
      pending: 'К выполнению',
      in_progress: 'В процессе',
      completed: 'Готово',
      cancelled: 'Отменено',
    };
    return map[this.value];
  }
}
