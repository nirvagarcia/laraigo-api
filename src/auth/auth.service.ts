import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { TokenPair, JwtPayload, UserSession } from './auth.types';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ADMIN_EMAIL = 'nirvana.garcia@laraigo.com';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  /** Register new user and issue JWT tokens */
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    
    const role: Role = dto.email === this.ADMIN_EMAIL ? Role.ADMIN : Role.USER;

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokenPair(user.id, user.role);
    this.logger.log(`User registered: ${user.email} with role: ${user.role}`);

    return { user, ...tokens };
  }

  /** Authenticate user and issue JWT tokens */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        createdAt: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokenPair(user.id, user.role);
    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  /** Refresh access token using valid refresh token */
  async refresh(dto: RefreshDto): Promise<TokenPair> {
    let payload: JwtPayload;
    
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenExists = await this.redisService.exists(`refresh:${payload.jti}`);
    
    if (!tokenExists) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await Promise.all([
      this.redisService.del(`refresh:${payload.jti}`),
      this.redisService.srem(`user:${user.id}:sessions`, payload.jti),
    ]);

    return this.generateTokenPair(user.id, user.role);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    return this.refresh({ refreshToken });
  }

  /** Revoke access token and remove from Redis session store */
  async logout(user: UserSession): Promise<void> {
    await Promise.all([
      this.redisService.del(`access:${user.jti}`),
      this.redisService.srem(`user:${user.userId}:sessions`, user.jti),
    ]);
    this.logger.log(`Token revoked for user: ${user.userId}`);
  }

  /** Revoke all user sessions */
  async logoutAll(user: UserSession): Promise<void> {
    const sessions = await this.redisService.smembers(`user:${user.userId}:sessions`);
    
    const deletePromises = sessions.flatMap(jti => [
      this.redisService.del(`access:${jti}`),
      this.redisService.del(`refresh:${jti}`),
    ]);

    deletePromises.push(this.redisService.del(`user:${user.userId}:sessions`));

    await Promise.all(deletePromises);
    this.logger.log(`All sessions revoked for user: ${user.userId}`);
  }

  /** Generate JWT token pair and store in Redis */
  private async generateTokenPair(userId: number, role: Role): Promise<TokenPair> {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessToken = this.jwtService.sign({
      sub: userId,
      role: role,
      jti: accessJti,
    }, {
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign({
      sub: userId,
      role: role,
      jti: refreshJti,
    }, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const accessTtl = 15 * 60; // 15 minutes
    const refreshTtl = 7 * 24 * 60 * 60; // 7 days

    await Promise.all([
      this.redisService.set(`access:${accessJti}`, userId.toString(), accessTtl),
      this.redisService.set(`refresh:${refreshJti}`, userId.toString(), refreshTtl),
      this.redisService.sadd(`user:${userId}:sessions`, accessJti),
      this.redisService.sadd(`user:${userId}:sessions`, refreshJti),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: '15m',
    };
  }
}