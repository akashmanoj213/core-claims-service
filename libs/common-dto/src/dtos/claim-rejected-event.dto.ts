import { IsEnum, IsInt, IsNumber, IsString } from 'class-validator';
import { ClaimType } from '../enums';
import { Type } from 'class-transformer';

export class ClaimRejectedEventDto {
  @IsInt()
  claimId: number;
  @IsEnum(ClaimType)
  claimType: ClaimType;
  @IsString()
  contactNumber: string;
  @IsNumber()
  @Type(() => Number)
  approvedPayableAmount: number;
  @IsNumber()
  @Type(() => Number)
  coPayableAmount: number;
  @IsString()
  bankAccountNumber: string;
  @IsString()
  bankIfscCode: string;
  @IsString()
  bankAccountName: string;

  constructor(init?: ClaimRejectedEventDto) {
    Object.assign(this, init);
  }
}
