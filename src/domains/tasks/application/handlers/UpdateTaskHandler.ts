import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskPriority } from '../../domain/value-objects/TaskPriority.js';
import { UpdateTaskDto, TaskDto } from '../dto/TaskDto.js';
import { TaskMapper } from '../mappers/TaskMapper.js';

export class UpdateTaskHandler implements UseCase<UpdateTaskDto, TaskDto> {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: UpdateTaskDto): Promise<Result<TaskDto>> {
    try {
      const taskId = TaskId.create(request.taskId);
      const task = await this.taskRepository.findById(taskId);

      if (!task) {
        return Result.fail(`Task ${request.taskId} not found`);
      }

      task.update({
        title: request.title,
        description: request.description,
        priority: request.priority ? TaskPriority.create(request.priority) : undefined,
        assigneeId: request.assigneeId,
        deadline: request.deadline ? new Date(request.deadline) : undefined,
      });

      await this.taskRepository.update(task);
      return Result.ok(TaskMapper.toDto(task));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to update task');
    }
  }
}
