import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { PasswordService } from '../../../../shared/infrastructure/auth/PasswordService.js';
import { LoginRequestDto, LoginResponseDto, UserDto } from '../dto/AuthDto.js';
import { config } from '../../../../config/index.js';
import jwt from 'jsonwebtoken';

// Объявляем jwt как any чтобы обойти проблемы с типами
const jwtSign = (jwt as any).sign || (jwt as any).default?.sign;

export class LoginHandler implements UseCase<LoginRequestDto, LoginResponseDto> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: LoginRequestDto): Promise<Result<LoginResponseDto>> {
    try {
      // Find user by username
      const user = await this.userRepository.findByUsername(request.username);

      if (!user) {
        return Result.fail('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await PasswordService.compare(
        request.password,
        user.passwordHash
      );
      if (!isValidPassword) {
        return Result.fail('Invalid credentials');
      }

      // Update last login
      await this.userRepository.updateLastLogin(user.id);

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email.value,
        role: user.role.value,
      };

      const accessToken = jwtSign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      const refreshToken = jwtSign(tokenPayload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn,
      });

      // Build response
      const userDto: UserDto = {
        id: user.id,
        email: user.email.value,
        name: user.fullName,
        role: user.role.value,
        employeeId: user.employeeId,
      };

      return Result.ok({
        accessToken,
        refreshToken,
        user: userDto,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Login failed');
    }
  }
}
