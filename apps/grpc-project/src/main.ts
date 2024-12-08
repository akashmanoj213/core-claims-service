import { NestFactory } from '@nestjs/core';
import { GrpcProjectModule } from './grpc-project.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GRPC_PROJECT_PACKAGE_NAME } from '@app/common-library';
import { initializeOtelSdk } from './instrumentation';
import { WinstonLoggerService } from '@app/common-services';

async function bootstrap() {
  const serviceName = 'grpc-project'; // or any other service name
  const otelSdk = initializeOtelSdk(serviceName);
  otelSdk.start();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GrpcProjectModule,
    {
      transport: Transport.GRPC,
      options: {
        protoPath: join(__dirname, '../grpc-project.proto'),
        package: GRPC_PROJECT_PACKAGE_NAME,
      },
    },
  );

  app.useLogger(app.get(WinstonLoggerService));
  await app.listen();
}
bootstrap();
