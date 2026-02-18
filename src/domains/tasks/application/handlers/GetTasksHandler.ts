import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskStatus } from '../../domain/value-objects/TaskStatus.js';
import { GetTasksQueryDto, TasksListDto } from '../dto/TaskDto.js';
import { TaskMapper } from '../mappers/TaskMapper.js';

export class GetTasksHandler implements UseCase<GetTasksQueryDto, TasksListDto> {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: GetTasksQueryDto): Promise<Result<TasksListDto>> {
    try {
      const filters: any = {};

      if (request.status) {
        filters.status = TaskStatus.create(request.status);
      }
      if (request.assigneeId) {
        filters.assigneeId = request.assigneeId;
      }
      if (request.priority) {
        filters.priority = request.priority;
      }

      const pagination = request.limit ? {
        limit: request.limit,
        offset: request.offset ?? 0,
      } : undefined;

      const [tasks, total] = await Promise.all([
        this.taskRepository.findAll(Object.keys(filters).length ? filters : undefined, pagination),
        this.taskRepository.count(Object.keys(filters).length ? filters : undefined),
      ]);

      return Result.ok({
        tasks: TaskMapper.toDtoList(tasks),
        total,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get tasks');
    }
  }
}
