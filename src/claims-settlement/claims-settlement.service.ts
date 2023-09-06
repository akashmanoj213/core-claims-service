import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClaimSettlement } from './entities/claim-settlement.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ClaimType } from 'src/core/enums';
import { ClaimApprovedEventDto } from 'src/core/dto/claim-approved-event.dto';

@Injectable()
export class ClaimsSettlementService {
  private readonly MOCK_SERVICE_BASE_URL =
    'https://mock-service-dnhiaxv6nq-el.a.run.app';
  // 'http://localhost:8080';

  constructor(
    @InjectRepository(ClaimSettlement, 'claims-settlement')
    private claimSettlementRepository: Repository<ClaimSettlement>,
    private httpService: HttpService,
  ) {}

  async initiatePayment(claimApprovedEventDto: ClaimApprovedEventDto) {
    console.log('Initiating payment...');

    const {
      approvedPayableAmount,
      bankAccountName,
      bankAccountNumber,
      bankIfscCode,
      claimId,
      claimType,
    } = claimApprovedEventDto;

    const initiatePaymentDto = new InitiatePaymentDto({
      uniqueTransactionId: claimId,
      requestedBy:
        claimType === ClaimType.CASHLESS
          ? 'cashless claim'
          : 'reimbursement claim',
      accountName: bankAccountName,
      accountNumber: bankAccountNumber,
      amount: approvedPayableAmount,
      ifscCode: bankIfscCode,
    });

    const { data: paymentId } = await firstValueFrom(
      this.httpService.post(
        `${this.MOCK_SERVICE_BASE_URL}/payment/initiate`,
        initiatePaymentDto,
      ),
    );

    return paymentId as number;
  }

  async completePayment(claimSettlement: ClaimSettlement) {
    console.log('Updating payment to completed...');

    claimSettlement.completePayment();

    await this.claimSettlementRepository.save(claimSettlement);
  }

  save(claimSettlment: ClaimSettlement) {
    console.log('Saving claim settlement data...');
    return this.claimSettlementRepository.save(claimSettlment);
  }

  findAll() {
    return this.claimSettlementRepository.find();
  }

  findOne(id: number) {
    return this.claimSettlementRepository.findOneBy({ id });
  }

  findOneByClaimId(claimId: number) {
    return this.claimSettlementRepository.findOne({ where: { claimId } });
  }
}
