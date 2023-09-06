import { IsInt, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class InitiatePaymentDto {
  @IsInt()
  uniqueTransactionId: number;
  @IsString()
  requestedBy: string;
  @IsNumber()
  @Type(() => Number)
  amount: number;
  @IsString()
  accountNumber: string;
  @IsString()
  ifscCode: string;
  @IsString()
  accountName: string;

  constructor(init?: Partial<InitiatePaymentDto>) {
    Object.assign(this, init);
  }
}
