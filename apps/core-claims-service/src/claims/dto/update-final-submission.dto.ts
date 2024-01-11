import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { MedicalBillDetailsDto } from './medical-bill-details.dto';

export class UpdateFinalSubmissionDto {
  @ValidateNested()
  @Type(() => MedicalBillDetailsDto)
  medicalBillDetails?: MedicalBillDetailsDto[];
}
