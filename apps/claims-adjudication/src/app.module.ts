import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { ClaimsAdjudicationModule } from './claims-adjudication/claims-adjudication.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: 'apps/claims-adjudication/.env' }),
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
    ClaimsAdjudicationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
