import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository.js';
import { EmployeesListDto } from '../dto/EmployeeDto.js';
import { EmployeeMapper } from '../mappers/EmployeeMapper.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';

export interface GetEmployeesRequest {
  includeInactive?: boolean;
  department?: string;
}

export class GetEmployeesHandler implements UseCase<GetEmployeesRequest, EmployeesListDto> {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(request: GetEmployeesRequest): Promise<Result<EmployeesListDto>> {
    try {
      let employees;

      if (request.department) {
        employees = await this.employeeRepository.findByDepartment(request.department);
      } else {
        employees = await this.employeeRepository.findAll(request.includeInactive);
      }

      // Get active tasks count for each employee
      const employeesWithTasks = await Promise.all(
        employees.map(async (employee) => {
          const tasksResult = await query(
            `SELECT COUNT(DISTINCT t.id) as active_tasks_count
             FROM tasks t
             JOIN task_assignees ta ON t.id = ta.task_id
             WHERE ta.employee_id = $1
             AND t.status NOT IN ('completed', 'cancelled')`,
            [employee.id!.value]
          );

          const dto = EmployeeMapper.toDto(employee);
          dto.activeTasksCount = parseInt(tasksResult.rows[0].active_tasks_count) || 0;
          return dto;
        })
      );

      return Result.ok({
        employees: employeesWithTasks,
        total: employeesWithTasks.length,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get employees');
    }
  }
}
