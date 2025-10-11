/**
 * Enhanced Telemetry Service for ODAVL Studio
 */

import * as vscode from 'vscode';
import { LoggingService } from './LoggingService';
import { ConfigurationService } from './ConfigurationService';

export class TelemetryService {
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigurationService
    ) {}

    async initialize(): Promise<void> {
        this.loggingService.info('TelemetryService initialized');
    }

    trackEvent(eventName: string, properties?: Record<string, any>): void {
        if (this.configService.getConfiguration().enableTelemetry) {
            this.loggingService.debug('Telemetry event tracked', { eventName, properties });
        }
    }

    async dispose(): Promise<void> {
        this.loggingService.debug('TelemetryService disposed');
    }
}