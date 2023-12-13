import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Claim } from './claim.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity()
export class MemberDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  memberId: number;
  @Column()
  policyId: number;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  sumInsured: number;
  @Column()
  contactNumber: string;
  @Column()
  fullName: string;
  @Column({
    type: 'enum',
    enum: Gender,
  })
  gender: Gender;
  @Column()
  email: string;
  @Column()
  communicationPreference: string;
  @Column()
  exclusions: string;
  @Column()
  memberBenefits: string;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  memberDeductions = 0.0;
  @Column({
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  memberCapping: number;
  @Column()
  memberWaitingPeriod: number;
  @Column()
  numberOfClaims: number;
  @Column({
    type: 'boolean',
    default: false,
  })
  isInstantCashless = false;
  @Column()
  startDate: Date;
  @Column()
  endDate: Date;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(() => Claim, (Claim) => Claim.memberDetails)
  claimDetails: Claim;

  constructor(init?: Partial<MemberDetails>) {
    Object.assign(this, init);
  }
}
