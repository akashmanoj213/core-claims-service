import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ClaimItemType, ClaimType } from '../enums';
import { DoctorTreatmentDetailsDto } from 'src/claims/dto/doctor-treatment-details.dto';
import { Type } from 'class-transformer';
import { PatientAdmissionDetailsDto } from 'src/claims/dto/patient-admission-details.dto';
import { AccidentDetailsDto } from 'src/claims/dto/accident-details.dto';
import { MaternityDetailsDto } from 'src/claims/dto/maternity-details.dto';

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
  filename: string;
  @IsString()
  fileUrl: string;
}

export class InitiatedClaimEventDto {
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
  @IsInt()
  tpaId: number;
  @IsBoolean()
  isAccident = false;
  @IsBoolean()
  isPregnancy = false;
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
  accidentDetails?: AccidentDetailsDto;
  @ValidateNested()
  @Type(() => MaternityDetailsDto)
  maternityDetails?: MaternityDetailsDto;

  constructor(init?: InitiatedClaimEventDto) {
    Object.assign(this, init);
  }
}
