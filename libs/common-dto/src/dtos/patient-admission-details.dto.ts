import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsMobilePhone,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PastChronicIllnessDto {
  @IsString()
  illnessName: string;
  @IsDate()
  @Type(() => Date)
  illnessStartDate: Date;
}

export enum RoomType {
  AC = 'AC',
  NONAC = 'Non-AC',
}

export class PatientAdmissionDetailsDto {
  @IsString()
  patientFullName: string;
  @IsString()
  patientGender: string;
  @IsDate()
  @Type(() => Date)
  patientDob: Date;
  @IsDate()
  @Type(() => Date)
  dateAndTimeOfAdmission: Date;
  @IsMobilePhone('en-IN')
  contactNumber: string;
  @IsMobilePhone('en-IN')
  @IsOptional()
  alternateContactNumber?: string;
  @IsBoolean()
  isEmergencyHospitalisation: boolean;
  @IsBoolean()
  isPlannedHospitalisation: boolean;
  @IsInt()
  expectedNumberOfDaysStay: number; // is this part of hospital data
  @IsInt()
  expectedDaysInICU: number; // is this part of hosptial data
  @IsEnum(RoomType)
  roomType: RoomType; // is this part of hospital data
  @IsNumber()
  roomNursingPatientDietCharges: number; // is this part of hospital data ? HOW DO WE CALCULATE FOR COMBINED FIELDS LIKE THIS ?
  @IsNumber()
  expectedInvestigationDiagnosticsCost: number; // is this part of hospital data
  @IsNumber()
  @IsOptional()
  ICUCharges?: number; // is this part of hospital data and is it disease related or standard pricing ?
  @IsNumber()
  @IsOptional()
  OTCharges?: number; // is this part of hospital data and is it disease related or standard pricing ?
  @IsNumber()
  professionalAnestheticFeesCosultationCharges: number; // is this part of hospital data and is it disease related or standard pricing ?
  @IsNumber()
  medicineConsumableImplantCharges: number; // is this part of hospital data and is it disease related or standard pricing ?
  @IsNumber()
  otherHospitalExpenses: number; // is this part of hospital data
  @IsNumber()
  allInclusivePackageCharges: number; // is this part of hospital data? IF THIS IS PART OF A PACKAGE THEN ARE THERE STILL INDIVIDUAL CHARGES ALLOTED ?
  @IsNumber()
  sumTotalExpectedHospitalisationCost: number; // is this part of hospital data? IF PACKAGE THEN WILL THIS BE SAME AS PACKAGE ?
  @ValidateNested()
  @Type(() => PastChronicIllnessDto)
  pastHistoryOfChronicIllness: Array<PastChronicIllnessDto>;
}
