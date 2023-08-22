import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsInt, IsNumber } from 'class-validator';

export class AccidentDetailsDto {
  @IsBoolean()
  isRTA: boolean;
  @IsDate()
  @Type(() => Date)
  dateOfInjury: Date;
  @IsBoolean()
  isReportedToPolice: boolean;
  @IsInt()
  FIRNumber: number;
  @IsBoolean()
  dueToAlcoholOrSubstanceAbuse: boolean;
  @IsBoolean()
  isTestConducted: boolean;
}
