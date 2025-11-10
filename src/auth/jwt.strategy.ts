import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../redis/redis.service';
import { JwtPayload, UserSession } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private redisService: RedisService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  /** Validates JWT payload and verifies token exists in Redis allowlist */
  async validate(payload: JwtPayload): Promise<UserSession> {
    const tokenExists = await this.redisService.exists(`access:${payload.jti}`);
    
    if (!tokenExists) {
      throw new UnauthorizedException('Token not found in session store');
    }

    return {
      userId: payload.sub,
      role: payload.role,
      jti: payload.jti,
    };
  }
}