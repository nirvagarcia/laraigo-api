import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly logger: PinoLogger) {}

  use(req: any, res: Response, next: NextFunction) {
    const requestId = randomUUID();
    req.requestId = requestId;
    
    this.logger.assign({ requestId });
    
    if (process.env.LOG_REQUESTS !== 'false') {
      const startTime = Date.now();
      
      this.logger.info(
        {
          event: 'REQUEST_START',
          module: 'RequestContextMiddleware',
          requestId,
          method: req.method,
          url: req.url,
          userAgent: req.get('user-agent'),
          ip: req.ip,
        },
        'Incoming request',
      );
      
      res.on('finish', () => {
        const durationMs = Date.now() - startTime;
        
        this.logger.info(
          {
            event: 'REQUEST_COMPLETE',
            module: 'RequestContextMiddleware',
            requestId,
            statusCode: res.statusCode,
            durationMs,
            contentLength: res.get('content-length'),
          },
          'Request completed',
        );
      });
    }
    
    next();
  }
}