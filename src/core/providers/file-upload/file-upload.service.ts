import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { FileUploadResponseDto } from 'src/core/dto/file-upload-response.dto';

@Injectable()
export class FileUploadService {
  private readonly documentServiceUrl =
    'https://sahi-document-service-dnhiaxv6nq-el.a.run.app/external/document/upload';

  constructor(private readonly httpService: HttpService) {}

  async uploadFile(
    file: Express.Multer.File,
    config = { params: null, headers: null },
  ): Promise<FileUploadResponseDto> {
    const { buffer: fileBuffer } = file;

    const { params = null, headers = null } = config;

    const form = new FormData();
    form.append('document', fileBuffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    const result = await lastValueFrom(
      this.httpService.post(this.documentServiceUrl, form, { params, headers }),
    );

    return result.data;
  }
}
