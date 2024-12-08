import { Controller, Logger } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { OwnerService } from './owner.service';
import {
  CreateOwnerDto,
  Owners,
  OwnerServiceController,
  OwnerServiceControllerMethods,
  PaginationDto,
} from '@app/common-library';
import { Observable } from 'rxjs';

@Controller()
@OwnerServiceControllerMethods()
export class OwnerController implements OwnerServiceController {
  private readonly logger = new Logger(OwnerController.name);
  constructor(private readonly ownerService: OwnerService) {}

  createOwner(createOwnerDto: CreateOwnerDto) {
    this.logger.log('CreateOwner method called');
    return this.ownerService.create(createOwnerDto);
  }

  findAllOwners() {
    this.logger.log('FindAllOwners method called');
    return this.ownerService.findAll();
  }

  queryOwners(paginationStream: Observable<PaginationDto>): Observable<Owners> {
    this.logger.log('queryOwners method called');
    return this.queryOwners(paginationStream);
  }
}
