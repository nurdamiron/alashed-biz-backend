import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskComment } from '../../domain/entities/TaskComment.js';
import { AddTaskCommentDto, TaskCommentDto } from '../dto/TaskDto.js';

export class AddTaskCommentHandler implements UseCase<AddTaskCommentDto, TaskCommentDto> {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: AddTaskCommentDto): Promise<Result<TaskCommentDto>> {
    try {
      const taskId = TaskId.create(request.taskId);
      const task = await this.taskRepository.findById(taskId);

      if (!task) {
        return Result.fail(`Task ${request.taskId} not found`);
      }

      const comment = TaskComment.create({
        taskId: request.taskId,
        userId: request.userId,
        comment: request.comment,
      });

      const saved = await this.taskRepository.addComment(taskId, comment);

      return Result.ok({
        id: saved.id ?? 0,
        taskId: saved.taskId,
        userId: saved.userId,
        userName: saved.userName,
        comment: saved.comment,
        createdAt: saved.createdAt.toISOString(),
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to add comment');
    }
  }
}
