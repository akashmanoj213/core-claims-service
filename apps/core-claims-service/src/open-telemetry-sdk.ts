/*instrumentation.ts*/
import { NodeSDK, core, tracing } from '@opentelemetry/sdk-node';
import { diag, DiagConsoleLogger } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import {
  ConsoleLogRecordExporter,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import {
  getNodeAutoInstrumentations,
  getResourceDetectors,
} from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

export function initializeOtelSdk(serviceName: string) {
  diag.setLogger(new DiagConsoleLogger(), core.getEnv().OTEL_LOG_LEVEL);

  const otelSdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: '1.0',
    }),
    // traceExporter: new tracing.InMemorySpanExporter(),
    spanProcessor: new tracing.BatchSpanProcessor(
      new tracing.ConsoleSpanExporter(),
    ),
    // logRecordProcessors: [
    //   new BatchLogRecordProcessor(new ConsoleLogRecordExporter()),
    // ],
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    otelSdk.start();
    diag.info('OpenTelemetry automatic instrumentation started successfully');
  } catch (error) {
    diag.error(
      'Error initializing OpenTelemetry SDK. Your application is not instrumented and will not produce telemetry',
      error,
    );
  }

  async function shutdown(): Promise<void> {
    try {
      await otelSdk.shutdown();
      diag.debug('OpenTelemetry SDK terminated');
    } catch (error) {
      diag.error('Error terminating OpenTelemetry SDK', error);
    }
  }

  // Gracefully shutdown SDK if a SIGTERM is received
  process.on('SIGTERM', shutdown);
  // Gracefully shutdown SDK if Node.js is exiting normally
  process.once('beforeExit', shutdown);

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
