import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { CampaignModule } from './campaigns/campaign.module';
import { HealthModule } from './health/health.module';
import { pinoConfig } from './config/logger.config';
import { RequestContextMiddleware } from './middleware/request-context.middleware';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Module({
  imports: [
    LoggerModule.forRoot(pinoConfig),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
    UserModule, 
    AuthModule, 
    CampaignModule,
    HealthModule,
  ],
  providers: [
    GlobalExceptionFilter,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
