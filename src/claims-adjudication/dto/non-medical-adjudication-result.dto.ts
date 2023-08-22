import { Type } from 'class-transformer';
import { IsInt, IsString, ValidateNested } from 'class-validator';
import { VariationDataDto } from './variation-data.dto';

export class NonMedicalAdjudicationResultDto {
  @IsInt()
  claimItemId: number;
  @IsString()
  overallComment: string;
  @ValidateNested()
  @Type(() => VariationDataDto)
  variations: Array<VariationDataDto>;
}
