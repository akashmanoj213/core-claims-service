import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { CreateOwnerDto } from '@app/common-library';

@Controller('owner')
export class OwnerController {
  private readonly logger = new Logger(OwnerController.name);

  constructor(private readonly ownerService: OwnerService) {}

  @Get()
  async findAll() {
    try {
      this.logger.log('Finding all owners');
      return await this.ownerService.findAllOwners();
    } catch (error) {
      this.logger.error('Error finding all owners', error.stack);
      throw error;
    }
  }

  @Post('query-owners')
  async queryAllOwners() {
    try {
      return await this.ownerService.queryOwners();
    } catch (error) {
      this.logger.error('Error querying all owners', error.stack);
      throw error;
    }
  }

  @Post()
  async create(@Body() createOwnerDto: CreateOwnerDto) {
    try {
      return await this.ownerService.createOwner(createOwnerDto);
    } catch (error) {
      this.logger.error('Error creating owner', error.stack);
      throw error;
    }
  }
}
