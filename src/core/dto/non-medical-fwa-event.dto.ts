import { IsBoolean, IsInt, IsString } from 'class-validator';

export class NonMedicalFWAEventDto {
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

  constructor(init?: NonMedicalFWAEventDto) {
    Object.assign(this, init);
  }
}
