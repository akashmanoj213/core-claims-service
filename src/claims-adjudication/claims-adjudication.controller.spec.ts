import { Test, TestingModule } from '@nestjs/testing';
import { ClaimsAdjudicationController } from './claims-adjudication.controller';
import { ClaimsAdjudicationService } from './claims-adjudication.service';

describe('ClaimsAdjudicationController', () => {
  let controller: ClaimsAdjudicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimsAdjudicationController],
      providers: [ClaimsAdjudicationService],
    }).compile();

    controller = module.get<ClaimsAdjudicationController>(ClaimsAdjudicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
