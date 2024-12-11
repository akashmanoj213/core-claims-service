import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsMobilePhone,
  IsOptional,
  IsString,
} from 'class-validator';

export enum LineOfTreatment {
  MEDICAL_MANAGEMENT = 'Medical Management',
  SURGICAL_MANAGEMENT = 'Surgical Management',
  INTENSIVE_CARE = 'Intensive Care',
  INVESTIGATION = 'Investigation',
  NONALLOPATHICTREATMENT = 'Non-Allopathic treatment',
}

export class DoctorTreatmentDetailsDto {
  @IsString()
  doctorName: string;
  @IsMobilePhone('en-IN')
  doctorContactNumber: string;
  @IsString()
  diseaseName: string; // CHECK WITH DISEASE OR ICD CODE ?
  @IsString()
  clinicalFindings: string;
  @IsInt()
  ailmentDuration: number;
  @IsDate()
  @Type(() => Date)
  dateOfFirstConsult: Date;
  @IsString()
  pastHistoryOfAilment: string;
  @IsString()
  provisionalDiagnosis: string;
  @IsString()
  ICD11Code: string; // Check if ICD code is within insurance coverage
  @IsEnum(LineOfTreatment)
  proposedLineOfTreatment: LineOfTreatment;
  @IsString()
  investigationOrMedicalDetails: string;
  @IsString()
  routeOfDrugAdministration: string;
  @IsString()
  @IsOptional()
  nameOfSurgery?: string;
  @IsString()
  @IsOptional()
  surgeryICD11Code?: string; // ANYTHING TO CROSS CHECK HERE ?
  @IsString()
  @IsOptional()
  otherTreatmentDetails?: string;
  @IsString()
  @IsOptional()
  injuryReason?: string;
}
