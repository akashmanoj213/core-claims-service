import { IsBoolean, IsInt, IsString } from 'class-validator';

export class NonMedicalFWACompletedEventDto {
  @IsInt()
  claimId: number;
  @IsInt()
  claimItemId: number;
  @IsString()
  nonMedicalFWAResult: string;
  @IsString()
  nonMedicalFWAReason: string;
  @IsBoolean()
  isFailure = false;

  constructor(init?: NonMedicalFWACompletedEventDto) {
    Object.assign(this, init);
  }
}
