import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClaimItem } from './claim-item.entity';

@Entity()
export class ClaimItemDocument {
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

  @ManyToOne(() => ClaimItem, (claimItem) => claimItem.documents)
  claimItem: ClaimItem;

  constructor(init?: Partial<ClaimItemDocument>) {
    Object.assign(this, init);
  }
}
