import { Type } from 'class-transformer';
import {
  IsInt,
  IsDate,
  IsNumber,
  IsString,
  IsOptional,
  IsMobilePhone,
} from 'class-validator';

export class PolicyDetailsDto {
  @IsInt()
  id?: number;
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
  @IsMobilePhone('en-IN')
  caretakerContactNumber: string;
  // @ValidateNested()
  // @Type(() => MemberDetailsDto)
  // members: MemberDetailsDto[];
}
