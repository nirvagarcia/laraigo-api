import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private isConnected = false;
  private hasAttemptedConnection = false;

  constructor(
    @InjectPinoLogger(RedisService.name)
    private readonly logger: PinoLogger,
  ) {

    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      connectTimeout: 5000,
    });

    this.setupEventHandlers();
    this.attemptConnection();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.info(
        { event: 'REDIS_CONNECT', module: 'RedisService' },
        'Redis connected successfully'
      );
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      if (!this.hasAttemptedConnection) {
        this.logger.warn(
          { event: 'REDIS_ERROR', module: 'RedisService', error: error.message },
          'Redis unavailable - session caching disabled'
        );
        this.hasAttemptedConnection = true;
      }
    });

    this.client.on('close', () => {
      this.isConnected = false;
      this.logger.info(
        { event: 'REDIS_DISCONNECT', module: 'RedisService' },
        'Redis connection closed'
      );
    });
  }

  private async attemptConnection() {
    if (this.hasAttemptedConnection) return;
    
    try {
      await this.client.connect();
      this.hasAttemptedConnection = true;
    } catch (error) {
      this.hasAttemptedConnection = true;
      this.logger.warn(
        { event: 'REDIS_CONNECTION_FAILED', module: 'RedisService', error: error.message },
        'Redis unavailable - session caching disabled'
      );
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    
    if (process.env.LOG_REDIS === 'true') {
      this.logger.debug(
        { event: 'REDIS_COMMAND', module: 'RedisService', operation: 'GET', key },
        'Executing Redis GET command'
      );
    }
    
    try {
      const result = await this.client.get(key);
      return result;
    } catch (error) {
      this.logger.warn(
        { event: 'REDIS_COMMAND_ERROR', module: 'RedisService', operation: 'GET', key, error: error.message },
        'Redis GET operation failed'
      );
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected) return;
    
    if (process.env.LOG_REDIS === 'true') {
      this.logger.debug(
        { event: 'REDIS_COMMAND', module: 'RedisService', operation: 'SET', key, ttl },
        'Executing Redis SET command'
      );
    }
    
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      this.logger.warn(
        { event: 'REDIS_COMMAND_ERROR', module: 'RedisService', operation: 'SET', key, ttl, error: error.message },
        'Redis SET operation failed'
      );
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    
    if (process.env.LOG_REDIS === 'true') {
      this.logger.debug(
        { event: 'REDIS_COMMAND', module: 'RedisService', operation: 'DEL', key },
        'Executing Redis DEL command'
      );
    }
    
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(
        { event: 'REDIS_COMMAND_ERROR', module: 'RedisService', operation: 'DEL', key, error: error.message },
        'Redis DEL operation failed'
      );
    }
  }

  async sadd(key: string, value: string): Promise<void> {
    if (!this.isConnected) return;
    
    if (process.env.LOG_REDIS === 'true') {
      this.logger.debug(
        { event: 'REDIS_COMMAND', module: 'RedisService', operation: 'SADD', key },
        'Executing Redis SADD command'
      );
    }
    
    try {
      await this.client.sadd(key, value);
    } catch (error) {
      this.logger.warn(
        { event: 'REDIS_COMMAND_ERROR', module: 'RedisService', operation: 'SADD', key, error: error.message },
        'Redis SADD operation failed'
      );
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.isConnected) return [];
    
    if (process.env.LOG_REDIS === 'true') {
      this.logger.debug(
        { event: 'REDIS_COMMAND', module: 'RedisService', operation: 'SMEMBERS', key },
        'Executing Redis SMEMBERS command'
      );
    }
    
    try {
      const result = await this.client.smembers(key);
      return result;
    } catch (error) {
      this.logger.warn(
        { event: 'REDIS_COMMAND_ERROR', module: 'RedisService', operation: 'SMEMBERS', key, error: error.message },
        'Redis SMEMBERS operation failed'
      );
      return [];
    }
  }

  async srem(key: string, value: string): Promise<void> {
    if (!this.isConnected) return;
    
    if (process.env.LOG_REDIS === 'true') {
      this.logger.debug(
        { event: 'REDIS_COMMAND', module: 'RedisService', operation: 'SREM', key },
        'Executing Redis SREM command'
      );
    }
    
    try {
      await this.client.srem(key, value);
    } catch (error) {
      this.logger.warn(
        { event: 'REDIS_COMMAND_ERROR', module: 'RedisService', operation: 'SREM', key, error: error.message },
        'Redis SREM operation failed'
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    if (process.env.LOG_REDIS === 'true') {
      this.logger.debug(
        { event: 'REDIS_COMMAND', module: 'RedisService', operation: 'EXISTS', key },
        'Executing Redis EXISTS command'
      );
    }
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.warn(
        { event: 'REDIS_COMMAND_ERROR', module: 'RedisService', operation: 'EXISTS', key, error: error.message },
        'Redis EXISTS operation failed'
      );
      return false;
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}