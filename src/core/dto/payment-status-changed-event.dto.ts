import { IsEnum, IsInt } from 'class-validator';
import { PaymentStatus } from '../enums';

export class PaymentStatusChangedEventDto {
  @IsInt()
  claimId: number;
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  constructor(init: PaymentStatusChangedEventDto) {
    Object.assign(this, init);
  }
}
