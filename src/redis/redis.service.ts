import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private isConnected = false;
  private hasAttemptedConnection = false;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
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
      this.logger.log('Redis connected successfully');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      if (!this.hasAttemptedConnection) {
        this.logger.warn('Redis unavailable - session caching disabled');
        this.hasAttemptedConnection = true;
      }
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });
  }

  private async attemptConnection() {
    if (this.hasAttemptedConnection) return;
    
    try {
      await this.client.connect();
      this.hasAttemptedConnection = true;
    } catch (error) {
      this.hasAttemptedConnection = true;
      this.logger.warn('Redis unavailable - session caching disabled');
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      this.logger.warn(`Redis GET error: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.isConnected) return;
    try {
      console.log('🔍 [RedisService] Setting key:', key, 'value:', value, 'ttl:', ttl);
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      console.log('✅ [RedisService] Successfully set key:', key);
    } catch (error) {
      this.logger.warn(`Redis SET error: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Redis DEL error: ${error.message}`);
    }
  }

  async sadd(key: string, value: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.sadd(key, value);
    } catch (error) {
      this.logger.warn(`Redis SADD error: ${error.message}`);
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.isConnected) return [];
    try {
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.warn(`Redis SMEMBERS error: ${error.message}`);
      return [];
    }
  }

  async srem(key: string, value: string): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.client.srem(key, value);
    } catch (error) {
      this.logger.warn(`Redis SREM error: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    try {
      console.log('🔍 [RedisService] Checking if key exists:', key);
      const result = await this.client.exists(key);
      const exists = result === 1;
      console.log('🔍 [RedisService] Key exists result:', exists);
      return exists;
    } catch (error) {
      this.logger.warn(`Redis EXISTS error: ${error.message}`);
      return false;
    }
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}