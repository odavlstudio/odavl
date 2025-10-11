/**
 * Enhanced Notification Service for ODAVL Studio
 */

import { LoggingService } from './LoggingService';

export class NotificationService {
    constructor(private readonly loggingService: LoggingService) {}

    async initialize(): Promise<void> {
        this.loggingService.info('NotificationService initialized');
    }
}