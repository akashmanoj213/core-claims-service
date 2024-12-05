/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from '@opentelemetry/instrumentation-express';

const otelSdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'claims-adj-service',
    [ATTR_SERVICE_VERSION]: '1.0',
  }),
  traceExporter: new ConsoleSpanExporter(),
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation({
      ignoreLayersType: [
        ExpressLayerType.MIDDLEWARE,
        ExpressLayerType.ROUTER,
        ExpressLayerType.REQUEST_HANDLER,
      ],
    }),
  ],
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
