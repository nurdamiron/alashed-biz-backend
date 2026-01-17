import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { UserDto } from '../dto/AuthDto.js';

interface GetCurrentUserRequest {
  userId: number;
}

export class GetCurrentUserHandler implements UseCase<GetCurrentUserRequest, UserDto> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: GetCurrentUserRequest): Promise<Result<UserDto>> {
    try {
      const user = await this.userRepository.findById(request.userId);

      if (!user) {
        return Result.fail('User not found');
      }

      const userDto: UserDto = {
        id: user.id,
        email: user.email.value,
        name: user.fullName,
        role: user.role.value,
        employeeId: user.employeeId,
        preferences: user.preferences,
      };

      return Result.ok(userDto);
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to get user');
    }
  }
}
