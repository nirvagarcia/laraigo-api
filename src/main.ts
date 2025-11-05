import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { OptimizedValidationPipe } from './pipes/optimized-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerService);
  
  app.useGlobalPipes(new OptimizedValidationPipe());
  
  app.useGlobalFilters(new GlobalExceptionFilter(logger));
  
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
