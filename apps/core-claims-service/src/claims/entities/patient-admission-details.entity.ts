import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { PastChronicIllness } from './past-chronic-illness.entity';
import { Claim } from './claim.entity';

export enum RoomType {
  AC = 'AC',
  NONAC = 'Non-AC',
  SEMI_PRIVATE_NON_AC = 'Semi Pvt Non AC',
  SEMI_PRIVATE_AC = 'Semi Pvt AC',
  SINGLE_NON_AC = 'Single Non AC',
  SINGLE_AC = 'Single AC',
  DELUXE = 'Deluxe',
  SUIT = 'Suit',
  GENERAL_WARD = 'General ward/ Economy/ Multi sharing/ Four sharing',
}

@Entity()
export class PatientAdmissionDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  patientFullName: string;
  @Column()
  patientGender: string;
  @Column()
  patientDob: Date;
  @Column()
  dateAndTimeOfAdmission: Date;
  @Column()
  contactNumber: string;
  @Column({
    nullable: true,
  })
  alternateContactNumber: string;
  @Column()
  isEmergencyHospitalisation: boolean;
  @Column()
  isPlannedHospitalisation: boolean;
  @Column({
    type: 'int',
    default: 0,
  })
  expectedNumberOfDaysStay = 0; // is this part of hospital data
  @Column({
    type: 'int',
    default: 0,
  })
  expectedDaysInICU = 0; // is this part of hosptial data
  @Column({
    type: 'enum',
    enum: RoomType,
  })
  roomType: RoomType; // is this part of hospital data
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  roomNursingPatientDietCharges = 0.0; // is this part of hospital data ? HOW DO WE CALCULATE FOR COMBINED FIELDS LIKE THIS ?
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  expectedInvestigationDiagnosticsCost = 0.0; // is this part of hospital data
  @Column({
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  ICUCharges = 0.0; // is this part of hospital data and is it disease related or standard pricing ?
  @Column({
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  OTCharges = 0.0; // is this part of hospital data and is it disease related or standard pricing ?
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  professionalAnestheticFeesCosultationCharges = 0.0; // is this part of hospital data and is it disease related or standard pricing ?
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  medicineConsumableImplantCharges = 0.0; // is this part of hospital data and is it disease related or standard pricing ?
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  otherHospitalExpenses = 0.0; // is this part of hospital data
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  allInclusivePackageCharges = 0.0; // is this part of hospital data? IF THIS IS PART OF A PACKAGE THEN ARE THERE STILL INDIVIDUAL CHARGES ALLOTED ?
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  sumTotalExpectedHospitalisationCost = 0.0; // is this part of hospital data? IF PACKAGE THEN WILL THIS BE SAME AS PACKAGE ?
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToMany(
    () => PastChronicIllness,
    (PastChronicIllness) => PastChronicIllness.patientAdmissionDetails,
    { cascade: true },
  )
  pastHistoryOfChronicIllness: PastChronicIllness[];
  @OneToOne(() => Claim, (Claim) => Claim.patientAdmissionDetails)
  claimDetails: Claim;

  constructor(init?: Partial<PatientAdmissionDetails>) {
    Object.assign(this, init);
  }
}
