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
export class TpaPolicyDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  policyId: number;
  @Column()
  startDate: Date;
  @Column()
  endDate: Date;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  sumInsured: number;
  @Column()
  policyBenefits: string;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  policyDeductions = 0.0;
  @Column({
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  policyCapping: number;
  @Column()
  policyWaitingPeriod: number;
  @Column()
  totalNumberOfClaims: number;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(() => Claim, (Claim) => Claim.tpaPolicyDetails)
  claimDetails: Claim;

  constructor(init?: Partial<TpaPolicyDetails>) {
    Object.assign(this, init);
  }
}
