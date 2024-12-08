import { Controller, Logger } from '@nestjs/common';
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

  async createOwner(createOwnerDto: CreateOwnerDto) {
    this.logger.log('CreateOwner method called');
    try {
      return await this.ownerService.create(createOwnerDto);
    } catch (error) {
      this.logger.error('Error in CreateOwner method', error.stack);
      throw error;
    }
  }

  async findAllOwners() {
    this.logger.log('FindAllOwners method called');
    try {
      return await this.ownerService.findAll();
    } catch (error) {
      this.logger.error('Error in FindAllOwners method', error.stack);
      throw error;
    }
  }

  queryOwners(paginationStream: Observable<PaginationDto>): Observable<Owners> {
    this.logger.log('QueryOwners method called');
    try {
      return this.ownerService.queryOwners(paginationStream);
    } catch (error) {
      this.logger.error('Error in QueryOwners method', error.stack);
      throw error;
    }
  }
  // queryOwners(paginationStream: Observable<PaginationDto>): Observable<Owners> {
  //   return this.queryOwners(paginationStream);
  // }
}
