import { initializeOtelSdk } from './open-telemetry-sdk';
initializeOtelSdk('claims-settlement');

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = new DocumentBuilder()
    .setTitle('Claims Settlement APIs')
    .setDescription('APIs used for claim settlement process.')
    .setVersion('1.0')
    .addTag('claims-settlement')
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
