import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClaimsModule } from './claims/claims.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsAdjudicationModule } from './claims-adjudication/claims-adjudication.module';
import { CamundaClientService } from './core/providers/camunda-client/camunda-client.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      //host: '/cloudsql/pruinhlth-nprd-dev-scxlyx-7250:asia-south1:sahi-dev',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      // username: 'sahi-user',
      // password: 'qwerty',
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'Claims',
      synchronize: true,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      //host: '/cloudsql/pruinhlth-nprd-dev-scxlyx-7250:asia-south1:sahi-dev',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      // username: 'sahi-user',
      // password: 'qwerty',
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'Claims-Adjudication',
      name: 'claims-adjudication',
      synchronize: true,
      autoLoadEntities: true,
    }),
    ClaimsModule,
    ClaimsAdjudicationModule,
  ],
  controllers: [AppController],
  providers: [AppService, CamundaClientService],
})
export class AppModule {}
