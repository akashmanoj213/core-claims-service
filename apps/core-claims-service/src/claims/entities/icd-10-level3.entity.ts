import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ICD10Level2 } from './icd-10-level2.entity';

@Entity()
export class ICD10Level3 {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column({
    unique: true,
  })
  code: string;
  @Column()
  name: string;
  @ManyToOne(() => ICD10Level2, (level2Item) => level2Item.level3Items)
  @JoinColumn({ referencedColumnName: 'code', name: 'icd10Level2Code' })
  level2Item?: ICD10Level2;
}
