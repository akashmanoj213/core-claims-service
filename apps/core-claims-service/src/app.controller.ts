import { Controller, Get, Logger } from '@nestjs/common';

@Controller()
export class AppController {
  constructor(private readonly logger: Logger) {}

  @Get('test')
  testEndpoint(): string {
    this.logger.log('info: Test endpoint hit');
    this.logger.warn('warn: Test endpoint hit');
    // this.logger.error('Test endpoint hit');

    return 'Core claims service is online...';
  }

  @Get()
  test(): string {
    return 'Core claims service is online...';
  }
}
