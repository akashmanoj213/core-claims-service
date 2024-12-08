import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { CreateOwnerDto } from '@app/common-library';

@Controller('owner')
export class OwnerController {
  private readonly logger = new Logger(OwnerController.name);

  constructor(private readonly ownerService: OwnerService) {}

  @Get()
  findAll() {
    this.logger.log('Finding all owners');
    return this.ownerService.findAllOwners();
  }

  @Post('query-owners')
  queryAllOwners() {
    return this.ownerService.queryOwners();
  }

  @Post()
  create(@Body() createOwnerDto: CreateOwnerDto) {
    return this.ownerService.createOwner(createOwnerDto);
  }
}
