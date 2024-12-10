/*instrumentation.ts*/
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import {
  ConsoleLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import * as logsAPI from '@opentelemetry/api-logs';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

export function initializeOtelSdk(serviceName: string) {
  // const otelSdk = new NodeSDK({
  //   resource: new Resource({
  //     [ATTR_SERVICE_NAME]: serviceName,
  //     [ATTR_SERVICE_VERSION]: '1.0',
  //   }),
  //   traceExporter: new ConsoleSpanExporter(),
  //   instrumentations: [
  //     new HttpInstrumentation(),
  //     new ExpressInstrumentation({
  //       ignoreLayersType: [
  //         ExpressLayerType.MIDDLEWARE,
  //         ExpressLayerType.ROUTER,
  //         ExpressLayerType.REQUEST_HANDLER,
  //       ],
  //     }),
  //   ],
  // });

  // const otelSdk = new NodeSDK({
  //   resource: new Resource({
  //     [ATTR_SERVICE_NAME]: serviceName,
  //     [ATTR_SERVICE_VERSION]: '1.0',
  //   }),
  //   traceExporter: new ConsoleSpanExporter(),
  //   logRecordProcessor: new logs.SimpleLogRecordProcessor(
  //     new logs.ConsoleLogRecordExporter(),
  //   ),
  //   instrumentations: [
  //     new NestInstrumentation(),
  //     new HttpInstrumentation(),
  //     new WinstonInstrumentation(),
  //   ],
  // });

  const tracerProvider = new NodeTracerProvider();
  tracerProvider.register();

  // To start a logger, you first need to initialize the Logger provider.
  const loggerProvider = new LoggerProvider();
  // Add a processor to export log record
  loggerProvider.addLogRecordProcessor(
    new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()),
  );
  logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

  registerInstrumentations({
    instrumentations: [
      new ExpressInstrumentation(),
      new HttpInstrumentation(),
      new WinstonInstrumentation(),
    ],
  });

  // process.on('SIGTERM', () => {
  //   otelSdk
  //     .shutdown()
  //     .then(
  //       () => console.log('SDK shut down successfully'),
  //       (err) => console.log('Error shutting down SDK', err.message),
  //     )
  //     .finally(() => process.exit(0));
  // });

  // return otelSdk;
}
