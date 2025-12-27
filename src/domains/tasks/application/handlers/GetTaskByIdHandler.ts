import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskDto } from '../dto/TaskDto.js';
import { TaskMapper } from '../mappers/TaskMapper.js';

interface GetTaskByIdQuery {
  taskId: number;
}

export class GetTaskByIdHandler implements UseCase<GetTaskByIdQuery, TaskDto> {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: GetTaskByIdQuery): Promise<Result<TaskDto>> {
    try {
      const taskId = TaskId.create(request.taskId);
      const task = await this.taskRepository.findById(taskId);

      if (!task) {
        return Result.fail(`Task ${request.taskId} not found`);
      }

      return Result.ok(TaskMapper.toDto(task));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get task');
    }
  }
}
