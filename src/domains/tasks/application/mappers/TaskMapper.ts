import { Task } from '../../domain/entities/Task.js';
import { TaskDto, TaskCommentDto, ChecklistItemDto } from '../dto/TaskDto.js';

export class TaskMapper {
  static toDto(task: Task): TaskDto {
    return {
      id: task.id?.value ?? 0,
      title: task.title,
      description: task.description,
      status: task.status.toRussian(),
      priority: task.priority.toRussian(),
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
      checklist: task.checklist.map((item): ChecklistItemDto => ({
        id: item.id,
        text: item.text,
        done: item.done,
      })),
      attachments: task.attachments,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  static toDtoList(tasks: Task[]): TaskDto[] {
    return tasks.map(this.toDto);
  }
}
