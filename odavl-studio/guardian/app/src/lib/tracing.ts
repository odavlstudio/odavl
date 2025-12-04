/**
 * OpenTelemetry Tracing Configuration
 * Distributed tracing for monitoring and debugging
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import logger from '@/lib/logger';

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry SDK
 */
export function initializeTracing() {
    if (sdk) {
        logger.warn('OpenTelemetry SDK already initialized');
        return sdk;
    }

    try {
        // Configure OTLP trace exporter
        const traceExporter = new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
            headers: {
                // Add authentication if needed
                ...(process.env.OTEL_EXPORTER_OTLP_HEADERS && {
                    Authorization: process.env.OTEL_EXPORTER_OTLP_HEADERS,
                }),
            },
        });

        // Initialize SDK with auto-instrumentations
        sdk = new NodeSDK({
            serviceName: process.env.OTEL_SERVICE_NAME || 'guardian-api',
            traceExporter,
            instrumentations: [
                getNodeAutoInstrumentations({
                    // Configure auto-instrumentations
                    '@opentelemetry/instrumentation-http': {
                        enabled: true,
                    },
                    '@opentelemetry/instrumentation-express': {
                        enabled: true,
                    },
                    '@opentelemetry/instrumentation-pg': {
                        enabled: true,
                    },
                }),
            ],
        });

        // Start the SDK
        sdk.start();
        logger.info('OpenTelemetry tracing initialized', {
            serviceName: process.env.OTEL_SERVICE_NAME || 'guardian-api',
            endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            try {
                await sdk?.shutdown();
                logger.info('OpenTelemetry SDK shut down successfully');
            } catch (error) {
                logger.error('Error shutting down OpenTelemetry SDK', { error });
            }
        });

        return sdk;
    } catch (error) {
        logger.error('Failed to initialize OpenTelemetry tracing', { error });
        return null;
    }
}

/**
 * Shutdown OpenTelemetry SDK
 */
export async function shutdownTracing() {
    if (sdk) {
        try {
            await sdk.shutdown();
            sdk = null;
            logger.info('OpenTelemetry SDK shut down');
        } catch (error) {
            logger.error('Failed to shutdown OpenTelemetry SDK', { error });
        }
    }
}

/**
 * Get current SDK instance
 */
export function getTracingSDK(): NodeSDK | null {
    return sdk;
}

export default {
    initializeTracing,
    shutdownTracing,
    getTracingSDK,
};
