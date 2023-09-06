import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsSettlementController } from './claims-settlement.controller';
import { ClaimsSettlementService } from './claims-settlement.service';

describe('ClaimsSettlementController', () => {
  let controller: ClaimsSettlementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimsSettlementController],
      providers: [ClaimsSettlementService],
    }).compile();

    controller = module.get<ClaimsSettlementController>(ClaimsSettlementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
