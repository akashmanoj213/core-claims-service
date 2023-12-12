import { ClaimStatus } from '@app/common-dto';
import { ClaimType, PaymentStatus } from '@app/common-dto';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ClaimSettlement {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  claimId: number;
  @Column({
    type: 'enum',
    enum: ClaimType,
  })
  claimType: ClaimType;
  @Column({
    type: 'enum',
    enum: ClaimStatus,
  })
  claimStatus: ClaimStatus;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  approvedPayableAmount: number;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  coPayableAmount: number;
  @Column()
  bankAccountNumber: string;
  @Column()
  bankIfscCode: string;
  @Column()
  bankAccountName: string;
  @Column()
  contactNumber: string;
  @Column()
  paymentId: number;
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  completePayment() {
    this.paymentStatus = PaymentStatus.COMPLETED;
  }

  constructor(init?: Partial<ClaimSettlement>) {
    Object.assign(this, init);
  }
}
