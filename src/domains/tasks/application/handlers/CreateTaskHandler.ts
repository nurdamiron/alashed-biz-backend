import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { Task } from '../../domain/entities/Task.js';
import { TaskPriority } from '../../domain/value-objects/TaskPriority.js';
import { ChecklistItem } from '../../domain/value-objects/ChecklistItem.js';
import { CreateTaskDto, TaskDto } from '../dto/TaskDto.js';
import { TaskMapper } from '../mappers/TaskMapper.js';
import { NotificationService } from '../../../notifications/infrastructure/services/NotificationService.js';

export class CreateTaskHandler implements UseCase<CreateTaskDto, TaskDto> {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly notificationService: NotificationService
  ) { }

  async execute(request: CreateTaskDto): Promise<Result<TaskDto>> {
    try {
      console.log('CreateTaskHandler received:', JSON.stringify(request, null, 2));

      // Convert checklist DTOs to domain objects
      const checklist = request.checklist?.map(item =>
        ChecklistItem.fromData(item)
      ) ?? [];

      const task = Task.create({
        title: request.title,
        description: request.description,
        priority: TaskPriority.create(request.priority || 'medium'),
        assigneeId: request.assigneeId,
        createdById: request.createdById,
        deadline: request.deadline ? new Date(request.deadline) : undefined,
        checklist,
        attachments: request.attachments ?? [],
      });

      const savedTask = await this.taskRepository.save(task);

      // Send notification to assignee
      if (savedTask.assigneeId) {
        await this.notificationService.notifyNewTask(
          savedTask.id!.value,
          savedTask.title,
          savedTask.assigneeId
        );
      }

      return Result.ok(TaskMapper.toDto(savedTask));
    } catch (error) {
      console.error('CreateTaskHandler error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create task');
    }
  }
}
