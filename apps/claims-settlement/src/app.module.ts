import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { ClaimsSettlementModule } from './claims-settlement/claims-settlement.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
