import { Controller, Get, Logger } from '@nestjs/common';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  @Get()
  test(): string {
    this.logger.log('info: controller log');
    this.logger.warn('warn: controller log');

    return 'Core claims service is online...';
  }
}
