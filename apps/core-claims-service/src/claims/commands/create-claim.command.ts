import { Claim } from '../entities/claim.entity';

export class CreateClaimCommand {
  constructor(public readonly claim: Claim) {}
}
