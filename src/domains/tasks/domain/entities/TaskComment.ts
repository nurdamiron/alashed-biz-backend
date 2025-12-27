import { Entity } from '../../../../shared/domain/Entity.js';

export interface TaskCommentProps {
  id?: number;
  taskId: number;
  userId: number;
  userName?: string;
  comment: string;
  createdAt: Date;
}

export class TaskComment extends Entity<TaskCommentProps> {
  get id(): number | undefined {
    return this.props.id;
  }

  get taskId(): number {
    return this.props.taskId;
  }

  get userId(): number {
    return this.props.userId;
  }

  get userName(): string | undefined {
    return this.props.userName;
  }

  get comment(): string {
    return this.props.comment;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  private constructor(props: TaskCommentProps) {
    super(props);
  }

  public static create(props: Omit<TaskCommentProps, 'id' | 'createdAt'>): TaskComment {
    return new TaskComment({
      ...props,
      createdAt: new Date(),
    });
  }

  public static fromPersistence(row: any): TaskComment {
    return new TaskComment({
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      userName: row.user_name || row.full_name,
      comment: row.comment,
      createdAt: new Date(row.created_at),
    });
  }
}
