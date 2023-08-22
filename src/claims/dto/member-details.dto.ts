import {
  IsEmail,
  IsInt,
  IsMobilePhone,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class MemberDetailsDto {
  @IsInt()
  memberId: number;
  @IsInt()
  policyId: number;
  @IsNumber()
  sumInsured: number;
  @IsMobilePhone('en-IN')
  contactNumber: string;
  @IsEmail()
  email: string;
  @IsString()
  communicationPreference: string;
  @IsString()
  exclusions: string;
  @IsString()
  memberBenefits: string;
  @IsNumber()
  memberDeductions: number;
  @IsNumber()
  @IsOptional()
  memberCapping: number;
  @IsInt()
  memberWaitingPeriod: number;
  @IsNumber()
  numberOfClaims: number;
}
