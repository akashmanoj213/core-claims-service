import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { ClaimsModule } from './claims/claims.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { WinstonLoggerModule } from '@app/winston-logger';
import { GoogleCloudLoggingMiddleware } from './winston-logger.middleware';

@Module({
  imports: [
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
    WinstonLoggerModule,
  ],
  controllers: [AppController],
  providers: [GoogleCloudLoggingMiddleware],
})
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(GoogleCloudLoggingMiddleware).forRoutes('*');
//   }
// }
export class AppModule {}
