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
  @IsInt()
  rohiniId: number;
}
