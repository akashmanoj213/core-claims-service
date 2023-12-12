import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AdjudicationItem } from './adjudication-item.entity';

export enum LineOfTreatment {
  MEDICAL_MANAGEMENT = 'Medical Management',
  SURGICAL_MANAGEMENT = 'Surgical Management',
  INTENSIVE_CARE = 'Intensive Care',
  INVESTIGATION = 'Investigation',
  NONALLOPATHICTREATMENT = 'Non-Allopathic treatment',
}

@Entity()
export class DoctorTreatmentDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  doctorName: string;
  @Column()
  doctorContactNumber: string;
  @Column()
  diseaseName: string; // CHECK WITH DISEASE OR ICD CODE ?
  @Column()
  clinicalFindings: string;
  @Column()
  ailmentDuration: number;
  @Column()
  dateOfFirstConsult: Date;
  @Column()
  pastHistoryOfAilment: string;
  @Column()
  provisionalDiagnosis: string;
  @Column()
  ICD11Code: string; // Check if ICD code is within insurance coverage
  @Column({
    type: 'enum',
    enum: LineOfTreatment,
  })
  proposedLineOfTreatment: LineOfTreatment;
  @Column()
  investigationOrMedicalDetails: string;
  @Column()
  routeOfDrugAdministration: string;
  @Column({
    nullable: true,
  })
  nameOfSurgery?: string;
  @Column({
    nullable: true,
  })
  surgeryICD11Code?: string; // ANYTHING TO CROSS CHECK HERE ?
  @Column({
    nullable: true,
  })
  otherTreatmentDetails?: string;
  @Column({
    nullable: true,
  })
  InjuryReason?: string;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToMany(
    () => AdjudicationItem,
    (adjudicationItem) => adjudicationItem.doctorTreatmentDetails,
  )
  adjudicationItems: AdjudicationItem[];

  constructor(init?: Partial<DoctorTreatmentDetails>) {
    Object.assign(this, init);
  }
}
