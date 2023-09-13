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
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  totalApprovedPayableAmount = 0.0;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  totalCoPayableAmount = 0.0;
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
    type: 'boolean',
    default: false,
  })
  isInstantCashless = false;
  @Column()
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
  documents: AdjudicationItemDocument[];

  updateNonMedicalFWAResult(
    nonMedicalFWAResult: string,
    nonMedicalFWAReason: string,
    isFailure: boolean,
  ) {
    // save non medical FWA results only if its performed initially or after non-medical fwa failure
    if (
      !this.isInstantCashless &&
      this.status &&
      this.status !== AdjudicationItemStatus.NON_MEDICAL_FWA_FAILED
    ) {
      throw new Error(
        'Non medical FWA results cannot be updated at this stage of the adjudication item !',
      );
    }

    if (isFailure) {
      this.status = AdjudicationItemStatus.NON_MEDICAL_FWA_FAILED;
    } else {
      this.status = AdjudicationItemStatus.NON_MEDICAL_FWA_COMPLETED;
      this.nonMedicalFWAResult = nonMedicalFWAResult;
      this.nonMedicalFWAReason = nonMedicalFWAReason;
    }
  }

  updateNonMedicalAdjudicationResult(
    adjudicationResult: NonMedicalAdjudicationResult,
  ) {
    // save non medical adjudication results only after non medical FWA performed
    if (
      !(
        this.status === AdjudicationItemStatus.NON_MEDICAL_FWA_COMPLETED ||
        this.status === AdjudicationItemStatus.NON_MEDICAL_FWA_FAILED
      )
    ) {
      throw new Error(
        'Non medical adjudication results cannot be updated at this stage of the adjudication item !',
      );
    }

    this.nonMedicalAdjudicationResult = adjudicationResult;
    this.status = AdjudicationItemStatus.NON_MEDICAL_REVIEW_COMPLETED;
  }

  updateMedicalFWAResult(
    medicalFWAResult: string,
    medicalFWAReason: string,
    isFailure: boolean,
  ) {
    // save medical FWA results only if its performed after non-medical review completed or after non medical fwa completed or failed (in case of isPrivileged)
    if (
      !(
        this.isInstantCashless ||
        this.status === AdjudicationItemStatus.NON_MEDICAL_REVIEW_COMPLETED ||
        this.status === AdjudicationItemStatus.MEDICAL_FWA_FAILED
      )
    ) {
      throw new Error(
        'Medical adjudication results cannot be updated at this stage of the adjudication item !',
      );
    }

    if (isFailure) {
      this.status = AdjudicationItemStatus.MEDICAL_FWA_FAILED;
    } else {
      this.status = AdjudicationItemStatus.MEDICAL_FWA_COMPLETED;
      this.medicalFWAResult = medicalFWAResult;
      this.medicalFWAReason = medicalFWAReason;
    }
  }

  updateMedicalAdjudicationResult(
    adjudicationResult: MedicalAdjudicationResult,
  ) {
    // save medical adjudication results only after medical FWA performed
    if (
      !(
        this.status === AdjudicationItemStatus.MEDICAL_FWA_COMPLETED ||
        this.status === AdjudicationItemStatus.MEDICAL_FWA_FAILED
      )
    ) {
      throw new Error(
        'Medical adjudication results cannot be updated at this stage of the adjudication item !',
      );
    }

    const {
      decision,
      approvedPayableAmount = 0.0,
      coPayableAmount = 0.0,
    } = adjudicationResult;

    switch (decision) {
      case MedicalAdjudicationDecision.APPROVED:
        this.status = AdjudicationItemStatus.APPROVED;
        if (approvedPayableAmount < 0.0 || coPayableAmount < 0.0) {
          throw new Error(
            'Approved payable and co payable amount have to be a non-negative value !',
          );
        }

        if (
          approvedPayableAmount + coPayableAmount >
          this.claimItemTotalAmount
        ) {
          throw new Error(
            'Please approve values within claim item total amount !',
          );
        }

        this.approvedPayableAmount = approvedPayableAmount;
        this.coPayableAmount = coPayableAmount;
        break;
      case MedicalAdjudicationDecision.REJECTED:
        this.status = AdjudicationItemStatus.REJECTED;
        break;

      default:
        break;
    }

    this.medicalAdjudicationResult = adjudicationResult;
  }

  constructor(init?: Partial<AdjudicationItem>) {
    Object.assign(this, init);
  }
}
