import { query, transaction } from '../../../../shared/infrastructure/database/PostgresConnection.js';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository.js';
import { Employee } from '../../domain/entities/Employee.js';
import { EmployeeId } from '../../domain/value-objects/EmployeeId.js';

export class PostgresEmployeeRepository implements IEmployeeRepository {
  async findById(id: EmployeeId): Promise<Employee | null> {
    const result = await query(
      `SELECT * FROM employees WHERE id = $1`,
      [id.value]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Employee.fromPersistence(result.rows[0]);
  }

  async findAll(includeInactive = false): Promise<Employee[]> {
    const sql = includeInactive
      ? `SELECT * FROM employees ORDER BY name`
      : `SELECT * FROM employees WHERE is_active = true ORDER BY name`;

    const result = await query(sql);
    return result.rows.map((row) => Employee.fromPersistence(row));
  }

  async findByUserId(userId: number): Promise<Employee | null> {
    const result = await query(
      `SELECT * FROM employees WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return Employee.fromPersistence(result.rows[0]);
  }

  async findByDepartment(department: string): Promise<Employee[]> {
    const result = await query(
      `SELECT * FROM employees WHERE department = $1 AND is_active = true ORDER BY name`,
      [department]
    );

    return result.rows.map((row) => Employee.fromPersistence(row));
  }

  async save(employee: Employee): Promise<Employee> {
    const result = await query(
      `INSERT INTO employees (user_id, name, department, position, phone, email, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        employee.userId,
        employee.name,
        employee.department,
        employee.position,
        employee.phone,
        employee.email,
        employee.isActive,
        employee.createdAt,
        employee.updatedAt,
      ]
    );

    const employeeId = EmployeeId.create(result.rows[0].id);
    employee.setId(employeeId);

    return employee;
  }

  async update(employee: Employee): Promise<void> {
    if (!employee.id) {
      throw new Error('Cannot update employee without ID');
    }

    await query(
      `UPDATE employees
       SET name = $1, department = $2, position = $3, phone = $4, email = $5,
           is_active = $6, user_id = $7, updated_at = $8
       WHERE id = $9`,
      [
        employee.name,
        employee.department,
        employee.position,
        employee.phone,
        employee.email,
        employee.isActive,
        employee.userId,
        employee.updatedAt,
        employee.id.value,
      ]
    );
  }

  async delete(id: EmployeeId): Promise<void> {
    // Soft delete
    await query(
      `UPDATE employees SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id.value]
    );
  }
}
