import { UseCase } from '../../../../shared/application/UseCase.js';
import { Result } from '../../../../shared/application/Result.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { config } from '../../../../config/index.js';
import jwt from 'jsonwebtoken';

const jwtSign = (jwt as any).sign || (jwt as any).default?.sign;
const jwtVerify = (jwt as any).verify || (jwt as any).default?.verify;

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenHandler implements UseCase<RefreshTokenRequestDto, RefreshTokenResponseDto> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(request: RefreshTokenRequestDto): Promise<Result<RefreshTokenResponseDto>> {
    try {
      // Verify refresh token
      let decoded: any;
      try {
        decoded = jwtVerify(request.refreshToken, config.jwt.refreshSecret);
      } catch (error) {
        return Result.fail('Invalid or expired refresh token');
      }

      // Get user from database
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        return Result.fail('User not found');
      }

      // Generate new tokens
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

      return Result.ok({
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof Error) {
        return Result.fail(error.message);
      }
      return Result.fail('Failed to refresh token');
    }
  }
}
