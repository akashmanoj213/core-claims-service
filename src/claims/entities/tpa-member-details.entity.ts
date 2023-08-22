import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity()
export class TpaMemberDetails {
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
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;
  @OneToOne(() => Claim, (Claim) => Claim.tpaMemberDetails)
  claimDetails: Claim;

  constructor(init?: Partial<TpaMemberDetails>) {
    Object.assign(this, init);
  }
}
