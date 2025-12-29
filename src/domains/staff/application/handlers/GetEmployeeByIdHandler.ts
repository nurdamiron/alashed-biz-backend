import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository.js';
import { EmployeeId } from '../../domain/value-objects/EmployeeId.js';
import { EmployeeDto } from '../dto/EmployeeDto.js';
import { EmployeeMapper } from '../mappers/EmployeeMapper.js';

export interface GetEmployeeByIdRequest {
  employeeId: number;
}

export class GetEmployeeByIdHandler implements UseCase<GetEmployeeByIdRequest, EmployeeDto> {
  constructor(private readonly employeeRepository: IEmployeeRepository) {}

  async execute(request: GetEmployeeByIdRequest): Promise<Result<EmployeeDto>> {
    try {
      const employeeId = EmployeeId.create(request.employeeId);

      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        return Result.fail(`Employee ${request.employeeId} not found`);
      }

      return Result.ok(EmployeeMapper.toDto(employee));
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get employee');
    }
  }
}
