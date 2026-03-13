import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable global validation using class-validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  
  // Enable CORS for frontend
  app.enableCors();
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
