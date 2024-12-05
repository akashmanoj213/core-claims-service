import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClaimSettlement } from './entities/claim-settlement.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ClaimType, ClaimApprovedEventDto } from '@app/common-dto';

@Injectable()
export class ClaimsSettlementService {
  constructor(
    @InjectRepository(ClaimSettlement, 'claims-settlement')
    private claimSettlementRepository: Repository<ClaimSettlement>,
    private httpService: HttpService,
  ) {}

  async initiatePayment(claimApprovedEventDto: ClaimApprovedEventDto) {
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
        `${process.env.MOCK_SERVICE_BASE_URL}/payment/initiate`,
        initiatePaymentDto,
      ),
    );
    console.log(`Payment initiated! paymentId: ${paymentId}.`);

    return paymentId as number;
  }

  async completePayment(claimSettlement: ClaimSettlement) {
    claimSettlement.completePayment();

    const result = await this.claimSettlementRepository.save(claimSettlement);
    console.log(`Payment completed and claim settlement data updated.`);

    return result;
  }

  async save(claimSettlment: ClaimSettlement) {
    const result = await this.claimSettlementRepository.save(claimSettlment);
    console.log(
      `Claim Item settlement saved! ClaimSettlementId: ${result.id}.`,
    );

    return result;
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

  async getTestResponse() {
    console.log('Service: claim settlement working fine...');
    return 'Claim settlement working fine...';
  }
}
