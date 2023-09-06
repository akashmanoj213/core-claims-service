import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClaimsSettlementService } from './claims-settlement.service';
import { ClaimApprovedEventDto } from 'src/core/dto/claim-approved-event.dto';
import { ClaimSettlement } from './entities/claim-settlement.entity';
import { PubSubMessageDto } from 'src/core/dto/pub-sub-message.dto';
import { PubSubService } from 'src/core/providers/pub-sub/pub-sub.service';
import { PaymentStatusChangedEventDto } from 'src/core/dto/payment-status-changed-event.dto';
import { NotificationService } from 'src/core/providers/notification/notification.service';
import { PaymentCompletedEventDto } from './dto/payment-completed-event.dto';
import { PaymentStatus } from 'src/core/enums/payment-status.enum';

@Controller('claims-settlement')
export class ClaimsSettlementController {
  private readonly PAYMENT_STATUS_CHANGED_TOPIC = 'payment-status-changed';

  constructor(
    private pubSubService: PubSubService,
    private readonly claimsSettlementService: ClaimsSettlementService,
    private notificationService: NotificationService,
  ) {}

  @Post('claim-approved-handler')
  async claimApprovedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Claim approved hanlder invoked...');

    try {
      const {
        message: { data },
      } = pubSubMessage;

      const claimApprovedEventDto =
        this.pubSubService.formatMessageData<ClaimApprovedEventDto>(
          data,
          ClaimApprovedEventDto,
        );

      const { approvedPayableAmount, coPayableAmount, contactNumber, claimId } =
        claimApprovedEventDto;

      //check if already executed
      const existingClaimSettlement =
        await this.claimsSettlementService.findOneByClaimId(claimId);
      if (existingClaimSettlement) {
        // return;
      }

      // Initiate payment
      const paymentId = await this.claimsSettlementService.initiatePayment(
        claimApprovedEventDto,
      );

      const claimSettlement = new ClaimSettlement({
        ...claimApprovedEventDto,
        paymentId,
      });

      await this.claimsSettlementService.save(claimSettlement);

      // notify customer
      console.log('Sending SMS to customer...');
      const smsBody = `Your claim ID: ${claimId} has been approved. A payment for the amount ${approvedPayableAmount} has been initiated to the hospital.`;

      await this.notificationService.sendSMS(
        contactNumber,
        coPayableAmount
          ? smsBody + ` Please pay the remaining ${coPayableAmount}`
          : smsBody,
      );

      //publish to payment-status-changed-topic
      const paymentStatusChangedEventDto = new PaymentStatusChangedEventDto({
        claimId,
        paymentStatus: PaymentStatus.PENDING,
      });
      console.log('Publishing to payment-status-changed topic...');
      await this.pubSubService.publishMessage(
        this.PAYMENT_STATUS_CHANGED_TOPIC,
        paymentStatusChangedEventDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while handling claim-approved event !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('cashless-claim-payment-completed-handler')
  async paymentCompletedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Payment completed handler invoked...');
    try {
      const {
        message: { data },
      } = pubSubMessage;

      const paymentCompletedEventDto =
        this.pubSubService.formatMessageData<PaymentCompletedEventDto>(
          data,
          PaymentCompletedEventDto,
        );

      const { uniqueTransactionId: claimId, paymentId } =
        paymentCompletedEventDto;

      //check if already executed
      const claimSettlement =
        await this.claimsSettlementService.findOneByClaimId(claimId);
      if (claimSettlement.paymentStatus === PaymentStatus.COMPLETED) {
        return;
      }

      await this.claimsSettlementService.completePayment(claimSettlement);

      const { contactNumber } = claimSettlement;

      // notify customer
      console.log('Sending SMS to customer...');
      await this.notificationService.sendSMS(
        contactNumber,
        `The payment for your claim ID: ${claimId} has been completed. Payment transaction ID: ${paymentId}`,
      );

      //publish to payment-status-changed-topic
      const paymentStatusChangedEventDto = new PaymentStatusChangedEventDto({
        claimId,
        paymentStatus: PaymentStatus.COMPLETED,
      });
      console.log('Publishing to payment-status-changed topic...');
      await this.pubSubService.publishMessage(
        this.PAYMENT_STATUS_CHANGED_TOPIC,
        paymentStatusChangedEventDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Error occured while handling payment completed event !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Get()
  findAll() {
    return this.claimsSettlementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.claimsSettlementService.findOne(+id);
  }
}
