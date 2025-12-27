import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { query } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { StaffListDto, EmployeeDto } from '../dto/StaffDto.js';

export class GetStaffHandler implements UseCase<void, StaffListDto> {
  async execute(): Promise<Result<StaffListDto>> {
    try {
      const result = await query(`SELECT e.*, (SELECT COUNT(*) FROM tasks t WHERE (t.assignee_id = e.id OR t.employee_id = e.id) AND t.status NOT IN ('completed', 'cancelled')) as active_tasks_count FROM employees e WHERE e.is_active = true ORDER BY e.name`);
      const employees: EmployeeDto[] = result.rows.map(row => ({
        id: row.id, userId: row.user_id, name: row.name, department: row.department, position: row.position,
        phone: row.phone, email: row.email, isActive: row.is_active, activeTasksCount: parseInt(row.active_tasks_count) || 0,
      }));
      return Result.ok({ employees, total: employees.length });
    } catch (error) { return Result.fail(error instanceof Error ? error.message : 'Failed'); }
  }
}
