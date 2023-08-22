import { Type } from 'class-transformer';
import { IsEnum, IsInt } from 'class-validator';
import { AdjudicationItemStatus } from 'src/claims-adjudication/entities/adjudication-item.entity';

export class MedicalAdjEventDto {
  @IsInt()
  claimItemId: number;
  @Type(() => Number)
  approvedPayableAmount: number;
  @Type(() => Number)
  coPayableAmount: number;
  @IsEnum(AdjudicationItemStatus)
  status: AdjudicationItemStatus;

  constructor(init?: MedicalAdjEventDto) {
    Object.assign(this, init);
  }
}
