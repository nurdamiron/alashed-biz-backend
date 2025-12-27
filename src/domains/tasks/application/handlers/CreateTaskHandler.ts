import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { Task } from '../../domain/entities/Task.js';
import { TaskPriority } from '../../domain/value-objects/TaskPriority.js';
import { CreateTaskDto, TaskDto } from '../dto/TaskDto.js';
import { TaskMapper } from '../mappers/TaskMapper.js';

export class CreateTaskHandler implements UseCase<CreateTaskDto, TaskDto> {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(request: CreateTaskDto): Promise<Result<TaskDto>> {
    try {
      const task = Task.create({
        title: request.title,
        description: request.description,
        priority: TaskPriority.create(request.priority || 'medium'),
        assigneeId: request.assigneeId,
        createdById: request.createdById,
        deadline: request.deadline ? new Date(request.deadline) : undefined,
      });

      const savedTask = await this.taskRepository.save(task);

      return Result.ok(TaskMapper.toDto(savedTask));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create task');
    }
  }
}
