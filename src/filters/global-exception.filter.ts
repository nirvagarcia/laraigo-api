import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response, Request } from 'express';
import { LoggerService } from '../logger.service';
import { NotFoundError, ValidationError, DatabaseError, ConflictError } from '../errors/custom-errors';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof NotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = exception.message;
      this.logger.warn(`NotFound Error: ${exception.message} - Path: ${request.url} - Method: ${request.method}`);
    } else if (exception instanceof ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message;
      this.logger.warn(`Validation Error: ${exception.message} - Path: ${request.url} - Method: ${request.method}`);
    } else if (exception instanceof DatabaseError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database operation failed';
      this.logger.error(`Database Error: ${exception.message} - Path: ${request.url} - Method: ${request.method}`);
      this.logger.error(`Stack trace: ${exception.stack}`);
    } else if (exception instanceof ConflictError) {
      status = HttpStatus.CONFLICT;
      message = exception.message;
      this.logger.warn(`Conflict Error: ${exception.message} - Path: ${request.url} - Method: ${request.method}`);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        
        if (responseObj.errors && Array.isArray(responseObj.errors)) {
          message = responseObj.message;
          errors = responseObj.errors;
        } else if (Array.isArray(responseObj.message)) {
          const primaryError = this.getPrimaryError(responseObj.message);
          message = primaryError.message;
          errors = [primaryError];
        } else {
          message = responseObj.message || responseObj.error || exception.message;
        }
      } else {
        message = exceptionResponse as string;
      }
      
      this.logger.error(`HTTP Exception ${status}: ${message} - Path: ${request.url} - Method: ${request.method}`);
    } else if (exception instanceof Error) {
      this.logger.error(`Unexpected Error: ${exception.message} - Path: ${request.url} - Method: ${request.method}`);
      this.logger.error(`Stack trace: ${exception.stack}`);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      ...(errors.length > 0 && { errors }),
    };

    response.status(status).json(errorResponse);
  }

  private extractFieldFromMessage(message: string): string {
    const fieldMatch = message.match(/^(\w+)/);
    return fieldMatch ? fieldMatch[1] : 'unknown';
  }

  private getPrimaryError(messages: string[]): { field: string; message: string } {
    const requiredError = messages.find(msg => 
      msg.includes('is required') || msg.includes('should not be empty')
    );
    if (requiredError) {
      return {
        field: this.extractFieldFromMessage(requiredError),
        message: requiredError,
      };
    }

    const forbiddenError = messages.find(msg => 
      msg.includes('should not exist')
    );
    if (forbiddenError) {
      return {
        field: this.extractFieldFromMessage(forbiddenError),
        message: forbiddenError,
      };
    }

    const typeError = messages.find(msg => 
      msg.includes('must be a string') || 
      msg.includes('must be a number') || 
      msg.includes('must be a boolean')
    );
    if (typeError) {
      return {
        field: this.extractFieldFromMessage(typeError),
        message: typeError,
      };
    }

    return {
      field: this.extractFieldFromMessage(messages[0]),
      message: messages[0],
    };
  }
}