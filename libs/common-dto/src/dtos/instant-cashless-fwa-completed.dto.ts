import { IsInt, IsString } from 'class-validator';

export class InstantCashlessFWACompletedEventDto {
  @IsInt()
  claimId: number;
  @IsInt()
  claimItemId: number;
  @IsString()
  medicalFWAResult: string;
  @IsString()
  medicalFWAReason: string;
  @IsString()
  nonMedicalFWAResult: string;
  @IsString()
  nonMedicalFWAReason: string;

  constructor(init?: InstantCashlessFWACompletedEventDto) {
    Object.assign(this, init);
  }
}
