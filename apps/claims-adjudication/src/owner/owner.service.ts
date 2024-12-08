import {
  CreateOwnerDto,
  OWNER_SERVICE_NAME,
  OwnerServiceClient,
  PaginationDto,
} from '@app/common-library';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { GRPC_SERVICE } from './constants';
import { ReplaySubject } from 'rxjs';

@Injectable()
export class OwnerService implements OnModuleInit {
  private ownerServiceClient: OwnerServiceClient;

  constructor(@Inject(GRPC_SERVICE) private client: ClientGrpc) {}

  onModuleInit() {
    this.ownerServiceClient =
      this.client.getService<OwnerServiceClient>(OWNER_SERVICE_NAME);
  }

  createOwner(createOwnerDto: CreateOwnerDto) {
    return this.ownerServiceClient.createOwner(createOwnerDto);
  }

  findAllOwners() {
    return this.ownerServiceClient.findAllOwners({});
  }

  queryOwners() {
    const owners$ = new ReplaySubject<PaginationDto>();

    owners$.next({ page: 0, skip: 2 });
    owners$.next({ page: 1, skip: 2 });
    owners$.next({ page: 2, skip: 2 });
    owners$.next({ page: 3, skip: 2 });
    owners$.next({ page: 4, skip: 2 });

    owners$.complete();

    let chunkNumber = 1;
    this.ownerServiceClient.queryOwners(owners$).subscribe((owners) => {
      console.log(`chunked data: ${chunkNumber}`, owners);
      chunkNumber++;
    });
  }
}
