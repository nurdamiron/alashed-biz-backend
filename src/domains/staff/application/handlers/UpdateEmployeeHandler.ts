import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository.js';
import { EmployeeId } from '../../domain/value-objects/EmployeeId.js';
import { UpdateEmployeeDto, EmployeeDto } from '../dto/EmployeeDto.js';
import { EmployeeMapper } from '../mappers/EmployeeMapper.js';

export class UpdateEmployeeHandler implements UseCase<UpdateEmployeeDto, EmployeeDto> {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(request: UpdateEmployeeDto): Promise<Result<EmployeeDto>> {
    try {
      const employeeId = EmployeeId.create(request.employeeId);

      // Get employee
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        return Result.fail(`Employee ${request.employeeId} not found`);
      }

      // Update fields
      employee.update({
        name: request.name,
        department: request.department,
        position: request.position,
        phone: request.phone,
        email: request.email,
      });

      // Save
      await this.employeeRepository.update(employee);

      return Result.ok(EmployeeMapper.toDto(employee));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to update employee');
    }
  }
}
