import { IsInt } from 'class-validator';

export class PaymentCompletedEventDto {
  @IsInt()
  paymentId: number;
  @IsInt()
  uniqueTransactionId: number;
}
