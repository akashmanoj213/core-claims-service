import { IsInt } from 'class-validator';

export class PasClaimSettlementSyncDto {
  @IsInt()
  claimSettlementId: number;

  constructor(claimSettlementId) {
    this.claimSettlementId = claimSettlementId;
  }
}
