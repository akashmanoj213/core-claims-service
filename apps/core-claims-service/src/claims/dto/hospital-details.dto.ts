import { IsBoolean, IsEmail, IsInt, IsString } from 'class-validator';

export class HospitalDetailsDto {
  @IsInt()
  id?: number;
  @IsString()
  hospitalName: string;
  @IsString()
  hospitalLocation: string;
  @IsString()
  hospitalPincode: string;
  @IsEmail()
  hospitalEmailId: string;
  @IsString()
  bankAccountNumber: string;
  @IsString()
  bankIfscCode: string;
  @IsString()
  bankAccountName: string;
  @IsInt()
  rohiniId: number;
  @IsBoolean()
  isInstantCashless: boolean;
}
