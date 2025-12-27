import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { TaskId } from '../value-objects/TaskId.js';
import { TaskStatus } from '../value-objects/TaskStatus.js';
import { TaskPriority } from '../value-objects/TaskPriority.js';
import { TaskComment } from './TaskComment.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export interface TaskProps {
  id?: TaskId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number;
  assigneeName?: string;
  createdById?: number;
  deadline?: Date;
  completedAt?: Date;
  comments: TaskComment[];
  createdAt: Date;
  updatedAt: Date;
}

export class Task extends AggregateRoot<TaskProps> {
  get id(): TaskId | undefined {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): TaskPriority {
    return this.props.priority;
  }

  get assigneeId(): number | undefined {
    return this.props.assigneeId;
  }

  get assigneeName(): string | undefined {
    return this.props.assigneeName;
  }

  get createdById(): number | undefined {
    return this.props.createdById;
  }

  get deadline(): Date | undefined {
    return this.props.deadline;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get comments(): TaskComment[] {
    return [...this.props.comments];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isOverdue(): boolean {
    if (!this.props.deadline || this.props.status.isCompleted()) {
      return false;
    }
    return new Date() > this.props.deadline;
  }

  private constructor(props: TaskProps) {
    super(props);
  }

  public static create(props: Omit<TaskProps, 'id' | 'status' | 'comments' | 'createdAt' | 'updatedAt' | 'completedAt'>): Task {
    if (!props.title || props.title.trim().length === 0) {
      throw new ValidationError('Task title is required');
    }

    return new Task({
      ...props,
      title: props.title.trim(),
      status: TaskStatus.pending(),
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPersistence(row: any, comments: TaskComment[] = []): Task {
    return new Task({
      id: TaskId.create(row.id),
      title: row.title,
      description: row.description,
      status: TaskStatus.create(row.status),
      priority: TaskPriority.create(row.priority || 'medium'),
      assigneeId: row.assignee_id || row.employee_id,
      assigneeName: row.assignee_name || row.assignee,
      createdById: row.created_by,
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      comments,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public changeStatus(newStatus: TaskStatus): void {
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new ValidationError(
        `Cannot transition from ${this.props.status.value} to ${newStatus.value}`
      );
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    if (newStatus.isCompleted()) {
      this.props.completedAt = new Date();
    } else {
      this.props.completedAt = undefined;
    }
  }

  public update(props: Partial<Pick<TaskProps, 'title' | 'description' | 'priority' | 'assigneeId' | 'assigneeName' | 'deadline'>>): void {
    if (props.title !== undefined) {
      this.props.title = props.title.trim();
    }
    if (props.description !== undefined) {
      this.props.description = props.description;
    }
    if (props.priority !== undefined) {
      this.props.priority = props.priority;
    }
    if (props.assigneeId !== undefined) {
      this.props.assigneeId = props.assigneeId;
    }
    if (props.assigneeName !== undefined) {
      this.props.assigneeName = props.assigneeName;
    }
    if (props.deadline !== undefined) {
      this.props.deadline = props.deadline;
    }
    this.props.updatedAt = new Date();
  }

  public addComment(comment: TaskComment): void {
    this.props.comments.push(comment);
    this.props.updatedAt = new Date();
  }

  public setId(id: TaskId): void {
    if (this.props.id) {
      throw new Error('Task already has an ID');
    }
    this.props.id = id;
  }
}
