import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WinstonLoggerService } from '@app/common-services';
import { initializeOtelSdk } from './instrumentation';

async function bootstrap() {
  const serviceName = 'claims-adjudication'; // or any other service name
  const otelSdk = initializeOtelSdk(serviceName);
  otelSdk.start();

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WinstonLoggerService));

  const config = new DocumentBuilder()
    .setTitle('Claims Adjudication APIs')
    .setDescription('APIs used for claim adjudication process.')
    .setVersion('1.0')
    .addTag('claims-adjudication')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  app.enableCors();

  console.log('PORT:', process.env.PORT);
  await app.listen(parseInt(process.env.PORT) || 8080);
}
bootstrap();
