import { AggregateRoot } from '../../../../shared/domain/AggregateRoot.js';
import { TaskId } from '../value-objects/TaskId.js';
import { TaskStatus } from '../value-objects/TaskStatus.js';
import { TaskPriority } from '../value-objects/TaskPriority.js';
import { TaskComment } from './TaskComment.js';
import { ChecklistItem } from '../value-objects/ChecklistItem.js';
import { ValidationError } from '../../../../shared/domain/errors/DomainError.js';

export interface TaskAssignee {
  id: number;
  name: string;
}

export interface TaskProps {
  id?: TaskId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: number;  // Legacy - для обратной совместимости
  assigneeName?: string; // Legacy - для обратной совместимости
  assignees: TaskAssignee[]; // Новое - массив исполнителей
  createdById?: number;
  deadline?: Date;
  completedAt?: Date;
  comments: TaskComment[];
  checklist: ChecklistItem[];
  attachments: string[];
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

  get assignees(): TaskAssignee[] {
    return [...this.props.assignees];
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

  get checklist(): ChecklistItem[] {
    return [...this.props.checklist];
  }

  get attachments(): string[] {
    return [...(this.props.attachments || [])];
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

  public static create(props: Omit<TaskProps, 'id' | 'status' | 'comments' | 'createdAt' | 'updatedAt' | 'completedAt' | 'assignees'> & { attachments?: string[]; checklist?: ChecklistItem[]; assignees?: TaskAssignee[] }): Task {
    if (!props.title || props.title.trim().length === 0) {
      throw new ValidationError('Task title is required');
    }

    return new Task({
      ...props,
      title: props.title.trim(),
      status: TaskStatus.pending(),
      comments: [],
      checklist: props.checklist || [],
      attachments: props.attachments || [],
      assignees: props.assignees || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static fromPersistence(row: any, comments: TaskComment[] = [], assignees: TaskAssignee[] = []): Task {
    // Parse checklist from JSON if it exists
    let checklist: ChecklistItem[] = [];
    if (row.checklist) {
      try {
        const checklistData = typeof row.checklist === 'string' ? JSON.parse(row.checklist) : row.checklist;
        checklist = checklistData.map((item: any) => ChecklistItem.fromData(item));
      } catch (error) {
        console.error('Failed to parse checklist:', error);
      }
    }

    return new Task({
      id: TaskId.create(row.id),
      title: row.title,
      description: row.description,
      status: TaskStatus.create(row.status),
      priority: TaskPriority.create(row.priority || 'medium'),
      assigneeId: row.assignee_id || row.employee_id,
      assigneeName: row.assignee_name || row.assignee,
      assignees: assignees.length > 0 ? assignees : (row.assignee_id ? [{ id: row.assignee_id, name: row.assignee_name || row.assignee || '' }] : []),
      createdById: row.created_by,
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      comments,
      checklist,
      attachments: row.attachments || [],
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

  public update(props: Partial<Pick<TaskProps, 'title' | 'description' | 'priority' | 'assigneeId' | 'assigneeName' | 'assignees' | 'deadline' | 'checklist' | 'attachments'>>): void {
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
    if (props.assignees !== undefined) {
      this.props.assignees = props.assignees;
    }
    if (props.deadline !== undefined) {
      this.props.deadline = props.deadline;
    }
    if (props.checklist !== undefined) {
      this.props.checklist = props.checklist;
    }
    if (props.attachments !== undefined) {
      this.props.attachments = props.attachments;
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
