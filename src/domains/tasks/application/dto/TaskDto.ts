export interface TaskCommentDto {
  id: number;
  taskId: number;
  userId: number;
  userName?: string;
  comment: string;
  createdAt: string;
}

export interface ChecklistItemDto {
  id: string;
  text: string;
  done: boolean;
}

export interface TaskAssigneeDto {
  id: number;
  name: string;
}

export interface TaskDto {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignees: TaskAssigneeDto[];
  createdById?: number;
  deadline?: string;
  completedAt?: string;
  isOverdue: boolean;
  comments: TaskCommentDto[];
  checklist: ChecklistItemDto[];
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: string;
  assigneeIds?: number[];
  deadline?: string;
  createdById?: number;
  checklist?: ChecklistItemDto[];
  attachments?: string[];
}

export interface UpdateTaskDto {
  taskId: number;
  title?: string;
  description?: string;
  priority?: string;
  assigneeIds?: number[];
  deadline?: string;
  checklist?: ChecklistItemDto[];
  attachments?: string[];
}

export interface UpdateTaskStatusDto {
  taskId: number;
  status: string;
}

export interface AddTaskCommentDto {
  taskId: number;
  userId: number;
  comment: string;
}

export interface TasksListDto {
  tasks: TaskDto[];
  total: number;
}

export interface GetTasksQueryDto {
  status?: string;
  assigneeId?: number;
  priority?: string;
  limit?: number;
  offset?: number;
}
