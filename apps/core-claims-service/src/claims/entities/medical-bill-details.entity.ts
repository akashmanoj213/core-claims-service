import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { MedicalBillLineItem } from './medical-bill-line-item.entity';
import { Claim } from './claim.entity';

@Entity()
export class MedicalBillDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  billNumber: number;
  @Column()
  billDate: Date;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  totalAmount: number;
  @OneToMany(() => MedicalBillLineItem, (lineItem) => lineItem.medicalBill, {
    cascade: true,
  })
  lineItems: MedicalBillLineItem[];
  @ManyToOne(() => Claim, (claim) => claim.medicalBills)
  claimDetails: Claim;

  constructor(init?: Partial<MedicalBillDetails>) {
    Object.assign(this, init);
  }
}
