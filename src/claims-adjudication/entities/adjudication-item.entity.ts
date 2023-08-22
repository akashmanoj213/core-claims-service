import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { MemberDetails } from './member-details.entity';
import { PolicyDetails } from './policy-details.entity';
import { ClaimItemType, ClaimType } from 'src/core/enums';
import { HospitalDetails } from './hospital-details.entity';
import { DoctorTreatmentDetails } from './doctor-treatment-details.entity';
import { MaternityDetails } from './maternity-details.entity';
import { AccidentDetails } from './accident-details.entity';
import { PatientAdmissionDetails } from './patient-admission-details.entity';
import { NonMedicalAdjudicationResult } from './non-medical-adjudication-result.entity';
import { AdjudicationItemDocument } from './adjudication-item-document.entity';
import {
  MedicalAdjudicationDecision,
  MedicalAdjudicationResult,
} from './medical-adjudication-result.entity';

export enum AdjudicationItemStatus {
  NON_MEDICAL_FWA_COMPLETED = 'non-medical FWA completed',
  NON_MEDICAL_FWA_FAILED = 'non-medical FWA failed',
  NON_MEDICAL_REVIEW_COMPLETED = 'non-medical review completed',
  MEDICAL_FWA_COMPLETED = 'medical FWA completed',
  MEDICAL_FWA_FAILED = 'medical FWA failed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  QUERY = 'query',
  INTERVENTION = 'intervention',
}

@Entity()
export class AdjudicationItem {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  claimId: number;
  @Column()
  policyNumber: number;
  @Column()
  insuranceCardNumber: number;
  @Column()
  hospitalId: number;
  @Column({
    type: 'enum',
    enum: ClaimType,
  })
  claimType: ClaimType;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalClaimAmount: number;
  @Column()
  tpaId: number;
  @Column({
    type: 'boolean',
    default: false,
  })
  isAccident = false;
  @Column({
    type: 'boolean',
    default: false,
  })
  isPregnancy = false;
  @Column({
    unique: true,
  })
  claimItemId: number;
  @Column({
    type: 'enum',
    enum: ClaimItemType,
    default: ClaimItemType.INTIAL,
  })
  claimItemType: ClaimItemType;
  @Column({
    type: 'enum',
    enum: AdjudicationItemStatus,
  })
  status: AdjudicationItemStatus;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  claimItemTotalAmount: number;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  approvedPayableAmount = 0.0;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  coPayableAmount = 0.0;
  @Column({
    nullable: true,
  })
  nonMedicalFWAResult: string;
  @Column({
    nullable: true,
  })
  nonMedicalFWAReason: string;
  @Column({
    nullable: true,
  })
  medicalFWAResult: string;
  @Column({
    nullable: true,
  })
  medicalFWAReason: string;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(
    () => DoctorTreatmentDetails,
    (doctorTreatmentDetails) => doctorTreatmentDetails.adjudicationItems,
    { cascade: true },
  )
  doctorTreatmentDetails: DoctorTreatmentDetails;
  @ManyToOne(
    () => PatientAdmissionDetails,
    (patientAdmissionDetails) => patientAdmissionDetails.adjudicationItems,
    { cascade: true },
  )
  patientAdmissionDetails: PatientAdmissionDetails;
  @ManyToOne(
    () => AccidentDetails,
    (accidentDetails) => accidentDetails.adjudicationItems,
    { cascade: true },
  )
  accidentDetails: AccidentDetails;
  @ManyToOne(
    () => MaternityDetails,
    (maternityDetails) => maternityDetails.adjudicationItems,
    { cascade: true },
  )
  maternityDetails: MaternityDetails;
  @ManyToOne(
    () => MemberDetails,
    (memberDetails) => memberDetails.adjudicationItems,
    { cascade: true },
  )
  memberDetails: MemberDetails;
  @ManyToOne(
    () => PolicyDetails,
    (policyDetails) => policyDetails.adjudicationItems,
    { cascade: true },
  )
  policyDetails: PolicyDetails;
  @ManyToOne(
    () => HospitalDetails,
    (hospitalDetails) => hospitalDetails.adjudicationItems,
    { cascade: true },
  )
  hospitalDetails: HospitalDetails;
  @OneToOne(
    () => NonMedicalAdjudicationResult,
    (nonMedicalAdjudicationResult) =>
      nonMedicalAdjudicationResult.adjudicationItem,
    { cascade: true },
  )
  @JoinColumn()
  nonMedicalAdjudicationResult: NonMedicalAdjudicationResult;
  @OneToOne(
    () => MedicalAdjudicationResult,
    (medicalAdjudicationResult) => medicalAdjudicationResult.adjudicationItem,
    { cascade: true },
  )
  @JoinColumn()
  medicalAdjudicationResult: MedicalAdjudicationResult;
  @OneToMany(
    () => AdjudicationItemDocument,
    (AdjudicationItemDocument) => AdjudicationItemDocument.adjudicationItem,
    { cascade: true },
  )
  documents?: AdjudicationItemDocument[];

  addNonMedicalFWAResult(fwaResult: string, fwaReason: string) {
    this.nonMedicalFWAResult = fwaResult;
    this.nonMedicalFWAReason = fwaReason;
    this.status = AdjudicationItemStatus.NON_MEDICAL_FWA_COMPLETED;
  }

  addMedicalFWAResult(fwaResult: string, fwaReason: string) {
    this.medicalFWAResult = fwaResult;
    this.medicalFWAReason = fwaReason;
    this.status = AdjudicationItemStatus.MEDICAL_FWA_COMPLETED;
  }

  addNonMedicalAdjudicationResult(
    adjudicationResult: NonMedicalAdjudicationResult,
  ) {
    this.nonMedicalAdjudicationResult = adjudicationResult;
    this.status = AdjudicationItemStatus.NON_MEDICAL_REVIEW_COMPLETED;
  }

  addMedicalAdjudicationResult(adjudicationResult: MedicalAdjudicationResult) {
    this.medicalAdjudicationResult = adjudicationResult;

    const { decision, approvedPayableAmount, coPayableAmount } =
      adjudicationResult;

    switch (decision) {
      case MedicalAdjudicationDecision.APPROVED:
        this.status = AdjudicationItemStatus.APPROVED;
        this.approvedPayableAmount = approvedPayableAmount;
        this.coPayableAmount = coPayableAmount;
        break;
      case MedicalAdjudicationDecision.REJECTED:
        this.status = AdjudicationItemStatus.REJECTED;
        break;

      default:
        break;
    }
  }

  constructor(init?: Partial<AdjudicationItem>) {
    Object.assign(this, init);
  }
}
