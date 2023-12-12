import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AdjudicationItem } from './adjudication-item.entity';

@Entity()
export class MaternityDetails {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  gravidaValue: number;
  @Column()
  paraValue: number;
  @Column()
  liveValue: number;
  @Column()
  abortionValue: number;
  @Column()
  expectedDateOfDelivery: Date;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToMany(
    () => AdjudicationItem,
    (adjudicationItem) => adjudicationItem.maternityDetails,
  )
  adjudicationItems: AdjudicationItem[];

  constructor(init?: Partial<MaternityDetails>) {
    Object.assign(this, init);
  }
}
