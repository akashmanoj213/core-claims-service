import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Claim } from './claim.entity';
import { ClaimItemType } from 'src/core/enums';
import { ClaimItemDocument } from './claim-item-document.entity';

export enum ClaimItemStatus {
  INITIATED = 'initiated',
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
export class ClaimItem {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column({
    type: 'enum',
    enum: ClaimItemType,
    default: ClaimItemType.INTIAL,
  })
  claimItemType: ClaimItemType;
  @Column({
    type: 'enum',
    enum: ClaimItemStatus,
    default: ClaimItemStatus.INITIATED,
  })
  claimItemStatus: ClaimItemStatus;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  totalAmount = 0.0;
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
  nonMedicalAdjudicationResult: string;
  @Column({
    nullable: true,
  })
  medicalAdjudicationResult: string;
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

  @ManyToOne(() => Claim, (claim) => claim.claimItems)
  claim: Claim;
  @OneToMany(
    () => ClaimItemDocument,
    (claimItemDocument) => claimItemDocument.claimItem,
    { cascade: true },
  )
  documents: ClaimItemDocument[];

  addDocuments(documents: ClaimItemDocument[]) {
    this.documents = documents;
  }

  updateNonMedicalAdjudicationResult(overallComment) {
    this.claimItemStatus = ClaimItemStatus.NON_MEDICAL_REVIEW_COMPLETED;
    this.nonMedicalAdjudicationResult = overallComment;
  }

  approveClaimItem(approvedPayableAmount, coPayableAmount, overallComment) {
    this.claimItemStatus = ClaimItemStatus.APPROVED;
    this.approvedPayableAmount = approvedPayableAmount;
    this.coPayableAmount = coPayableAmount;
    this.medicalAdjudicationResult = overallComment;
  }

  rejectClaimItem() {
    this.claimItemStatus = ClaimItemStatus.REJECTED;
  }

  constructor(init?: Partial<ClaimItem>) {
    Object.assign(this, init);
  }
}
