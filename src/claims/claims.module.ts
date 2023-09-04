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
import { PubSubModule } from 'src/core/providers/pub-sub/pub-sub.module';
import { FileUploadModule } from 'src/core/providers/file-upload/file-upload.module';
import { ClaimItemDocument } from './entities/claim-item-document.entity';
import { HttpModule } from '@nestjs/axios';
import { VariationData } from './entities/variation-data-entity';
import { PolicyDetails } from './entities/policy-details.entity';
import { HospitalDetails } from './entities/hospital-details.entity';
import { MemberDetails } from './entities/member-details.entity';
import { NotificationModule } from 'src/core/providers/notification/notification.module';

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
    ]),
    PubSubModule,
    FileUploadModule,
    HttpModule,
    NotificationModule,
  ],
  controllers: [ClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule {}