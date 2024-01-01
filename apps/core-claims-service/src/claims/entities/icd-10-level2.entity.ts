import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ICD10Level1 } from './icd-10-level1.entity';
import { ICD10Level3 } from './icd-10-level3.entity';

@Entity()
export class ICD10Level2 {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column({
    unique: true,
  })
  code: number;
  @Column()
  name: string;
  @ManyToOne(() => ICD10Level1, (level1Item) => level1Item.level2Items)
  @JoinColumn({ referencedColumnName: 'code', name: 'icd10Level1Code' })
  level1Item?: ICD10Level1;
  @OneToMany(() => ICD10Level3, (icd10Level3) => icd10Level3.level2Item, {
    cascade: true,
  })
  level3Items?: ICD10Level3[];
}
