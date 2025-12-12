/**
 * Event bus types
 */
import type { CloudEvent as BaseCloudEvent } from '../../shared/types/index.js';

export type CloudEvent = BaseCloudEvent;

export interface EventSubscription {
  id: string;
  eventType: string;
  createdAt: string;
}
