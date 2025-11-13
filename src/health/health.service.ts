import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    @InjectPinoLogger(HealthService.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async checkHealth(): Promise<HealthStatus> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';
    let redisStatus: 'connected' | 'disconnected' = 'disconnected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
      this.logger.debug(
        { event: 'DATABASE_HEALTH_CHECK', module: 'HealthService' },
        'Database health check passed'
      );
    } catch (error) {
      this.logger.warn(
        { event: 'DATABASE_HEALTH_CHECK_FAILED', module: 'HealthService', error: error.message },
        'Database health check failed'
      );
    }

    try {
      const testResult = await this.redisService.exists('health:check');
      redisStatus = 'connected';
      this.logger.debug(
        { event: 'REDIS_HEALTH_CHECK', module: 'HealthService' },
        'Redis health check passed'
      );
    } catch (error) {
      this.logger.warn(
        { event: 'REDIS_HEALTH_CHECK_FAILED', module: 'HealthService', error: error.message },
        'Redis health check failed'
      );
    }

    const status = 
      databaseStatus === 'connected' && redisStatus === 'connected' 
        ? 'ok' 
        : databaseStatus === 'connected' || redisStatus === 'connected'
        ? 'degraded'
        : 'down';

    return {
      status,
      uptime,
      database: databaseStatus,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    };
  }
}