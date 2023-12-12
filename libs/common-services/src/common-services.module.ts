import { Module } from '@nestjs/common';
import { PubSubService } from './services/pub-sub.service';
import { NotificationService } from './services/notification.service';
import { FileUploadService } from './services/file-upload.service';
import { CamundaClientService } from './services/camunda-client.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [
    PubSubService,
    NotificationService,
    FileUploadService,
    CamundaClientService,
  ],
  exports: [
    PubSubService,
    NotificationService,
    FileUploadService,
    CamundaClientService,
  ],
})
export class CommonServicesModule {}
