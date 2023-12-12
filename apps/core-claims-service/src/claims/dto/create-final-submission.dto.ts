import { IsNumber } from 'class-validator';

export class CreateFinalSubmissionDto {
  @IsNumber()
  remainingAmount: number;
}
