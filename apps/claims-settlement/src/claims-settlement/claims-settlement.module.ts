import { Module } from '@nestjs/common';
import { ClaimsSettlementService } from './claims-settlement.service';
import { ClaimsSettlementController } from './claims-settlement.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimSettlement } from './entities/claim-settlement.entity';
import { HttpModule } from '@nestjs/axios';
import { CommonServicesModule } from '@app/common-services';

@Module({
  imports: [
    CommonServicesModule,
    TypeOrmModule.forFeature([ClaimSettlement], 'claims-settlement'),
    HttpModule,
  ],
  controllers: [ClaimsSettlementController],
  providers: [ClaimsSettlementService],
})
export class ClaimsSettlementModule {}
