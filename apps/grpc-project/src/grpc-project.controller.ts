import { Controller, Get } from '@nestjs/common';
import { GrpcProjectService } from './grpc-project.service';

@Controller()
export class GrpcProjectController {
  constructor(private readonly grpcProjectService: GrpcProjectService) {}

  @Get()
  getHello(): string {
    return this.grpcProjectService.getHello();
  }
}
