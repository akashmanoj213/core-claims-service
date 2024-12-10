import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ClaimsModule } from './claims/claims.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          level: process.env.LOG_LEVEL || 'info',
          transport:
            process.env.NODE_ENV !== 'production'
              ? { target: 'pino-pretty' }
              : undefined,
        },
      }),
    }),
    ConfigModule.forRoot({ envFilePath: 'apps/core-claims-service/.env' }),
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
    ClaimsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
