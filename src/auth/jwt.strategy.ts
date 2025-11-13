import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../redis/redis.service';
import { JwtPayload, UserSession } from './auth.types';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectPinoLogger(JwtStrategy.name)
    private readonly logger: PinoLogger,
    private redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET,
    });
  }

  async validate(payload: JwtPayload): Promise<UserSession> {
    this.logger.debug(
      { event: 'JWT_VALIDATE', module: 'JwtStrategy', userId: payload.sub, jti: payload.jti },
      'Validating JWT token'
    );
    
    const tokenExists = await this.redisService.exists(`access:${payload.jti}`);
    
    if (!tokenExists) {
      this.logger.warn(
        { event: 'JWT_TOKEN_NOT_FOUND', module: 'JwtStrategy', userId: payload.sub, jti: payload.jti },
        'Token not found in session store'
      );
      throw new UnauthorizedException('Token not found in session store');
    }

    this.logger.debug(
      { event: 'JWT_VALIDATE_SUCCESS', module: 'JwtStrategy', userId: payload.sub },
      'JWT token validated successfully'
    );

    return {
      userId: payload.sub,
      role: payload.role,
      jti: payload.jti,
    };
  }
}