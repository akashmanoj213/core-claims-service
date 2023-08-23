import { Type } from 'class-transformer';
import {
  IsInt,
  IsDate,
  IsNumber,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { MemberDetailsDto } from './member-details.dto';

export class PolicyDetailsDto {
  @IsInt()
  id: number;
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
  @ValidateNested()
  @Type(() => MemberDetailsDto)
  members: MemberDetailsDto[];
}
