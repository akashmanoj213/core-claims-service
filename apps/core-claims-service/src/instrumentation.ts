/*instrumentation.ts*/
import { api, logs, NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import {
  detectResourcesSync,
  envDetectorSync,
  hostDetectorSync,
  processDetectorSync,
  Resource,
} from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import {
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import * as logsAPI from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

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

  const logExporter = new OTLPLogExporter();
  const loggerProvider = new LoggerProvider({
    // without resource we don't have proper service.name, service.version correlated with logs
    resource: detectResourcesSync({
      // this have to be manually adjusted to match SDK OTEL_NODE_RESOURCE_DETECTORS
      detectors: [envDetectorSync, processDetectorSync, hostDetectorSync],
    }),
  });

  loggerProvider.addLogRecordProcessor(
    new BatchLogRecordProcessor(logExporter),
    // new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
  );
  logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

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
