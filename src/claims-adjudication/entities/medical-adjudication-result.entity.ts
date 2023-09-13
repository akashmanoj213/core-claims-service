import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdjudicationType, VariationData } from './variation-data.entity';
import { AdjudicationItem } from './adjudication-item.entity';

export enum MedicalAdjudicationDecision {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  //   QUERY = 'query', // TO-DO
  //   INTERVENTION = 'intervention', // TO-DO
}

@Entity()
export class MedicalAdjudicationResult {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column({
    type: 'enum',
    enum: MedicalAdjudicationDecision,
  })
  decision: MedicalAdjudicationDecision;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  approvedPayableAmount = 0.0;
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  coPayableAmount = 0.0;
  @Column()
  overallComment: string;
  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;

  @OneToOne(
    () => AdjudicationItem,
    (AdjudicationItem) => AdjudicationItem.medicalAdjudicationResult,
  )
  adjudicationItem: AdjudicationItem;
  @OneToMany(
    () => VariationData,
    (VariationData) => VariationData.adjudicationResult,
    { cascade: true },
  )
  variations: VariationData[];

  addVariationData(variationData: VariationData) {
    variationData.adjudicationType = AdjudicationType.MEDICAL;
    this.variations && this.variations.length
      ? this.variations.push(variationData)
      : (this.variations = [variationData]);
  }

  constructor(init?: Partial<MedicalAdjudicationResult>) {
    Object.assign(this, init);
  }
}
