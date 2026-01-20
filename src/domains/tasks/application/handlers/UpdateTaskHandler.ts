import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository.js';
import { TaskAssignee } from '../../domain/entities/Task.js';
import { TaskId } from '../../domain/value-objects/TaskId.js';
import { TaskPriority } from '../../domain/value-objects/TaskPriority.js';
import { ChecklistItem } from '../../domain/value-objects/ChecklistItem.js';
import { UpdateTaskDto, TaskDto } from '../dto/TaskDto.js';
import { TaskMapper } from '../mappers/TaskMapper.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

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

      // Fetch assignee names if assigneeIds provided
      let assignees: TaskAssignee[] | undefined;
      if (request.assigneeIds) {
        if (request.assigneeIds.length > 0) {
          const result = await query(
            `SELECT id, name FROM employees WHERE id = ANY($1)`,
            [request.assigneeIds]
          );
          assignees = result.rows.map(row => ({ id: row.id, name: row.name }));
        } else {
          assignees = [];
        }
      }

      task.update({
        title: request.title,
        description: request.description,
        priority: request.priority ? TaskPriority.create(request.priority) : undefined,
        assignees,
        deadline: request.deadline ? new Date(request.deadline) : undefined,
        checklist,
        attachments: request.attachments,
      });

      await this.taskRepository.update(task);

      // Reload task to get updated assignees
      const reloadedTask = await this.taskRepository.findById(taskId);

      return Result.ok(TaskMapper.toDto(reloadedTask || task));
    } catch (error) {
      return Result.fail(error instanceof Error ? error.message : 'Failed to update task');
    }
  }
}
