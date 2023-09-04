import { Injectable } from '@nestjs/common';
import { PubSubService } from '../pub-sub/pub-sub.service';

@Injectable()
export class NotificationService {
  private readonly NOTIFICATION_TOPIC = 'process-notification';

  constructor(private pubSubService: PubSubService) {}

  async sendSMS(receiverNumber: string, body: string) {
    const attributes = {
      type: 'SMS',
    };

    const messageBody = {
      body,
      receiverNumber: '+' + receiverNumber,
    };

    let messageId = null;

    try {
      if (process.env.SMS_ENABLE === 'true') {
        messageId = await this.pubSubService.publishMessage(
          this.NOTIFICATION_TOPIC,
          messageBody,
          attributes,
        );
        console.log(`SMS messages successfully sent to ${receiverNumber}...`);
      } else {
        console.log(`SMS messaging disabled...`);
      }

      return messageId;
    } catch (error) {
      console.log(
        `Failed to send SMS to ${receiverNumber} due to : ${error.message}`,
      );
    }
  }
}
