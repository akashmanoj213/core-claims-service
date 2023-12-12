import { IsEnum, IsObject } from 'class-validator';

export enum EventTypes {
  CREATE_CLAIM = 'create-claim',
}

export class EventStoreEventDto {
  @IsEnum(EventTypes)
  type: EventTypes;
  @IsObject()
  data: object;

  constructor(init: EventStoreEventDto) {
    Object.assign(this, init);
  }
}
