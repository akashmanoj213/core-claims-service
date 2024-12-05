import { LoggingWinston } from '@google-cloud/logging-winston';
import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const loggingWinston = new LoggingWinston();
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        }),
      ),
      transports:
        process.env.NODE_ENV === 'local'
          ? [new winston.transports.Console()]
          : [loggingWinston],
    });
  }

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(message, ...optionalParams);
  }

  fatal(message: any, ...optionalParams: any[]) {
    this.logger.log('fatal', message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logger.verbose(message, ...optionalParams);
  }
}
