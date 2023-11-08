import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClaimsModule } from './claims/claims.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimsAdjudicationModule } from './claims-adjudication/claims-adjudication.module';
import { CamundaClientService } from './core/providers/camunda-client/camunda-client.service';
import { ConfigModule } from '@nestjs/config';
import { ClaimsSettlementModule } from './claims-settlement/claims-settlement.module';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        customAttributeKeys: {
          responseTime: 'latency',
        },
      },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'Claims',
      synchronize: true,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'Claims-Adjudication',
      name: 'claims-adjudication',
      synchronize: true,
      autoLoadEntities: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'Claims-Settlement',
      name: 'claims-settlement',
      synchronize: true,
      autoLoadEntities: true,
    }),
    ClaimsModule,
    ClaimsAdjudicationModule,
    ClaimsSettlementModule,
  ],
  controllers: [AppController],
  providers: [AppService, CamundaClientService],
})
export class AppModule {}
