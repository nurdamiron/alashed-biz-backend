import { Task } from '../entities/Task.js';
import { TaskId } from '../value-objects/TaskId.js';
import { TaskStatus } from '../value-objects/TaskStatus.js';
import { TaskComment } from '../entities/TaskComment.js';

export interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: number;
  priority?: string;
  isOverdue?: boolean;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface ITaskRepository {
  findById(id: TaskId): Promise<Task | null>;
  findAll(filters?: TaskFilters, pagination?: PaginationParams): Promise<Task[]>;
  save(task: Task): Promise<Task>;
  update(task: Task): Promise<void>;
  updateStatus(id: TaskId, status: TaskStatus): Promise<void>;
  addComment(taskId: TaskId, comment: TaskComment): Promise<TaskComment>;
  count(filters?: TaskFilters): Promise<number>;
  countByAssignee(assigneeId: number): Promise<number>;
}
