import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.FRONTEND_URL,
    ].filter((url): url is string => Boolean(url)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const logger = app.get(LoggerService);
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(
    `Application is running on: http://localhost:${port}/api`,
    'Bootstrap',
  );

  // Gracefully handle MongoDB connection errors so they don't crash the server
  const conn = mongoose.connection;
  conn.on('error', (err) => {
    console.warn(`[Mongoose] MongoDB connection error (non-fatal): ${err.message}`);
  });
}

// Prevent unhandled promise rejections (e.g. from MongoDB) from crashing the process
process.on('unhandledRejection', (reason: any) => {
  const msg = reason?.message || String(reason);
  if (msg.includes('ECONNREFUSED') && msg.includes('27017')) {
    console.warn('[MongoDB] Connection refused — MongoDB is not running. Chat features will be unavailable.');
    return; // suppress this specific crash
  }
  console.error('[UnhandledRejection]', reason);
});

bootstrap();