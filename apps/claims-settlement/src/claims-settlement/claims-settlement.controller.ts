import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClaimsSettlementService } from './claims-settlement.service';
import {
  ClaimApprovedEventDto,
  PubSubMessageDto,
  PaymentStatusChangedEventDto,
  PaymentStatus,
  ClaimRejectedEventDto,
} from '@app/common-dto';
import { PubSubService, NotificationService } from '@app/common-services';
import { ClaimSettlement } from './entities/claim-settlement.entity';
import { PaymentCompletedEventDto } from './dto/payment-completed-event.dto';
import { PasClaimSettlementSyncDto } from './dto/pas-claim-settlement-sync.dto';
import { TextMessageTemplate } from '@app/common-classes';

@Controller('claims-settlement')
export class ClaimsSettlementController {
  private readonly PAYMENT_STATUS_CHANGED_TOPIC = 'payment-status-changed';
  private readonly PAS_CLAIM_SETTLEMENT_SYNC_TOPIC =
    'pas-claim-settlement-sync';

  constructor(
    private pubSubService: PubSubService,
    private readonly claimsSettlementService: ClaimsSettlementService,
    private notificationService: NotificationService,
  ) {}

  @Post('claim-approved-handler')
  async claimApprovedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Claim approved hanlder invoked.');

    try {
      const claimApprovedEventDto =
        this.pubSubService.formatMessageData<ClaimApprovedEventDto>(
          pubSubMessage,
          ClaimApprovedEventDto,
        );

      const { approvedPayableAmount, coPayableAmount, contactNumber, claimId } =
        claimApprovedEventDto;

      //check if already executed
      const existingClaimSettlement =
        await this.claimsSettlementService.findOneByClaimId(claimId);
      if (existingClaimSettlement) {
        const { paymentId } = existingClaimSettlement;
        console.log(
          `Payment with ID: ${paymentId} already initiated for claim ID: ${claimId}.`,
        );
        return existingClaimSettlement;
      }

      // Initiate payment
      const paymentId = await this.claimsSettlementService.initiatePayment(
        claimApprovedEventDto,
      );

      const claimSettlement = new ClaimSettlement({
        ...claimApprovedEventDto,
        paymentId,
      });

      const { id: claimSettlementId } = await this.claimsSettlementService.save(
        claimSettlement,
      );

      // notify patient
      const smsBody = `Your claim ID: ${claimId} has been approved. A payment for the amount ${approvedPayableAmount} has been initiated to the hospital.`;
      await this.notificationService.sendSMS(
        contactNumber,
        coPayableAmount
          ? smsBody + ` Please pay the remaining ${coPayableAmount}`
          : smsBody,
      );

      // notify agent
      const textMessageTemplate = new TextMessageTemplate(
        `Claim ID: ${claimId} has been approved. A payment for the amount ${approvedPayableAmount} has been initiated to the hospital.`,
      );
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
      );

      //publish to payment-status-changed-topic
      console.log('Publishing to payment-status-changed topic.');
      const paymentStatusChangedEventDto = new PaymentStatusChangedEventDto({
        claimId,
        paymentStatus: PaymentStatus.PENDING,
      });
      await this.pubSubService.publishMessage(
        this.PAYMENT_STATUS_CHANGED_TOPIC,
        paymentStatusChangedEventDto,
      );

      //Sync to PAS
      await this.syncToPas(claimSettlementId);
    } catch (error) {
      console.log(
        `Error occured while handling claim-approved event ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling claim-approved event !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  @Post('claim-rejected-handler')
  async claimRejectedHandler(@Body() pubSubMessage: PubSubMessageDto) {
    console.log('-------------------  -------------------');
    console.log('Claim rejected hanlder invoked.');

    try {
      const claimRejectedEventDto =
        this.pubSubService.formatMessageData<ClaimRejectedEventDto>(
          pubSubMessage,
          ClaimRejectedEventDto,
        );

      const { contactNumber, approvedPayableAmount, claimId } =
        claimRejectedEventDto;

      // notify patient
      const message =
        approvedPayableAmount == 0
          ? `Unfortunately, your claim ID: ${claimId} has been rejected. Please make your payment at the hospital.`
          : `Your claim ID: ${claimId} has only been partially approved for an amount of ${approvedPayableAmount}. Please pay remaining amount at the hospital.`;

      await this.notificationService.sendSMS(contactNumber, message);

      // notify agent
      const agentMessage =
        approvedPayableAmount == 0
          ? `Claim ID: ${claimId} has been rejected. Patient has to make payment at the hospital.`
          : `Claim ID: ${claimId} has only been partially approved for an amount of ${approvedPayableAmount}. Patient has to pay remaining amount at the hospital.`;
      const textMessageTemplate = new TextMessageTemplate(agentMessage);
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
      );

      // figure out how to make partial payments
    } catch (error) {
      console.log(
        `Error occured while handling claim-rejected event ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling claim-rejected event !',
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
    console.log('Payment completed handler invoked.');
    try {
      const paymentCompletedEventDto =
        this.pubSubService.formatMessageData<PaymentCompletedEventDto>(
          pubSubMessage,
          PaymentCompletedEventDto,
        );

      const { uniqueTransactionId: claimId, paymentId } =
        paymentCompletedEventDto;

      // check if already executed
      const claimSettlement =
        await this.claimsSettlementService.findOneByClaimId(claimId);
      if (claimSettlement.paymentStatus === PaymentStatus.COMPLETED) {
        console.log(`Payment already completed for paymentId: ${paymentId}`);
        return claimSettlement;
      }

      await this.claimsSettlementService.completePayment(claimSettlement);

      const { contactNumber, id: claimSettlementId } = claimSettlement;

      // notify patient
      await this.notificationService.sendSMS(
        contactNumber,
        `The payment for your claim ID: ${claimId} has been completed. Payment transaction ID: ${paymentId}`,
      );

      //notify agent
      const textMessageTemplate = new TextMessageTemplate(
        `The payment for claim ID: ${claimId} has been completed. Payment transaction ID: ${paymentId}`,
      );
      await this.notificationService.sendWhatsappMessage(
        contactNumber,
        textMessageTemplate,
      );

      // publish to payment-status-changed-topic
      console.log('Publishing to payment-status-changed topic.');
      const paymentStatusChangedEventDto = new PaymentStatusChangedEventDto({
        claimId,
        paymentStatus: PaymentStatus.COMPLETED,
      });
      await this.pubSubService.publishMessage(
        this.PAYMENT_STATUS_CHANGED_TOPIC,
        paymentStatusChangedEventDto,
      );

      // sync to PAS
      await this.syncToPas(claimSettlementId);
    } catch (error) {
      console.log(
        `Error occured while handling payment completed event ! Error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Error occured while handling payment completed event !',
        {
          cause: error,
          description: error.message,
        },
      );
    }
  }

  async syncToPas(claimSettlementId: number) {
    console.log('Syncing to PAS claims settlement topic.');

    const pasClaimSettlementSyncDto = new PasClaimSettlementSyncDto(
      claimSettlementId,
    );
    await this.pubSubService.publishMessage(
      this.PAS_CLAIM_SETTLEMENT_SYNC_TOPIC,
      pasClaimSettlementSyncDto,
    );
  }

  @Get()
  findAll() {
    return this.claimsSettlementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.claimsSettlementService.findOne(id);
  }
}
