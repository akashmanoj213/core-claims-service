import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  OneToOne,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity()
export class HospitalDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  hospitalId: number;
  @Column()
  hospitalName: string;
  @Column()
  hospitalLocation: string;
  @Column()
  hospitalPincode: string;
  @Column()
  hospitalEmailId: string;
  @Column()
  bankAccountNumber: string;
  @Column()
  bankIfscCode: string;
  @Column()
  bankAccountName: string;
  @Column()
  rohiniId: number;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(() => Claim, (Claim) => Claim.hospitalDetails)
  claimDetails: Claim;

  constructor(init?: Partial<HospitalDetails>) {
    Object.assign(this, init);
  }
}
