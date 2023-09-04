import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdjudicationType, VariationData } from './variation-data.entity';
import { AdjudicationItem } from './adjudication-item.entity';

@Entity()
export class NonMedicalAdjudicationResult {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  overallComment: string;

  @OneToOne(
    () => AdjudicationItem,
    (AdjudicationItem) => AdjudicationItem.nonMedicalAdjudicationResult,
  )
  adjudicationItem: AdjudicationItem;
  @OneToMany(
    () => VariationData,
    (VariationData) => VariationData.adjudicationResult,
    { cascade: true },
  )
  variations: VariationData[];

  addVariationData(variationData: VariationData) {
    variationData.adjudicationType = AdjudicationType.NON_MEDICAL;
    this.variations && this.variations.length
      ? this.variations.push(variationData)
      : (this.variations = [variationData]);
  }

  constructor(init?: Partial<NonMedicalAdjudicationResult>) {
    Object.assign(this, init);
  }
}
