import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsSettlementService } from './claims-settlement.service';

describe('ClaimsSettlementService', () => {
  let service: ClaimsSettlementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaimsSettlementService],
    }).compile();

    service = module.get<ClaimsSettlementService>(ClaimsSettlementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
