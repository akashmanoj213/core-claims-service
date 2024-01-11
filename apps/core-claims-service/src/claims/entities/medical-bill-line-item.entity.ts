import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MedicalBillDetails } from './medical-bill-details.entity';
import { ICD10Level3 } from './icd-10-level3.entity';
import { ICD10Level2 } from './icd-10-level2.entity';
import { ICD10Level1 } from './icd-10-level1.entity';

@Entity()
export class MedicalBillLineItem {
  @PrimaryGeneratedColumn()
  id?: number;
  @ManyToOne(() => MedicalBillDetails, (medicalBill) => medicalBill.lineItems)
  medicalBill: MedicalBillDetails;
  @ManyToOne(() => ICD10Level3)
  @JoinColumn({ referencedColumnName: 'code', name: 'icd10Level3Code' })
  icd10Level3: ICD10Level3;
  @ManyToOne(() => ICD10Level2)
  @JoinColumn({ referencedColumnName: 'code', name: 'icd10Level2Code' })
  icd10Level2: ICD10Level2;
  @ManyToOne(() => ICD10Level1)
  @JoinColumn({ referencedColumnName: 'code', name: 'icd10Level1Code' })
  icd10Level1: ICD10Level1;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  rate: number;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  unit: number;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount: number;

  constructor(init?: Partial<MedicalBillLineItem>) {
    Object.assign(this, init);
  }
}
