import { Task } from '../../domain/entities/Task.js';
import { TaskDto, TaskCommentDto } from '../dto/TaskDto.js';

export class TaskMapper {
  static toDto(task: Task): TaskDto {
    return {
      id: task.id?.value ?? 0,
      title: task.title,
      description: task.description,
      status: task.status.value,
      priority: task.priority.value,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      createdById: task.createdById,
      deadline: task.deadline?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      isOverdue: task.isOverdue,
      comments: task.comments.map((c): TaskCommentDto => ({
        id: c.id ?? 0,
        taskId: c.taskId,
        userId: c.userId,
        userName: c.userName,
        comment: c.comment,
        createdAt: c.createdAt.toISOString(),
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  static toDtoList(tasks: Task[]): TaskDto[] {
    return tasks.map(this.toDto);
  }
}
