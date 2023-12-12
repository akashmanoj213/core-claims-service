import { Type } from 'class-transformer';
import { IsInt, IsDate, IsString, IsNumber, IsOptional } from 'class-validator';

export class TpaPolicyDetailsDto {
  @IsInt()
  policyId: number;
  @IsDate()
  @Type(() => Date)
  startDate: Date;
  @IsDate()
  @Type(() => Date)
  endDate: Date;
  @IsNumber()
  sumInsured: number;
  @IsString()
  policyBenefits: string;
  @IsNumber()
  policyDeductions: number;
  @IsNumber()
  @IsOptional()
  policyCapping: number;
  @IsInt()
  policyWaitingPeriod: number;
  @IsInt()
  totalNumberOfClaims: number;
}
