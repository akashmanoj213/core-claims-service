import { IsInt, IsString } from 'class-validator';

export class NonMedicalAdjEventCompletedDto {
  @IsInt()
  claimItemId: number;
  @IsString()
  overallComment: string;

  constructor(init?: NonMedicalAdjEventCompletedDto) {
    Object.assign(this, init);
  }
}
