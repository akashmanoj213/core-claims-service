import { IsString } from 'class-validator';

export class FileUploadResponseDto {
  @IsString()
  message: string;
  @IsString()
  fileUrl: string;
}
