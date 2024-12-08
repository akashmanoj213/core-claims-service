import { Module } from '@nestjs/common';
import { GrpcProjectController } from './grpc-project.controller';
import { GrpcProjectService } from './grpc-project.service';
import { OwnerModule } from './owner/owner.module';
import { CommonServicesModule } from '@app/common-services';

@Module({
  imports: [OwnerModule, CommonServicesModule],
  controllers: [GrpcProjectController],
  providers: [GrpcProjectService],
})
export class GrpcProjectModule {}
