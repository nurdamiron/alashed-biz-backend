import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository.js';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository.js';
import { EmployeeId } from '../../domain/value-objects/EmployeeId.js';

export interface LinkUserToEmployeeRequest {
  userId: number;
  employeeId: number;
}

/**
 * Связывает User и Employee
 * - Обновляет user.employeeId
 * - Обновляет employee.userId
 */
export class LinkUserToEmployeeHandler implements UseCase<LinkUserToEmployeeRequest, void> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly employeeRepository: IEmployeeRepository
  ) {}

  async execute(request: LinkUserToEmployeeRequest): Promise<Result<void>> {
    try {
      // Get user
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        return Result.fail(`User ${request.userId} not found`);
      }

      // Get employee
      const employeeId = EmployeeId.create(request.employeeId);
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        return Result.fail(`Employee ${request.employeeId} not found`);
      }

      // Link employee to user
      employee.setUserId(request.userId);
      await this.employeeRepository.update(employee);

      // Note: User.employeeId is derived from the JOIN with employees table (employees.user_id)
      // so no separate update is needed on the users table

      return Result.ok(undefined);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to link user to employee');
    }
  }
}
