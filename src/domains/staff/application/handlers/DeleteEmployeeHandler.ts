import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository.js';
import { EmployeeId } from '../../domain/value-objects/EmployeeId.js';

export interface DeleteEmployeeRequest {
  employeeId: number;
}

/**
 * Деактивирует сотрудника (soft delete)
 */
export class DeleteEmployeeHandler implements UseCase<DeleteEmployeeRequest, void> {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(request: DeleteEmployeeRequest): Promise<Result<void>> {
    try {
      const employeeId = EmployeeId.create(request.employeeId);

      // Check if exists
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        return Result.fail(`Employee ${request.employeeId} not found`);
      }

      // Soft delete
      await this.employeeRepository.delete(employeeId);

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to delete employee');
    }
  }
}
