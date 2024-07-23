import { Injectable } from '@nestjs/common';
import { PubSubService } from './pub-sub.service';
import { ClaimCreatedTemplate, TextMessageTemplate } from '@app/common-classes';

@Injectable()
export class NotificationService {
  private readonly NOTIFICATION_TOPIC = 'process-notification';

  constructor(private pubSubService: PubSubService) {}

  async sendSMS(receiverNumber: string, body: string) {
    console.log('Sending SMS to customer.');

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
        console.log(`SMS messages successfully sent to ${receiverNumber}.`);
      } else {
        console.log(`SMS messaging disabled.`);
      }

      return messageId;
    } catch (error) {
      console.log(
        `Failed to send SMS to ${receiverNumber} due to : ${error.message}.`,
      );
    }
  }

  async sendWhatsappMessage(
    receiverNumber: string,
    body: ClaimCreatedTemplate | TextMessageTemplate,
  ) {
    console.log('Sending Whatsapp message.');

    const attributes = {
      type: 'whatsapp',
    };

    const messageBody = {
      receiverNumber: '91' + receiverNumber,
      ...body,
    };

    try {
      const messageId = await this.pubSubService.publishMessage(
        this.NOTIFICATION_TOPIC,
        messageBody,
        attributes,
      );
      console.log(`SMS messages successfully sent to ${receiverNumber}.`);

      return messageId;
    } catch (error) {
      console.log(
        `Failed to push message to pub/sub topic due to : ${error.message}.`,
      );
    }
  }
}
