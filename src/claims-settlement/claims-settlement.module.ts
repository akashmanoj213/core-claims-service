import { Module } from '@nestjs/common';
import { ClaimsSettlementService } from './claims-settlement.service';
import { ClaimsSettlementController } from './claims-settlement.controller';
import { PubSubModule } from 'src/core/providers/pub-sub/pub-sub.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimSettlement } from './entities/claim-settlement.entity';
import { NotificationModule } from 'src/core/providers/notification/notification.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PubSubModule,
    TypeOrmModule.forFeature([ClaimSettlement], 'claims-settlement'),
    NotificationModule,
    HttpModule,
  ],
  controllers: [ClaimsSettlementController],
  providers: [ClaimsSettlementService],
})
export class ClaimsSettlementModule {}
