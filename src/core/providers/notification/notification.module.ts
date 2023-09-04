import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PubSubModule } from '../pub-sub/pub-sub.module';

@Module({
  imports: [PubSubModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
