import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { ClaimsSettlementModule } from './claims-settlement/claims-settlement.module';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: 'apps/claims-settlement/.env' }),
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
    ClaimsSettlementModule,
    LoggerModule.forRoot({
      pinoHttp: loggerConfig,
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
