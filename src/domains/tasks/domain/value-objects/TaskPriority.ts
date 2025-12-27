import { ValueObject } from '../../../../shared/domain/ValueObject.js';

export type TaskPriorityValue = 'low' | 'medium' | 'high' | 'urgent';

const PRIORITY_MAP: Record<string, TaskPriorityValue> = {
  'Низкий': 'low',
  'Средний': 'medium',
  'Высокий': 'high',
  'Срочный': 'urgent',
  'low': 'low',
  'medium': 'medium',
  'high': 'high',
  'urgent': 'urgent',
};

interface TaskPriorityProps {
  value: TaskPriorityValue;
}

export class TaskPriority extends ValueObject<TaskPriorityProps> {
  get value(): TaskPriorityValue {
    return this.props.value;
  }

  private constructor(props: TaskPriorityProps) {
    super(props);
  }

  public static create(priority: string): TaskPriority {
    const normalized = PRIORITY_MAP[priority] || 'medium';
    return new TaskPriority({ value: normalized });
  }

  public static medium(): TaskPriority {
    return new TaskPriority({ value: 'medium' });
  }

  public isUrgent(): boolean {
    return this.value === 'urgent' || this.value === 'high';
  }

  public toRussian(): string {
    const map: Record<TaskPriorityValue, string> = {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      urgent: 'Срочный',
    };
    return map[this.value];
  }

  public toNumber(): number {
    const map: Record<TaskPriorityValue, number> = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4,
    };
    return map[this.value];
  }
}
