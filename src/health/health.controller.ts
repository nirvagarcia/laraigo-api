import { Controller, Get } from '@nestjs/common';
import { HealthService, HealthStatus } from './health.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Controller('health')
export class HealthController {
  constructor(
    @InjectPinoLogger(HealthController.name)
    private readonly logger: PinoLogger,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  async getHealth(): Promise<HealthStatus> {
    this.logger.info(
      { event: 'HEALTH_CHECK', module: 'HealthController' },
      'Health check requested'
    );
    
    const healthStatus = await this.healthService.checkHealth();
    
    this.logger.info(
      { 
        event: 'HEALTH_CHECK_COMPLETE', 
        module: 'HealthController',
        status: healthStatus.status,
        database: healthStatus.database,
        redis: healthStatus.redis
      },
      'Health check completed'
    );
    
    return healthStatus;
  }
}