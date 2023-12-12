import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  test(): string {
    return 'Claims adjudication service is online...';
  }
}
