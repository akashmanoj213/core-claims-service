import { Type } from 'class-transformer';
import { IsEnum, IsInt } from 'class-validator';
import { AdjudicationItemStatus } from 'src/claims-adjudication/entities/adjudication-item.entity';

export class MedicalAdjCompletedEventDto {
  @IsInt()
  claimId: number;
  @IsInt()
  claimItemId: number;
  @Type(() => Number)
  approvedPayableAmount: number;
  @Type(() => Number)
  coPayableAmount: number;
  @IsEnum(AdjudicationItemStatus)
  status: AdjudicationItemStatus;

  constructor(init?: MedicalAdjCompletedEventDto) {
    Object.assign(this, init);
  }
}
