import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository.js';
import { Employee } from '../../domain/entities/Employee.js';
import { CreateEmployeeDto, EmployeeDto } from '../dto/EmployeeDto.js';
import { EmployeeMapper } from '../mappers/EmployeeMapper.js';

export class CreateEmployeeHandler implements UseCase<CreateEmployeeDto, EmployeeDto> {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(request: CreateEmployeeDto): Promise<Result<EmployeeDto>> {
    try {
      // Create employee
      const employee = Employee.create({
        userId: request.userId,
        name: request.name,
        department: request.department,
        position: request.position,
        phone: request.phone,
        email: request.email,
      });

      // Save
      const savedEmployee = await this.employeeRepository.save(employee);

      return Result.ok(EmployeeMapper.toDto(savedEmployee));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to create employee');
    }
  }
}
