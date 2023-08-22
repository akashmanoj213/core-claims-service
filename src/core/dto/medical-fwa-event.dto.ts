import { IsBoolean, IsInt, IsString } from 'class-validator';

export class MedicalFWAEventDto {
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

  constructor(init?: MedicalFWAEventDto) {
    Object.assign(this, init);
  }
}
