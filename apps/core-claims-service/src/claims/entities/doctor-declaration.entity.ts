import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity()
export class DoctorDeclaration {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  treatingDoctorName: string;
  @Column()
  qualification: string;
  @Column()
  registrationNumberWithStateCode: string;
  @Column()
  declarationDateTime: Date;
  @Column()
  isSigned: boolean;
  @CreateDateColumn()
  createdAt?: Date;

  @OneToOne(() => Claim, (Claim) => Claim.doctorDeclaration)
  claimDetails: Claim;

  constructor(init?: Partial<DoctorDeclaration>) {
    Object.assign(this, init);
  }
}
