import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsMobilePhone,
  IsString,
} from 'class-validator';

export class DoctorDeclarationDto {
  @IsString()
  treatingDoctorName: string;
  @IsString()
  qualification: string;
  @IsString()
  registrationNumberWithStateCode: string;
  @IsDate()
  @Type(() => Date)
  declarationDateTime: Date;
  @IsBoolean()
  isSigned: boolean;
}

export class PatientDeclarationDto {
  @IsString()
  patientName: string;
  @IsMobilePhone('en-IN')
  contactNumber: string;
  @IsEmail()
  emailId: string;
  @IsDate()
  @Type(() => Date)
  declarationDateTime: Date;
  @IsBoolean()
  isSigned: boolean;
}

export class HospitalDeclarationDto {
  @IsDate()
  @Type(() => Date)
  declarationDateTime: Date;
  @IsBoolean()
  isSigned: boolean;
}
