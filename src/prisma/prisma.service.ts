import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(
    @InjectPinoLogger(PrismaService.name)
    private readonly logger: PinoLogger,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    
    this.logger.info(
      { event: 'PRISMA_CONNECT', module: 'PrismaService' },
      'Database connected successfully'
    );

    if (process.env.LOG_PRISMA === 'true') {
      (this as any).$use(async (params, next) => {
        const startTime = Date.now();
        
        this.logger.debug(
          { 
            event: 'QUERY_START', 
            module: 'PrismaService',
            model: params.model,
            action: params.action,
            metadata: { paramsLength: JSON.stringify(params.args).length }
          },
          'Prisma query started'
        );

        try {
          const result = await next(params);
          const durationMs = Date.now() - startTime;
          
          this.logger.debug(
            { 
              event: 'QUERY_END', 
              module: 'PrismaService',
              model: params.model,
              action: params.action,
              durationMs
            },
            'Prisma query completed'
          );
          
          return result;
        } catch (error) {
          const durationMs = Date.now() - startTime;
          
          this.logger.error(
            { 
              event: 'QUERY_ERROR', 
              module: 'PrismaService',
              model: params.model,
              action: params.action,
              durationMs,
              error: error.message
            },
            'Prisma query failed'
          );
          
          throw error;
        }
      });
    }
  }
}
