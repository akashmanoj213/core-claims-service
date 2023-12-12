import { IsInt } from 'class-validator';

export class PasClaimSyncEventDto {
  @IsInt()
  claimId: number;

  constructor(claimId) {
    this.claimId = claimId;
  }
}
