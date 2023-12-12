import { IsEnum, IsInt, IsNumber, IsString } from 'class-validator';
import { ClaimStatus, ClaimType } from '../enums';
import { Type } from 'class-transformer';

export class ClaimApprovedEventDto {
  @IsInt()
  claimId: number;
  @IsEnum(ClaimType)
  claimType: ClaimType;
  @IsEnum(ClaimStatus)
  claimStatus: ClaimStatus;
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

  constructor(init?: ClaimApprovedEventDto) {
    Object.assign(this, init);
  }
}
