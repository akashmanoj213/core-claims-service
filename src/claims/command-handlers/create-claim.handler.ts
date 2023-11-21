import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateClaimCommand } from '../commands/create-claim.command';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStore, OperationTypes } from '../entities/event-store.entity';
import { PubSubService } from 'src/core/providers/pub-sub/pub-sub.service';
import { EventStoreEventDto, EventTypes } from '../dto/event-store-event.dto';
import * as crypto from 'crypto';

@CommandHandler(CreateClaimCommand)
export class CreateClaimCommandHandler
  implements ICommandHandler<CreateClaimCommand>
{
  private readonly EVENT_STORE_TOPIC = 'event-store-event-emitted';
  private readonly logger = new Logger(CreateClaimCommandHandler.name);

  constructor(
    @InjectRepository(EventStore)
    private eventStoreRepository: Repository<EventStore>,
    private readonly pubSubService: PubSubService,
  ) {}

  async execute(command: CreateClaimCommand): Promise<any> {
    const { claim } = command;
    const streamId = crypto.randomUUID();
    claim.streamId = streamId;

    const eventStoreEntity = new EventStore({
      streamId,
      data: claim,
      version: 0,
      operationType: OperationTypes.CREATE,
    });

    await this.eventStoreRepository.save(eventStoreEntity);
    this.logger.log(
      `The event has been saved to event-store. StreamId: ${streamId}.`,
    );

    const eventStoreEventDto = new EventStoreEventDto({
      type: EventTypes.CREATE_CLAIM,
      data: claim,
    });

    // publish to pub/sub
    await this.pubSubService.publishMessage(
      this.EVENT_STORE_TOPIC,
      eventStoreEventDto,
    );

    this.logger.log(`Event store event published to Pub/Sub!`);
    return streamId;
  }
}
