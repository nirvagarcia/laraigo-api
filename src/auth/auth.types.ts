import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: number;
  role: Role;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface UserSession {
  userId: number;
  role: Role;
  jti: string;
}