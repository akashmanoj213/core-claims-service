import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdjudicationItem } from './adjudication-item.entity';

@Entity()
export class AdjudicationItemDocument {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  fileName: string;
  @Column()
  fieldName: string;
  @Column()
  fileUrl: string;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(
    () => AdjudicationItem,
    (adjudicationItem) => adjudicationItem.documents,
  )
  adjudicationItem: AdjudicationItem;

  constructor(init?: Partial<AdjudicationItemDocument>) {
    Object.assign(this, init);
  }
}
