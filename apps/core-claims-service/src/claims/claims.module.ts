import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { Claim } from './entities/claim.entity';
import { TpaPolicyDetails } from './entities/tpa-policy-details.entity';
import { TpaMemberDetails } from './entities/tpa-member-details.entity';
import { TpaHospitalDetails } from './entities/tpa-hospital-details.entity';
import { DoctorTreatmentDetails } from './entities/doctor-treatment-details.entity';
import { PatientAdmissionDetails } from './entities/patient-admission-details.entity';
import { PastChronicIllness } from './entities/past-chronic-illness.entity';
import { PatientDeclaration } from './entities/patient-declaration.entity';
import { DoctorDeclaration } from './entities/doctor-declaration.entity';
import { HospitalDeclaration } from './entities/hospital-declaration.entity';
import { MaternityDetails } from './entities/maternity-details.entity';
import { AccidentDetails } from './entities/accident-details.entity';
import { ClaimItem } from './entities/claim-item.entity';
import { ClaimItemDocument } from './entities/claim-item-document.entity';
import { HttpModule } from '@nestjs/axios';
import { VariationData } from './entities/variation-data-entity';
import { PolicyDetails } from './entities/policy-details.entity';
import { HospitalDetails } from './entities/hospital-details.entity';
import { MemberDetails } from './entities/member-details.entity';
import { EventStore } from './entities/event-store.entity';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateClaimCommandHandler } from './command-handlers/create-claim.handler';
import { CommonServicesModule } from '@app/common-services';
import { ICD10Level1 } from './entities/icd-10-level1.entity';
import { ICD10Level2 } from './entities/icd-10-level2.entity';
import { ICD10Level3 } from './entities/icd-10-level3.entity';
import { MedicalBillDetails } from './entities/medical-bill-details.entity';
import { MedicalBillLineItem } from './entities/medical-bill-line-item.entity';

export const CommandHandlers = [CreateClaimCommandHandler];

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Claim,
      TpaPolicyDetails,
      TpaMemberDetails,
      TpaHospitalDetails,
      DoctorTreatmentDetails,
      PatientAdmissionDetails,
      PastChronicIllness,
      PatientDeclaration,
      DoctorDeclaration,
      HospitalDeclaration,
      MaternityDetails,
      AccidentDetails,
      ClaimItem,
      ClaimItemDocument,
      VariationData,
      PolicyDetails,
      HospitalDetails,
      MemberDetails,
      EventStore,
      ICD10Level1,
      ICD10Level2,
      ICD10Level3,
      MedicalBillDetails,
      MedicalBillLineItem,
    ]),
    HttpModule,
    CqrsModule,
    CommonServicesModule,
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService, ...CommandHandlers],
})
export class ClaimsModule {}
