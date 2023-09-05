import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TpaPolicyDetails } from './tpa-policy-details.entity';
import { TpaMemberDetails } from './tpa-member-details.entity';
import { TpaHospitalDetails } from './tpa-hospital-details.entity';
import { DoctorTreatmentDetails } from './doctor-treatment-details.entity';
import { PatientAdmissionDetails } from './patient-admission-details.entity';
import { PatientDeclaration } from './patient-declaration.entity';
import { DoctorDeclaration } from './doctor-declaration.entity';
import { HospitalDeclaration } from './hospital-declaration.entity';
import { AccidentDetails } from './accident-details.entity';
import { MaternityDetails } from './maternity-details.entity';
import { ClaimItem, ClaimItemStatus } from './claim-item.entity';
import { ClaimItemType, ClaimType } from 'src/core/enums';
import { PolicyDetails } from './policy-details.entity';
import { MemberDetails } from './member-details.entity';
import { HospitalDetails } from './hospital-details.entity';
import { VariationData } from './variation-data-entity';

export enum ClaimStatus {
  INITIATED = 'initiated',
  VARIATIONS_DETECTED = 'variations detected',
  UNDER_REVIEW = 'under review',
  REVIEW_COMPLETED = 'review completed',
  PAYOUT_INITIATED = 'payout initiated',
  PAYOUT_COMPLETED = 'payout completed',
  COMPLETED = 'completed',
}

@Entity()
export class Claim {
  @PrimaryGeneratedColumn()
  id?: number;
  // @Column({
  //   nullable: true,
  // })
  // preClaimRequestId: number;
  //   @Column()
  //   TPAId: number; // will be calculated based on the patient
  //   @Column()
  //   policyId: number;
  @Column()
  policyNumber: number;
  @Column()
  insuranceCardNumber: number; // might be generated at the time of issuance
  @Column()
  hospitalId: number;
  @Column()
  contactNumber: string;
  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.INITIATED,
  })
  claimStatus: ClaimStatus;
  @Column({
    type: 'enum',
    enum: ClaimType,
  })
  claimType: ClaimType;
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
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalClaimAmount = 0.0;
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
  @Column()
  tpaId: number;
  @Column({
    type: 'boolean',
    default: false,
  })
  isVariationDetected = false;
  @Column({
    type: 'boolean',
    default: false,
  })
  isDischarged = false;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(
    () => TpaPolicyDetails,
    (TPAPolicyDetails) => TPAPolicyDetails.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  tpaPolicyDetails: TpaPolicyDetails;
  @OneToOne(
    () => TpaMemberDetails,
    (TPAMemberDetails) => TPAMemberDetails.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  tpaMemberDetails: TpaMemberDetails;
  @OneToOne(
    () => TpaHospitalDetails,
    (tpaHospitlDetails) => tpaHospitlDetails.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  tpaHospitalDetails: TpaHospitalDetails; // Check if hospital is in Network hospitals
  @OneToOne(
    () => DoctorTreatmentDetails,
    (DoctorTreatmentDetails) => DoctorTreatmentDetails.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  doctorTreatmentDetails: DoctorTreatmentDetails;
  @OneToOne(
    () => PatientAdmissionDetails,
    (PatientAdmissionDetails) => PatientAdmissionDetails.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  patientAdmissionDetails: PatientAdmissionDetails;
  @OneToOne(
    () => PatientDeclaration,
    (PatientDeclaration) => PatientDeclaration.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  patientDeclaration: PatientDeclaration;
  @OneToOne(
    () => DoctorDeclaration,
    (DoctorDeclaration) => DoctorDeclaration.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  doctorDeclaration: DoctorDeclaration; // Check if names in declaration are same as the patient details
  @OneToOne(
    () => HospitalDeclaration,
    (HospitalDeclaration) => HospitalDeclaration.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  hospitalDeclaration: HospitalDeclaration; //  Check if names in declaration are same as the doctor details
  @OneToOne(
    () => PolicyDetails,
    (policyDetails) => policyDetails.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  policyDetails: PolicyDetails;
  @OneToOne(
    () => MemberDetails,
    (memberDetails) => memberDetails.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  memberDetails: MemberDetails;
  @OneToOne(
    () => HospitalDetails,
    (hospitlDetails) => hospitlDetails.claimDetails,
    { cascade: true },
  )
  @JoinColumn()
  hospitalDetails: HospitalDetails;
  @OneToOne(
    () => MaternityDetails,
    (MaternityDetails) => MaternityDetails.claimDetails,
    { cascade: true, nullable: true },
  )
  @JoinColumn()
  maternityDetails?: MaternityDetails;
  @OneToOne(
    () => AccidentDetails,
    (AccidentDetails) => AccidentDetails.claimDetails,
    { cascade: true, nullable: true },
  )
  @JoinColumn()
  accidentDetails?: AccidentDetails; // Check if insurance covers Maternity ?
  @OneToMany(() => ClaimItem, (claimItem) => claimItem.claim, { cascade: true })
  claimItems: ClaimItem[];
  @OneToMany(() => VariationData, (variation) => variation.claim, {
    cascade: true,
  })
  variations: VariationData[];

  constructor(init?: Partial<Claim>) {
    Object.assign(this, init);
  }

  addNewClaimItem(claimItem: ClaimItem) {
    claimItem.claimItemStatus = ClaimItemStatus.INITIATED;

    if (this.claimItems && this.claimItems.length) {
      // Check if any claim item is under review
      this.claimItems.sort((a, b) => b.id - a.id);
      const latestClaimItem = this.claimItems[0];

      if (
        latestClaimItem.claimItemStatus !== ClaimItemStatus.APPROVED &&
        latestClaimItem.claimItemStatus !== ClaimItemStatus.REJECTED
      ) {
        throw new Error(
          'A new claim item cannot be added as another claim item is already under review !',
        );
      }

      // Add claim item
      if (claimItem.claimItemType === ClaimItemType.ENHANCEMENT) {
        if (!(claimItem.totalAmount > 0)) {
          throw new Error(
            "An 'enhancement' claim item must have a positive totalAmount !",
          );
        }
      } else if (claimItem.claimItemType === ClaimItemType.INTIAL) {
        throw new Error("Claim item with type 'initial' already exists !");
      } else {
        if (this.isDischarged) {
          throw new Error("Claim item with type 'final' already exists !");
        }

        this.isDischarged = true;
      }

      this.claimItems.push(claimItem);
    } else {
      if (claimItem.claimItemType === ClaimItemType.INTIAL) {
        if (
          !this.patientAdmissionDetails ||
          !this.patientAdmissionDetails.sumTotalExpectedHospitalisationCost
        ) {
          throw new Error(
            'patientAdmissionDetails.sumTotalExpectedHospitalisationCost has to be a positive value !',
          );
        }

        claimItem.totalAmount = parseFloat(
          this.patientAdmissionDetails.sumTotalExpectedHospitalisationCost.toString(),
        );
        this.claimItems = [claimItem];
      } else if (claimItem.claimItemType === ClaimItemType.ENHANCEMENT) {
        throw new Error(
          "An 'enhancement' claim item cannot be added to a claim without an 'initial' claim item !",
        );
      } else {
        throw new Error(
          "A 'final' claim item cannot be added to a claim without an 'initial' claim item !",
        );
      }
    }

    this.totalClaimAmount =
      parseFloat(this.totalClaimAmount.toString()) +
      parseFloat(claimItem.totalAmount.toString());
  }
}
