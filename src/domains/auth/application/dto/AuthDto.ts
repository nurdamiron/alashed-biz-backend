export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface UserDto {
  id: number;
  email: string;
  name: string;
  role: string;
  employeeId?: number;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
}
