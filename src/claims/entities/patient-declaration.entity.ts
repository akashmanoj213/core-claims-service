import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity()
export class PatientDeclaration {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  patientName: string;
  @Column()
  contactNumber: string;
  @Column()
  emailId: string;
  @Column()
  declarationDateTime: Date;
  @Column()
  isSigned: boolean;
  @CreateDateColumn()
  createdAt?: Date;

  @OneToOne(() => Claim, (Claim) => Claim.patientDeclaration)
  claimDetails: Claim;

  constructor(init?: Partial<PatientDeclaration>) {
    Object.assign(this, init);
  }
}
