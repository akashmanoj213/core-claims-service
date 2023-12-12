import { IsNumber } from 'class-validator';

export class CreateEnhancementDto {
  @IsNumber()
  enhancementAmount: number;
}
