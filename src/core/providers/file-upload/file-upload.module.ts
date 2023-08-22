import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';

@Module({
  imports: [HttpModule],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
