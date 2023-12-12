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
export class AccidentDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  isRTA: boolean;
  @Column()
  dateOfInjury: Date;
  @Column()
  isReportedToPolice: boolean;
  @Column()
  FIRNumber: number;
  @Column()
  dueToAlcoholOrSubstanceAbuse: boolean;
  @Column()
  isTestConducted: boolean;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(() => Claim, (Claim) => Claim.accidentDetails)
  claimDetails: Claim;

  constructor(init?: Partial<AccidentDetails>) {
    Object.assign(this, init);
  }
}
