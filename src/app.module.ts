import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './users/user.module';
import { LoggerService } from './logger.service';

@Module({
	imports: [
		ThrottlerModule.forRoot([{
			ttl: 60000,
			limit: 100,
		}]),
		UserModule,
	],
	providers: [
		LoggerService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
