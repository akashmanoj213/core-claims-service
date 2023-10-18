import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as lb from '@google-cloud/logging-bunyan';

async function bootstrap() {
  const { mw } = await lb.express.middleware();
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Claims APIs')
    .setDescription('APIs used for claim processing')
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
  app.use(mw);

  await app.listen(parseInt(process.env.PORT) || 8080);
}
bootstrap();
