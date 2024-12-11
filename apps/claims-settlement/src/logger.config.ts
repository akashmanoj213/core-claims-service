import { LoggerOptions } from 'pino';

interface LogRecord {
  trace_id?: string;
  span_id?: string;
  trace_flags?: string;
  [key: string]: unknown;
}

const PinoLevelToSeverityLookup: Record<string, string | undefined> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

export const loggerConfig: LoggerOptions = {
  messageKey: 'message',
  timestamp(): string {
    return `,"timestamp":"${new Date(Date.now()).toISOString()}"`;
  },
  formatters: {
    log(object: LogRecord): Record<string, unknown> {
      const { trace_id, span_id, trace_flags, ...rest } = object;

      return {
        'logging.googleapis.com/trace': trace_id,
        'logging.googleapis.com/spanId': span_id,
        'logging.googleapis.com/trace_sampled': trace_flags
          ? trace_flags === '01'
          : undefined,
        ...rest,
      };
    },
    level(label: string) {
      return {
        severity:
          PinoLevelToSeverityLookup[label] ?? PinoLevelToSeverityLookup['info'],
      };
    },
  },
};
