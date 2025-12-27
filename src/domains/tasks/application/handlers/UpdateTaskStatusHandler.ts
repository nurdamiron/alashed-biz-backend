import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskStatus } from '../../domain/value-objects/TaskStatus.js';
import { UpdateTaskStatusDto, TaskDto } from '../dto/TaskDto.js';
import { TaskMapper } from '../mappers/TaskMapper.js';

export class UpdateTaskStatusHandler implements UseCase<UpdateTaskStatusDto, TaskDto> {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: UpdateTaskStatusDto): Promise<Result<TaskDto>> {
    try {
      const taskId = TaskId.create(request.taskId);
      const newStatus = TaskStatus.create(request.status);
      const task = await this.taskRepository.findById(taskId);

      if (!task) {
        return Result.fail(`Task ${request.taskId} not found`);
      }

      task.changeStatus(newStatus);
      await this.taskRepository.updateStatus(taskId, newStatus);

      const updatedTask = await this.taskRepository.findById(taskId);
      return Result.ok(TaskMapper.toDto(updatedTask!));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to update status');
    }
  }
}
