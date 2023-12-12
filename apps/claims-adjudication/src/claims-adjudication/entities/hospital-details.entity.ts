import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  OneToMany,
} from 'typeorm';
import { AdjudicationItem } from './adjudication-item.entity';

@Entity()
export class HospitalDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  hospitalId: number;
  @Column()
  hospitalName: string;
  @Column()
  hospitalLocation: string;
  @Column()
  hospitalPincode: string;
  @Column()
  hospitalEmailId: string;
  @Column()
  bankAccountNumber: string;
  @Column()
  bankIfscCode: string;
  @Column()
  bankAccountName: string;
  @Column()
  rohiniId: number;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToMany(
    () => AdjudicationItem,
    (adjudicationItem) => adjudicationItem.hospitalDetails,
  )
  adjudicationItems: AdjudicationItem[];

  constructor(init?: Partial<HospitalDetails>) {
    Object.assign(this, init);
  }
}
