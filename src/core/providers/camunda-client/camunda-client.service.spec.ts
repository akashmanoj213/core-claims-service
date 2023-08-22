import { Test, TestingModule } from '@nestjs/testing';
import { CamundaClientService } from './camunda-client.service';

describe('CamundaClientService', () => {
  let service: CamundaClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CamundaClientService],
    }).compile();

    service = module.get<CamundaClientService>(CamundaClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
