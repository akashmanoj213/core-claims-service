import {
  IsEnum,
  IsInt,
  IsNotEmptyObject,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { AccidentDetailsDto } from './accident-details.dto';
import {
  DoctorDeclarationDto,
  HospitalDeclarationDto,
  PatientDeclarationDto,
} from './declarations.dto';
import { DoctorTreatmentDetailsDto } from './doctor-treatment-details.dto';
import { HospitalDetailsDto } from './hospital-details.dto';
import { MaternityDetailsDto } from './maternity-details.dto';
import { PatientAdmissionDetailsDto } from './patient-admission-details.dto';
import { Type } from 'class-transformer';
import { PolicyDetailsDto } from './policy-details.dto';
import { MemberDetailsDto } from './member-details.dto';
import { ClaimType } from 'src/core/enums';

export class CreateClaimDto {
  // preClaimRequestId: number;
  @IsInt()
  tpaId: number; // will be calculated based on the patient
  @IsInt()
  policyNumber: number;
  @IsInt()
  insuranceCardNumber: number; // might be generated at the time of issuance
  @IsInt()
  hospitalId: number;
  // claimStatus: ClaimStatus;
  @IsEnum(ClaimType)
  claimType: ClaimType;
  @IsNumber()
  totalClaimAmount: number;
  @ValidateNested()
  @Type(() => PolicyDetailsDto)
  @IsNotEmptyObject()
  policyDetails: PolicyDetailsDto;
  @ValidateNested()
  @Type(() => MemberDetailsDto)
  @IsNotEmptyObject()
  memberDetails: MemberDetailsDto;
  @ValidateNested()
  @Type(() => HospitalDetailsDto)
  @IsNotEmptyObject()
  hospitalDetails: HospitalDetailsDto; // Check if hospital is in Network hospitals
  @ValidateNested()
  @Type(() => DoctorTreatmentDetailsDto)
  @IsNotEmptyObject()
  doctorTreatmentDetails: DoctorTreatmentDetailsDto;
  @ValidateNested()
  @Type(() => PatientAdmissionDetailsDto)
  @IsNotEmptyObject()
  patientAdmissionDetails: PatientAdmissionDetailsDto;
  @ValidateNested()
  @Type(() => PatientDeclarationDto)
  @IsNotEmptyObject()
  patientDeclaration: PatientDeclarationDto; // Check if names in declaration are same as the patient details
  @ValidateNested()
  @Type(() => DoctorDeclarationDto)
  @IsNotEmptyObject()
  doctorDeclaration: DoctorDeclarationDto; //  Check if names in declaration are same as the doctor details
  @ValidateNested()
  @Type(() => HospitalDeclarationDto)
  @IsNotEmptyObject()
  hospitalDeclaration: HospitalDeclarationDto;
  @ValidateNested()
  @Type(() => MaternityDetailsDto)
  maternityDetails?: MaternityDetailsDto; // Check if insurance covers Maternity ?
  @ValidateNested()
  @Type(() => AccidentDetailsDto)
  accidentDetails?: AccidentDetailsDto;
}

// export enum ClaimStatus {
//   INITIATED = 'initiated',
//   UNDER_REVIEW = 'under review',
//   REVIEW_COMPLETED = 'review completed',
//   PAYOUT_INITIATED = 'payout initiated',
//   PAYOUT_COMPLETED = 'payout completed',
//   COMPLETED = 'completed',
// } // add Initial , error . Payment pending,
// // potential FWA - will be determined by a ML model (Might be driven by rules engine)
