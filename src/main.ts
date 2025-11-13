import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const globalExceptionFilter = app.get(GlobalExceptionFilter);
  app.useGlobalFilters(globalExceptionFilter);

  app.enableCors({
    origin: [
      'http://localhost:5071',
      'http://localhost:5173',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  logger.log(`🚀 Laraigo API started on http://localhost:${port}`);
  logger.log(`🌐 CORS enabled for origins: ${JSON.stringify(['http://localhost:5071', 'http://localhost:5173', 'http://localhost:3001'])}`);
  logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start:', error);
  process.exit(1);
});
