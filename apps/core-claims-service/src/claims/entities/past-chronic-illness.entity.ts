import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { PatientAdmissionDetails } from './patient-admission-details.entity';

@Entity()
export class PastChronicIllness {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  illnessName: string;
  @Column()
  illnessStartDate: Date;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(
    () => PatientAdmissionDetails,
    (PatientAdmissionDetails) =>
      PatientAdmissionDetails.pastHistoryOfChronicIllness,
  )
  patientAdmissionDetails: PatientAdmissionDetails;

  constructor(init?: Partial<PastChronicIllness>) {
    Object.assign(this, init);
  }
}
