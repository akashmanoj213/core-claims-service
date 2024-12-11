import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as lw from '@google-cloud/logging-winston';
import * as winston from 'winston';

Injectable();
export class GoogleCloudLoggingMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const logger = winston.createLogger({
      level: 'info',
      transports: [new winston.transports.Console()],
    });
    const mw = await lw.express.makeMiddleware(logger);
    mw(req, res, next);
  }
}
