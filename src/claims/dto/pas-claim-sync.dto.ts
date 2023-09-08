import { IsInt } from 'class-validator';

export class PasClaimSyncDto {
  @IsInt()
  claimId: number;

  constructor(claimId) {
    this.claimId = claimId;
  }
}
