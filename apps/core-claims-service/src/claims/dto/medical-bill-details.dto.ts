import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ICD10LineItemDto {
  @IsString()
  code: string;
  @IsString()
  name: string;
}

export class LineItemDto {
  @ValidateNested()
  @Type(() => ICD10LineItemDto)
  icd10Level1: ICD10LineItemDto;
  @ValidateNested()
  @Type(() => ICD10LineItemDto)
  icd10Level2: ICD10LineItemDto;
  @ValidateNested()
  @Type(() => ICD10LineItemDto)
  icd10Level3: ICD10LineItemDto;
  @IsNumber()
  rate: number;
  @IsNumber()
  unit: number;
  @IsNumber()
  amount: number;
}

export class MedicalBillDetailsDto {
  @IsInt()
  billNumber: number;
  @IsDate()
  @Type(() => Date)
  billDate: Date;
  @IsNumber()
  totalAmount: number;
  @ValidateNested()
  @Type(() => LineItemDto)
  lineItems: Array<LineItemDto>;
}
