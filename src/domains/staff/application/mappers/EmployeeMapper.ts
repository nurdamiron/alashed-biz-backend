import { Employee } from '../../domain/entities/Employee.js';
import { EmployeeDto } from '../dto/EmployeeDto.js';

export class EmployeeMapper {
  public static toDto(employee: Employee): EmployeeDto {
    return {
      id: employee.id!.value,
      userId: employee.userId,
      name: employee.name,
      department: employee.department,
      position: employee.position,
      phone: employee.phone,
      email: employee.email,
      isActive: employee.isActive,
      createdAt: employee.createdAt.toISOString(),
      updatedAt: employee.updatedAt.toISOString(),
    };
  }

  public static toDtoList(employees: Employee[]): EmployeeDto[] {
    return employees.map((employee) => this.toDto(employee));
  }
}
