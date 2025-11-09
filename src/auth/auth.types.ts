export interface JwtPayload {
  sub: number;
  role: string;
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
  role: string;
  jti: string;
}