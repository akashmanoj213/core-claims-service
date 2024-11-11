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
import { ClaimItemType, ClaimStatus, ClaimType } from '@app/common-dto';
import { PolicyDetails } from './policy-details.entity';
import { MemberDetails } from './member-details.entity';
import { HospitalDetails } from './hospital-details.entity';
import { VariationData } from './variation-data-entity';
import { MedicalBillDetails } from './medical-bill-details.entity';

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
  @Column({ type: 'uuid', nullable: true })
  streamId?: string;
  @Column()
  policyNumber: number;
  @Column()
  insuranceCardNumber: number; // might be generated at the time of issuance
  @Column()
  hospitalId: number;
  @Column()
  contactNumber: string;
  @Column({
    nullable: true,
  })
  caretakerContactNumber?: string;
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
  isInstantCashless = false;
  @Column({
    type: 'boolean',
    default: true,
  })
  isHospitalOptedForInstantApproval = true;
  @Column({
    type: 'boolean',
    default: false,
  })
  isFinal = false;
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
  variations?: VariationData[];
  @OneToMany(
    () => MedicalBillDetails,
    (medicalBill) => medicalBill.claimDetails,
    { cascade: true },
  )
  medicalBills?: MedicalBillDetails[];

  constructor(init?: Partial<Claim>) {
    Object.assign(this, init);
  }

  addNewClaimItem(claimItem: ClaimItem) {
    claimItem.claimItemStatus = ClaimItemStatus.INITIATED;

    //One or more claimitems already present
    if (this.claimItems && this.claimItems.length) {
      if (this.isInstantCashless) {
        throw new Error(
          `A new claim item cannot be added as an instant cashless claim can have only one claim item present.`,
        );
      }

      // Check if any claim item is under review
      this.claimItems.sort((a, b) => b.id - a.id);
      const latestClaimItem = this.claimItems[0];
      const termianlStates = [
        ClaimItemStatus.APPROVED,
        ClaimItemStatus.REJECTED,
      ];
      if (!termianlStates.includes(latestClaimItem.claimItemStatus)) {
        throw new Error(
          `A new claim item cannot be added as another claim item (${latestClaimItem.id}) is currently under review !`,
        );
      }

      // Add claim item
      if (claimItem.claimItemType === ClaimItemType.ENHANCEMENT) {
        if (!(claimItem.totalAmount > 0)) {
          throw new Error(
            "An 'enhancement' claim item must have a positive totalAmount !",
          );
        }

        this.claimStatus = ClaimStatus.ENHANCEMENT_INITIATED;
      } else if (claimItem.claimItemType === ClaimItemType.INTIAL) {
        throw new Error("Claim item with type 'initial' already exists !");
      } else if (claimItem.claimItemType === ClaimItemType.FINAL) {
        if (this.isFinal) {
          throw new Error("Claim item with type 'final' already exists !");
        }

        this.isFinal = true;
        this.claimStatus = ClaimStatus.FINAL_SUBMISSION_INITIATED;
      }

      this.claimItems.push(claimItem);
    } else {
      // no claim items present
      if (claimItem.claimItemType === ClaimItemType.INTIAL) {
        if (
          !this.patientAdmissionDetails ||
          !this.patientAdmissionDetails.sumTotalExpectedHospitalisationCost
        ) {
          throw new Error(
            'patientAdmissionDetails.sumTotalExpectedHospitalisationCost has to be a positive value !',
          );
        }
      } else if (claimItem.claimItemType === ClaimItemType.ENHANCEMENT) {
        throw new Error(
          "An 'enhancement' claim item cannot be added to a claim without an 'initial' claim item !",
        );
      } else {
        // if instant cashless claim , only one claim item will be present which of type FINAL
        if (!this.isInstantCashless) {
          throw new Error(
            "A 'final' claim item cannot be added to a claim without an 'initial' claim item !",
          );
        }

        this.isFinal = true;
      }

      claimItem.totalAmount = parseFloat(
        this.patientAdmissionDetails.sumTotalExpectedHospitalisationCost.toString(),
      );

      this.claimItems = [claimItem];
    }

    this.totalClaimAmount =
      parseFloat(this.totalClaimAmount.toString()) +
      parseFloat(claimItem.totalAmount.toString());
  }

  addMedicalBill(medicalBill: MedicalBillDetails) {
    if (this.medicalBills && this.medicalBills.length) {
      this.medicalBills.push(medicalBill);
    } else {
      this.medicalBills = [medicalBill];
    }
  }

  approveClaim(approvedPayableAmount, coPayableAmount) {
    this.approvedPayableAmount =
      parseFloat(this.approvedPayableAmount.toString()) +
      parseFloat(approvedPayableAmount.toString());

    this.coPayableAmount =
      parseFloat(this.coPayableAmount.toString()) +
      parseFloat(coPayableAmount.toString());

    this.claimStatus = ClaimStatus.APPROVED;
  }

  rejectClaim() {
    this.claimStatus = ClaimStatus.REJECTED;
  }

  initiatePayment() {
    this.claimStatus = ClaimStatus.PAYOUT_INITIATED;
  }

  completePayment() {
    this.claimStatus = ClaimStatus.PAYOUT_COMPLETED;
  }
}
