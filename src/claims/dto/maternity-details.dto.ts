import { Type } from 'class-transformer';
import { IsInt, IsDate } from 'class-validator';

export class MaternityDetailsDto {
  @IsInt()
  gravidaValue: number;
  @IsInt()
  paraValue: number;
  @IsInt()
  liveValue: number;
  @IsInt()
  abortionValue: number;
  @IsDate()
  @Type(() => Date)
  expectedDateOfDelivery: Date;
}
