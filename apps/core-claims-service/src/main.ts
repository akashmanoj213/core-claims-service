import { initializeOtelSdk } from './open-telemetry-sdk';
initializeOtelSdk('core-claims-service');

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonLoggerService } from '@app/winston-logger';
import { GoogleCloudLoggingMiddleware } from './winston-logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WinstonLoggerService));

  const config = new DocumentBuilder()
    .setTitle('Core Claims APIs')
    .setDescription('APIs used for core claim processing')
    .setVersion('1.0')
    .addTag('claims')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.enableCors();

  await app.listen(parseInt(process.env.PORT) || 8080);
}
bootstrap();
