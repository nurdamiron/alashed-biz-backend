import { Employee } from '../entities/Employee.js';
import { EmployeeId } from '../value-objects/EmployeeId.js';

export interface IEmployeeRepository {
  findById(id: EmployeeId): Promise<Employee | null>;
  findAll(includeInactive?: boolean): Promise<Employee[]>;
  findByUserId(userId: number): Promise<Employee | null>;
  findByDepartment(department: string): Promise<Employee[]>;
  save(employee: Employee): Promise<Employee>;
  update(employee: Employee): Promise<void>;
  delete(id: EmployeeId): Promise<void>; // Soft delete (is_active = false)
}
