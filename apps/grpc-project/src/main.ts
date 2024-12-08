import { NestFactory } from '@nestjs/core';
import { GrpcProjectModule } from './grpc-project.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GRPC_PROJECT_PACKAGE_NAME } from '@app/common-library';
import { initializeOtelSdk } from './instrumentation';
import { WinstonLoggerService } from '@app/common-services';

async function bootstrap() {
  // const serviceName = 'grpc-project'; // or any other service name
  // const otelSdk = initializeOtelSdk(serviceName);
  // otelSdk.start();

  const app = await NestFactory.create(GrpcProjectModule);

  // Create a gRPC microservice
  const grpcApp = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      protoPath: join(__dirname, '../grpc-project.proto'),
      package: GRPC_PROJECT_PACKAGE_NAME,
      url: `0.0.0.0:${process.env.GRPC_PORT || 3000}`,
    },
  });
  app.useLogger(app.get(WinstonLoggerService));

  console.log('PORT : ', process.env.PORT);
  await app.startAllMicroservices();
  await app.listen(parseInt(process.env.PORT) || 8080);

  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(
  //   GrpcProjectModule,
  //   {
  //     transport: Transport.GRPC,
  //     options: {
  //       protoPath: join(__dirname, '../grpc-project.proto'),
  //       package: GRPC_PROJECT_PACKAGE_NAME,
  //     },
  //   },
  // );
  // const app2 = await NestFactory.create(GrpcProjectModule, {
  //   bufferLogs: true,
  // });

  // await app.listen();
  // await app2.listen(8080);
}

bootstrap().catch((err) => {
  console.error('Error starting the application', err);
  process.exit(1);
});
