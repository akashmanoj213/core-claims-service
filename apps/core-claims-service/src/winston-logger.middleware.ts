import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as lw from '@google-cloud/logging-winston';
import * as winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

Injectable();
export class GoogleCloudLoggingMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const loggingWinston = new LoggingWinston();
    const logger = winston.createLogger({
      level: 'info',
      transports:
        process.env.NODE_ENV === 'local'
          ? [new winston.transports.Console()]
          : [loggingWinston],
    });
    const mw = await lw.express.makeMiddleware(logger);
    mw(req, res, next);
  }
}
