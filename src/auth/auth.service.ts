import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
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

    return {
      user,
      ...tokens,
    };
  }

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

    await this.redisService.del(`refresh:${payload.jti}`);
    await this.redisService.srem(`user:${user.id}:sessions`, payload.jti);

    return this.generateTokenPair(user.id, user.role);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    return this.refresh({ refreshToken });
  }

  async logout(user: UserSession): Promise<void> {
    console.log('🔍 [AuthService] Logout for user:', user.userId, 'jti:', user.jti);
    await Promise.all([
      this.redisService.del(`access:${user.jti}`),
      this.redisService.srem(`user:${user.userId}:sessions`, user.jti),
    ]);
    console.log('✅ [AuthService] Logout successful - token revoked');
  }

  async logoutAll(user: UserSession): Promise<void> {
    const sessions = await this.redisService.smembers(`user:${user.userId}:sessions`);
    
    const deletePromises = sessions.flatMap(jti => [
      this.redisService.del(`access:${jti}`),
      this.redisService.del(`refresh:${jti}`),
    ]);

    deletePromises.push(this.redisService.del(`user:${user.userId}:sessions`));

    await Promise.all(deletePromises);
  }

  private async generateTokenPair(userId: number, role: string): Promise<TokenPair> {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    console.log('🔍 [AuthService] Generating tokens for user:', userId, 'with JTIs:', { accessJti, refreshJti });

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

    const accessTtl = 15 * 60;
    const refreshTtl = 7 * 24 * 60 * 60;

    console.log('🔍 [AuthService] Storing tokens in Redis with TTL:', { accessTtl, refreshTtl });

    await Promise.all([
      this.redisService.set(`access:${accessJti}`, userId.toString(), accessTtl),
      this.redisService.set(`refresh:${refreshJti}`, userId.toString(), refreshTtl),
      this.redisService.sadd(`user:${userId}:sessions`, accessJti),
      this.redisService.sadd(`user:${userId}:sessions`, refreshJti),
    ]);

    console.log('✅ [AuthService] Token pair generated and stored successfully');

    return {
      accessToken,
      refreshToken,
      expiresIn: '15m',
    };
  }
}