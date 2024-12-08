import { Module } from '@nestjs/common';
import { GrpcProjectController } from './grpc-project.controller';
import { GrpcProjectService } from './grpc-project.service';
import { OwnerModule } from './owner/owner.module';
import { CommonServicesModule } from '@app/common-services';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: 'apps/grpc-project/.env' }),
    OwnerModule,
    CommonServicesModule,
  ],
  controllers: [GrpcProjectController],
  providers: [GrpcProjectService],
})
export class GrpcProjectModule {}
