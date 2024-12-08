import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  CreateOwnerDto,
  Owner,
  Owners,
  PaginationDto,
} from '@app/common-library';
import { randomUUID } from 'crypto';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class OwnerService implements OnModuleInit {
  private readonly owners: Owner[] = [];

  onModuleInit() {
    for (let i = 0; i < 10; i++) {
      this.create({
        username: `owner${i}`,
        password: `password${i}`,
        age: i * 10,
      });
    }
  }

  create(createOwnerDto: CreateOwnerDto): Owner {
    const owner = {
      id: randomUUID(),
      ...createOwnerDto,
      subscribed: false,
      socialMedia: {
        twitterUrl: 'https://twitter.com/',
      },
    };

    this.owners.push(owner);
    return owner;
  }

  findAll(): Owners {
    return { owners: this.owners };
  }

  queryOwners(paginationStream: Observable<PaginationDto>): Observable<Owners> {
    const subject = new Subject<Owners>();

    const onNext = (paginationDto: PaginationDto) => {
      const { page, skip } = paginationDto;
      const start = skip * page;
      subject.next({
        owners: this.owners.slice(start, start + skip),
      });
    };

    const onComplete = () => {
      subject.complete();
    };

    paginationStream.subscribe({
      next: onNext,
      complete: onComplete,
    });

    return subject.asObservable();
  }
}
