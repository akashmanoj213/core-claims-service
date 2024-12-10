import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { initializeOtelSdk } from './instrumentation';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const serviceName = 'claims-adjudication'; // or any other service name
  const otelSdk = initializeOtelSdk(serviceName);
  otelSdk.start();

  // const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // app.useLogger(app.get(Logger));

  const instance = winston.createLogger({
    transports: new winston.transports.Console(),
  });

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance,
    }),
  });

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
