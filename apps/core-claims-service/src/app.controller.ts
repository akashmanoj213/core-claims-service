import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  test(): string {
    return 'Core claims service is online...';
  }
}
