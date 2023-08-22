import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsAdjudicationService } from './claims-adjudication.service';

describe('ClaimsAdjudicationService', () => {
  let service: ClaimsAdjudicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaimsAdjudicationService],
    }).compile();

    service = module.get<ClaimsAdjudicationService>(ClaimsAdjudicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
