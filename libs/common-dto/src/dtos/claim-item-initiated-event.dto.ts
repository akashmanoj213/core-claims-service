import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ClaimItemType, ClaimType } from '../enums';
import { Type } from 'class-transformer';
import { AccidentDetailsDto } from 'apps/core-claims-service/src/claims/dto/accident-details.dto';
import { DoctorTreatmentDetailsDto } from 'apps/core-claims-service/src/claims/dto/doctor-treatment-details.dto';
import { MaternityDetailsDto } from 'apps/core-claims-service/src/claims/dto/maternity-details.dto';
import { PatientAdmissionDetailsDto } from 'apps/core-claims-service/src/claims/dto/patient-admission-details.dto';
import { PolicyDetails } from 'apps/core-claims-service/src/claims/entities/policy-details.entity';
import { MemberDetails } from 'apps/core-claims-service/src/claims/entities/member-details.entity';
import { HospitalDetails } from 'apps/core-claims-service/src/claims/entities/hospital-details.entity';

// export enum ClaimItemStatus {
//   INITIATED = 'initiated',
//   NON_MEDICAL_FWA_COMPLETED = 'non-medical FWA completed',
//   NON_MEDICAL_REVIEW_COMPLETED = 'non-medical review completed',
//   MEDICAL_FWA_COMPLETED = 'medical FWA completed',
//   APPROVED = 'approved',
//   REJECTED = 'rejected',
//   QUERY = 'query',
//   INTERVENTION = 'intervention',
// }

export class ClaimItemDocumentDto {
  @IsString()
  fileUrl: string;
  @IsString()
  fileName: string;
  @IsString()
  fieldName: string;
}

export class ClaimItemInitiatedEventDto {
  @IsInt()
  claimId: number;
  @IsInt()
  policyNumber: number;
  @IsInt()
  insuranceCardNumber: number;
  @IsInt()
  hospitalId: number;
  @IsEnum(ClaimType)
  claimType: ClaimType;
  @IsNumber()
  @Type(() => Number) // TO-DO figure out using build in transformer
  totalClaimAmount: number;
  @IsNumber()
  @Type(() => Number)
  approvedPayableAmount: number;
  @IsNumber()
  @Type(() => Number)
  coPayableAmount: number;
  @IsInt()
  tpaId: number;
  @IsBoolean()
  isAccident = false;
  @IsBoolean()
  isPregnancy = false;
  @IsBoolean()
  isInstantCashless = false;
  @IsInt()
  claimItemId: number;
  @IsEnum(ClaimItemType)
  claimItemType: ClaimItemType;
  @IsNumber()
  @Type(() => Number)
  claimItemTotalAmount: number;
  // @IsEnum(ClaimItemStatus)
  // claimItemStatus: ClaimItemStatus; // assuming that this dto will be used only for initiated claims (ready for non-medical FWA check step, this will not be required)
  @ValidateNested()
  @Type(() => DoctorTreatmentDetailsDto)
  doctorTreatmentDetails: DoctorTreatmentDetailsDto;
  @ValidateNested()
  @Type(() => PatientAdmissionDetailsDto)
  patientAdmissionDetails: PatientAdmissionDetailsDto;
  @ValidateNested()
  @Type(() => ClaimItemDocumentDto)
  documents: Array<ClaimItemDocumentDto>;
  @ValidateNested()
  @Type(() => AccidentDetailsDto)
  // @IsOptional()
  accidentDetails?: AccidentDetailsDto;
  @ValidateNested()
  @Type(() => MaternityDetailsDto)
  // @IsOptional()
  maternityDetails?: MaternityDetailsDto;
  @ValidateNested()
  @Type(() => PolicyDetails)
  policyDetails: PolicyDetails;
  @ValidateNested()
  @Type(() => MemberDetails)
  memberDetails: MemberDetails;
  @ValidateNested()
  @Type(() => HospitalDetails)
  hospitalDetails: HospitalDetails;

  constructor(init?: ClaimItemInitiatedEventDto) {
    Object.assign(this, init);
  }
}
