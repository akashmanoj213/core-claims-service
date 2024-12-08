import { Test, TestingModule } from '@nestjs/testing';
import { GrpcProjectController } from './grpc-project.controller';
import { GrpcProjectService } from './grpc-project.service';

describe('GrpcProjectController', () => {
  let grpcProjectController: GrpcProjectController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [GrpcProjectController],
      providers: [GrpcProjectService],
    }).compile();

    grpcProjectController = app.get<GrpcProjectController>(GrpcProjectController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(grpcProjectController.getHello()).toBe('Hello World!');
    });
  });
});
