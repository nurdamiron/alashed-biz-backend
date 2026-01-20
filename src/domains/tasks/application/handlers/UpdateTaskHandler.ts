import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskPriority } from '../../domain/value-objects/TaskPriority.js';
import { ChecklistItem } from '../../domain/value-objects/ChecklistItem.js';
import { UpdateTaskDto, TaskDto } from '../dto/TaskDto.js';
import { TaskMapper } from '../mappers/TaskMapper.js';
import { PostgresTaskRepository } from '../../infrastructure/repositories/PostgresTaskRepository.js';

export class UpdateTaskHandler implements UseCase<UpdateTaskDto, TaskDto> {
  constructor(private readonly taskRepository: ITaskRepository) { }

  async execute(request: UpdateTaskDto): Promise<Result<TaskDto>> {
    try {
      const taskId = TaskId.create(request.taskId);
      const task = await this.taskRepository.findById(taskId);

      if (!task) {
        return Result.fail(`Task ${request.taskId} not found`);
      }

      // Convert checklist DTOs to domain objects if provided
      const checklist = request.checklist?.map(item =>
        ChecklistItem.fromData(item)
      );

      // Поддержка как одного assigneeId, так и массива assigneeIds
      const assigneeIds = request.assigneeIds || (request.assigneeId ? [request.assigneeId] : undefined);
      const primaryAssigneeId = assigneeIds && assigneeIds.length > 0 ? assigneeIds[0] : request.assigneeId;

      task.update({
        title: request.title,
        description: request.description,
        priority: request.priority ? TaskPriority.create(request.priority) : undefined,
        assigneeId: primaryAssigneeId,
        deadline: request.deadline ? new Date(request.deadline) : undefined,
        checklist,
        attachments: request.attachments,
      });

      await this.taskRepository.update(task);

      // Обновляем исполнителей в task_assignees если переданы assigneeIds
      if (assigneeIds && this.taskRepository instanceof PostgresTaskRepository) {
        await this.taskRepository.saveAssignees(request.taskId, assigneeIds);
      }

      // Перезагружаем задачу чтобы получить актуальных исполнителей
      const reloadedTask = await this.taskRepository.findById(taskId);

      return Result.ok(TaskMapper.toDto(reloadedTask || task));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to update task');
    }
  }
}
