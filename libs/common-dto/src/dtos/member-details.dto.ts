import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInt,
  IsMobilePhone,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export class MemberDetailsDto {
  @IsInt()
  id?: number;
  @IsNumber()
  sumInsured: number;
  @IsMobilePhone('en-IN')
  contactNumber: string;
  @IsString()
  fullName: string;
  @IsEnum(Gender)
  gender: Gender;
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
  @IsInt()
  numberOfClaims: number;
  @IsBoolean()
  isInstantCashless: boolean;
  @IsDate()
  @Type(() => Date)
  startDate: Date;
  @IsDate()
  @Type(() => Date)
  endDate: Date;
}
