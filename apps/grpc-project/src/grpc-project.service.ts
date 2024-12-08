import { Injectable } from '@nestjs/common';

@Injectable()
export class GrpcProjectService {
  getHello(): string {
    return 'Hello World!';
  }
}
