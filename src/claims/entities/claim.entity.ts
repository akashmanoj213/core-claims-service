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
import { ClaimItem } from './claim-item.entity';
import { ClaimType } from 'src/core/enums';

export enum ClaimStatus {
  INITIATED = 'initiated',
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
  totalClaimAmount: number;
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

  constructor(init?: Partial<Claim>) {
    Object.assign(this, init);
  }

  addNewClaimItem(claimitem: ClaimItem) {
    if (!(claimitem.totalAmount > 0)) {
      throw new Error('claimItem must have a positive claim amount');
    }

    if (this.claimItems && this.claimItems.length >= 0) {
      this.claimItems.push(claimitem);
      this.totalClaimAmount += claimitem.totalAmount;
    } else {
      this.claimItems = [claimitem];
      if (this.totalClaimAmount !== claimitem.totalAmount) {
        this.totalClaimAmount = claimitem.totalAmount;
      }
    }
  }
}
