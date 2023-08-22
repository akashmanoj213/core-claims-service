import { IsInt, IsString } from 'class-validator';

export class NonMedicalAdjEventDto {
  @IsInt()
  claimItemId: number;
  @IsString()
  overallComment: string;

  constructor(init?: NonMedicalAdjEventDto) {
    Object.assign(this, init);
  }
}
