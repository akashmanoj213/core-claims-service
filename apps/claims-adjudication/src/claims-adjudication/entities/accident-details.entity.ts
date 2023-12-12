import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdjudicationItem } from './adjudication-item.entity';

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
  @OneToMany(
    () => AdjudicationItem,
    (adjudicationItem) => adjudicationItem.hospitalDetails,
  )
  adjudicationItems: AdjudicationItem[];

  constructor(init?: Partial<AccidentDetails>) {
    Object.assign(this, init);
  }
}
