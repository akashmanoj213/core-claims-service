import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity()
export class HospitalDeclaration {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  declarationDateTime: Date;
  @Column()
  isSigned: boolean;
  @CreateDateColumn()
  createdAt?: Date;
  @OneToOne(() => Claim, (Claim) => Claim.hospitalDeclaration)
  claimDetails: Claim;

  constructor(init?: Partial<HospitalDeclaration>) {
    Object.assign(this, init);
  }
}
