import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ICD10Level2 } from './icd-10-level2.entity';

@Entity()
export class ICD10Level1 {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column({
    unique: true,
  })
  code: string;
  @Column()
  name: string;
  @OneToMany(() => ICD10Level2, (icd10Level2) => icd10Level2.level1Item, {
    cascade: true,
  })
  level2Items?: ICD10Level2[];
}
