import { IsEmail, IsInt, IsString } from 'class-validator';

export class TpaHospitalDetailsDto {
  @IsInt()
  hospitalId: number;
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
}
