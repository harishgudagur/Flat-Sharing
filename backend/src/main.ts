import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security Headers (Checklist #15)
  app.use(helmet());

  // CORS Configuration (Checklist #15)
  const isDev = configService.get<string>('NODE_ENV') !== 'production';
  const frontendUrl = configService.getOrThrow<string>('FRONTEND_URL');
  const adminUrl = configService.getOrThrow<string>('ADMIN_URL');
  
  app.enableCors({
    origin: isDev
      ? (origin, callback) => {
          // Allow all localhost/127.0.0.1 ports in development (for Flutter Web, mobile emulators, Next.js)
          if (
            !origin ||
            /^http:\/\/localhost(:\d+)?$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
          ) {
            callback(null, true);
          } else {
            callback(new Error('Blocked by CORS'));
          }
        }
      : [frontendUrl, adminUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global API Prefix
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global Validation Pipe (Checklist #6, #13)
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

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
