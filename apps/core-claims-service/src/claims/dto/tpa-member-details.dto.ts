import { Type } from 'class-transformer';
import {
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

export class TpaMemberDetailsDto {
  @IsInt()
  memberId: number;
  @IsNumber()
  sumInsured: number;
  @IsMobilePhone('en-IN')
  contactNumber: string;
  @IsString()
  fullName: string;
  @IsEnum(Gender)
  gender: Gender;
  @IsDate()
  @Type(() => Date)
  startDate: Date;
  @IsDate()
  @Type(() => Date)
  endDate: Date;
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
}
