import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Claim } from './claim.entity';

@Entity()
export class VariationData {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  sectionName: string;
  @Column()
  fieldName: string;
  @Column({
    nullable: true,
  })
  originalStringValue?: string;
  @Column({
    nullable: true,
  })
  receivedStringValue?: string;
  @Column({
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  originalDecimalValue?: number;
  @Column({
    nullable: true,
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  receivedDecimalValue?: number;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => Claim, (claim) => claim.variations)
  claim: Claim;

  constructor(init?: Partial<VariationData>) {
    Object.assign(this, init);
  }
}
