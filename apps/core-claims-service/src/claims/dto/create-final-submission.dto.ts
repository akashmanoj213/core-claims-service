import { IsNumber, ValidateNested } from 'class-validator';
import { MedicalBillDetailsDto } from './medical-bill-details.dto';
import { Type } from 'class-transformer';

export class CreateFinalSubmissionDto {
  @IsNumber()
  remainingAmount: number;
  @ValidateNested()
  @Type(() => MedicalBillDetailsDto)
  medicalBillDetails?: MedicalBillDetailsDto[];
}
