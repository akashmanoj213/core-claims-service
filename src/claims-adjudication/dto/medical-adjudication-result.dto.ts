import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, ValidateNested } from 'class-validator';
import { VariationDataDto } from './variation-data.dto';
import { MedicalAdjudicationDecision } from '../entities/medical-adjudication-result.entity';

export class MedicalAdjudicationResultDto {
  @IsInt()
  claimItemId: number;
  @IsNumber()
  approvedPayableAmount: number;
  @IsNumber()
  coPayableAmount: number;
  @IsEnum(MedicalAdjudicationDecision)
  decision: MedicalAdjudicationDecision;
  @ValidateNested()
  @Type(() => VariationDataDto)
  variations: Array<VariationDataDto>;
}
