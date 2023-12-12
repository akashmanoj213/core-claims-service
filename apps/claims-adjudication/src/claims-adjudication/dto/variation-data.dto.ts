import { IsString } from 'class-validator';

export class VariationDataDto {
  @IsString()
  fieldName: string;
  @IsString()
  comment: string;
}
