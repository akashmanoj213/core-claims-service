import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsString } from 'class-validator';
import { AdjudicationItemStatus } from '../enums';

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
  @IsString()
  overallComment: string;

  constructor(init?: MedicalAdjCompletedEventDto) {
    Object.assign(this, init);
  }
}
