import { Module } from '@nestjs/common';
import { ClaimsAdjudicationService } from './claims-adjudication.service';
import { ClaimsAdjudicationController } from './claims-adjudication.controller';
import { AdjudicationItem } from './entities/adjudication-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccidentDetails } from './entities/accident-details.entity';
import { MaternityDetails } from './entities/maternity-details.entity';
import { DoctorTreatmentDetails } from './entities/doctor-treatment-details.entity';
import { PastChronicIllness } from './entities/past-chronic-illness.entity';
import { PatientAdmissionDetails } from './entities/patient-admission-details.entity';
import { HospitalDetails } from './entities/hospital-details.entity';
import { MemberDetails } from './entities/member-details.entity';
import { PolicyDetails } from './entities/policy-details.entity';
import { NonMedicalAdjudicationResult } from './entities/non-medical-adjudication-result.entity';
import { VariationData } from './entities/variation-data.entity';
import { AdjudicationItemDocument } from './entities/adjudication-item-document.entity';
import { MedicalAdjudicationResult } from './entities/medical-adjudication-result.entity';
import { HttpModule } from '@nestjs/axios';
import { CommonServicesModule } from '@app/common-services';

@Module({
  imports: [
    CommonServicesModule,
    HttpModule,
    TypeOrmModule.forFeature(
      [
        AdjudicationItem,
        AccidentDetails,
        MaternityDetails,
        DoctorTreatmentDetails,
        PastChronicIllness,
        PatientAdmissionDetails,
        HospitalDetails,
        MemberDetails,
        PolicyDetails,
        NonMedicalAdjudicationResult,
        MedicalAdjudicationResult,
        VariationData,
        AdjudicationItemDocument,
        HttpModule,
      ],
      'claims-adjudication',
    ),
  ],
  controllers: [ClaimsAdjudicationController],
  providers: [ClaimsAdjudicationService],
})
export class ClaimsAdjudicationModule {}
