import { IsBoolean, IsInt, IsString } from 'class-validator';

export class MedicalFWACompletedEventDto {
  @IsInt()
  claimId: number;
  @IsInt()
  claimItemId: number;
  @IsString()
  medicalFWAResult: string;
  @IsString()
  medicalFWAReason: string;
  @IsBoolean()
  isFailure = false;

  constructor(init?: MedicalFWACompletedEventDto) {
    Object.assign(this, init);
  }
}
