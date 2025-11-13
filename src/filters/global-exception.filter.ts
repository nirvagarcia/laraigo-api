import { 
  Catch, 
  ExceptionFilter, 
  ArgumentsHost, 
  HttpException, 
  HttpStatus,
  Injectable
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string, user?: { userId: number } }>();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : exception?.message || 'Internal server error';

    const errorMessage = typeof message === 'string' ? message : (message as any)?.message || 'Unknown error';

    const errorContext = {
      event: status >= 500 ? 'EXCEPTION_ERROR' : 'EXCEPTION_WARN',
      module: 'GlobalExceptionFilter',
      requestId: request.requestId,
      userId: request.user?.userId,
      method: request.method,
      url: request.url,
      statusCode: status,
      userAgent: request.get('user-agent'),
      ip: request.ip,
      metadata: {
        exceptionType: exception.constructor.name,
        stack: process.env.NODE_ENV !== 'production' ? exception.stack : undefined
      }
    };

    if (status >= 500) {
      this.logger.error(
        errorContext,
        `Internal Server Error: ${errorMessage}`
      );
    } else if (status >= 400) {
      this.logger.warn(
        errorContext,
        `Client Error: ${errorMessage}`
      );
    } else {
      this.logger.info(
        errorContext,
        `Exception occurred: ${errorMessage}`
      );
    }

    const responseBody = {
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.requestId,
    };

    if (process.env.NODE_ENV !== 'production' && status >= 500) {
      (responseBody as any).stack = exception.stack;
    }

    response.status(status).json(responseBody);
  }
}