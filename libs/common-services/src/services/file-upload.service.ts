import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import { FileUploadResponseDto } from '@app/common-dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class FileUploadService {
  private readonly documentServiceUrl =
    'https://sahi-document-service-dnhiaxv6nq-el.a.run.app/external/document/upload';

  constructor(private readonly httpService: HttpService) {}

  async uploadFile(
    file: Express.Multer.File,
    config = { params: null, headers: null },
  ): Promise<FileUploadResponseDto> {
    const {
      buffer: fileBuffer,
      originalname: filename,
      mimetype: contentType,
      fieldname,
    } = file;

    const { params = null, headers = null } = config;

    const form = new FormData();
    form.append('document', fileBuffer, {
      filename,
      contentType,
    });

    let result;

    if (process.env.FILE_UPLOAD_ENABLE) {
      result = await lastValueFrom(
        this.httpService.post(this.documentServiceUrl, form, {
          params,
          headers,
        }),
      );
    } else {
      result = {
        data: {
          message: 'File upload skipped',
          fileUrl: 'File upload skipped',
        },
      };
    }

    const { message, fileUrl } = result.data;

    return {
      message,
      fileUrl,
      fieldName: fieldname,
      fileName: filename,
    };
  }
}
