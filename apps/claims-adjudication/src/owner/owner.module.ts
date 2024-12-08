import { Module } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { OwnerController } from './owner.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { GRPC_PROJECT_PACKAGE_NAME } from '@app/common-library';
import { join } from 'path';
import { GRPC_SERVICE } from './constants';
import { CommonServicesModule } from '@app/common-services';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: GRPC_SERVICE,
        transport: Transport.GRPC,
        options: {
          url: 'dns:///sahi-grpc-project-453999121690.asia-south1.run.app:3000',
          package: GRPC_PROJECT_PACKAGE_NAME,
          protoPath: join(__dirname, '../grpc-project.proto'),
        },
      },
    ]),
    CommonServicesModule,
  ],
  controllers: [OwnerController],
  providers: [OwnerService],
})
export class OwnerModule {}
