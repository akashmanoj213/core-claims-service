import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity()
export class MaternityDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  gravidaValue: number;
  @Column()
  paraValue: number;
  @Column()
  liveValue: number;
  @Column()
  abortionValue: number;
  @Column()
  expectedDateOfDelivery: Date;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(() => Claim, (Claim) => Claim.maternityDetails)
  claimDetails: Claim;

  constructor(init?: Partial<MaternityDetails>) {
    Object.assign(this, init);
  }
}
