import { IsEmail, IsInt, IsString } from 'class-validator';

export class HospitalDetailsDto {
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
  @IsInt()
  rohiniId: number;
}
