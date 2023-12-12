import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

export enum OperationTypes {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

@Entity()
@Unique(['streamId', 'version'])
export class EventStore {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  sequenceNum?: string;
  @Column({ type: 'uuid' })
  streamId: string;
  @Column()
  version: number; // might be generated at the time of issuance
  @Column('jsonb')
  data: object;
  @Column({ type: 'enum', enum: OperationTypes })
  operationType: OperationTypes;
  @Column({
    nullable: true,
    type: 'jsonb',
  })
  meta?: object;
  @Column('timestamp with time zone', {
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  logDate?: Date;

  constructor(init?: Partial<EventStore>) {
    Object.assign(this, init);
  }
}
