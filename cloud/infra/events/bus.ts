/**
 * Cloud Event Bus
 * Publish/Subscribe system for asynchronous communication
 */
import type { CloudEvent } from '../../shared/types/index.js';
import { cloudLogger } from '../../shared/utils/index.js';

export type EventHandler = (event: CloudEvent) => void | Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
    cloudLogger('debug', 'Event subscription added', { eventType });
  }

  async publish(event: CloudEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    cloudLogger('info', 'Event published', { eventType: event.type, handlerCount: handlers.length });

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error: unknown) {
        cloudLogger('error', 'Event handler failed', { eventType: event.type, error });
      }
    }
  }
}

export const eventBus = new EventBus();
