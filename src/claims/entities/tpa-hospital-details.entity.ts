import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  Entity,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity()
export class TpaHospitalDetails {
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
  rohiniId: number;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(() => Claim, (Claim) => Claim.tpaHospitalDetails)
  claimDetails: Claim;

  constructor(init?: Partial<TpaHospitalDetails>) {
    Object.assign(this, init);
  }
}
