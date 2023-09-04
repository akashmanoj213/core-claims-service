import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { NonMedicalAdjudicationResult } from './non-medical-adjudication-result.entity';

export enum AdjudicationType {
  NON_MEDICAL = 'non-medical',
  MEDICAL = 'medical',
}

@Entity()
export class VariationData {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  fieldName: string;
  // @Column({
  //   nullable: true,
  // })
  // originalStringValue?: string;
  // @Column({
  //   nullable: true,
  // })
  // expectedStringValue?: string;
  @Column({
    nullable: true,
  })
  comment: string;
  @Column({
    type: 'enum',
    enum: AdjudicationType,
  })
  adjudicationType: AdjudicationType;

  @ManyToOne(
    () => NonMedicalAdjudicationResult,
    (adjudicationResult) => adjudicationResult.variations,
  )
  adjudicationResult: NonMedicalAdjudicationResult;

  constructor(init?: Partial<VariationData>) {
    Object.assign(this, init);
  }
}
