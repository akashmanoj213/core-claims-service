import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';

class MessageDto {
  attributes: {
    [key: string]: string;
  };
  @IsNotEmpty()
  data: string;
  @IsNotEmpty()
  messageId: string;
  message_id: string;
  publishTime: string;
  publish_time: string;
}

export class PubSubMessageDto {
  @ValidateNested()
  @Type(() => MessageDto)
  message: MessageDto;
  subscription: string;
}
