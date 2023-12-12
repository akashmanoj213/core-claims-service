import { IsEnum, IsInt, IsNumber, IsString } from 'class-validator';
import { MedicalAdjudicationDecision } from '../entities/medical-adjudication-result.entity';

export class MedicalAdjudicationResultDto {
  @IsInt()
  claimItemId: number;
  @IsNumber()
  approvedPayableAmount: number;
  @IsNumber()
  coPayableAmount: number;
  @IsString()
  overallComment: string;
  @IsEnum(MedicalAdjudicationDecision)
  decision: MedicalAdjudicationDecision;
  // @ValidateNested()
  // @Type(() => VariationDataDto)
  // variations: Array<VariationDataDto>;
}
