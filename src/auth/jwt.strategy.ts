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

  async validate(payload: JwtPayload): Promise<UserSession> {
    console.log('🔍 [JwtStrategy] Decoded JWT payload:', payload);
    console.log('🔍 [JwtStrategy] Checking Redis for token:', `access:${payload.jti}`);
    
    const tokenExists = await this.redisService.exists(`access:${payload.jti}`);
    console.log('🔍 [JwtStrategy] Redis token exists:', tokenExists);
    
    if (!tokenExists) {
      console.log('❌ [JwtStrategy] Token not found in Redis - throwing UnauthorizedException');
      throw new UnauthorizedException();
    }

    const userSession = {
      userId: payload.sub,
      role: payload.role,
      jti: payload.jti,
    };
    
    console.log('✅ [JwtStrategy] Auth successful for user:', userSession.userId);
    return userSession;
  }
}