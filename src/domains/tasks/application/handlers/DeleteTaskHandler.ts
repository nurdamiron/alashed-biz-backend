import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';

export interface DeleteTaskDto {
  taskId: number;
}

export class DeleteTaskHandler implements UseCase<DeleteTaskDto, void> {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: DeleteTaskDto): Promise<Result<void>> {
    try {
      const taskId = TaskId.create(request.taskId);
      const task = await this.taskRepository.findById(taskId);

      if (!task) {
        return Result.fail(`Task ${request.taskId} not found`);
      }

      await this.taskRepository.delete(taskId);

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to delete task');
    }
  }
}
