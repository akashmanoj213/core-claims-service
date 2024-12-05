import { Module } from '@nestjs/common';
import { PubSubService } from './services/pub-sub.service';
import { NotificationService } from './services/notification.service';
import { FileUploadService } from './services/file-upload.service';
import { CamundaClientService } from './services/camunda-client.service';
import { HttpModule } from '@nestjs/axios';
import { WinstonLoggerService } from './services/winston-logger.service';

@Module({
  imports: [HttpModule],
  providers: [
    PubSubService,
    NotificationService,
    FileUploadService,
    CamundaClientService,
    WinstonLoggerService,
  ],
  exports: [
    PubSubService,
    NotificationService,
    FileUploadService,
    CamundaClientService,
    WinstonLoggerService,
  ],
})
export class CommonServicesModule {}
