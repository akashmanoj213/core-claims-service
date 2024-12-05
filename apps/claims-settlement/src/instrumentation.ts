/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

const otelSdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'claims-settlement',
    [ATTR_SERVICE_VERSION]: '1.0',
  }),
  traceExporter: new ConsoleSpanExporter(),
  //   metricReader: new PeriodicExportingMetricReader({
  //     exporter: new ConsoleMetricExporter(),
  //   }),
  //   instrumentations: [getNodeAutoInstrumentations()],
  instrumentations: [new HttpInstrumentation()],
});

process.on('SIGTERM', () => {
  otelSdk
    .shutdown()
    .then(
      () => console.log('SDK shut down successfully'),
      (err) => console.log('Error shutting down SDK', err.message),
    )
    .finally(() => process.exit(0));
});

export { otelSdk };
// otelSdk.start();
