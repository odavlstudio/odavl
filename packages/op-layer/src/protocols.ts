/**
 * ODAVL Protocol Layer - Inter-Product Communication Protocols
 * These protocols ensure products communicate without direct coupling
 */

// Re-export analysis protocol (new implementation)
export * from './protocols/analysis.js';

// Re-export adapter registry (ROUND 11: Global registry fix)
export { AdapterRegistry } from './protocols/registry.js';

// Re-export pattern memory protocol (new implementation)
export * from './protocols/pattern-memory.js';

// Re-export guardian protocol (Phase 3A)
export * from './protocols/guardian.js';

// ============================================================================
// Bridge Protocol (Cross-Product Events)
// ============================================================================

export type EventType = 
  | 'analysis.started'
  | 'analysis.completed'
  | 'recipe.executed'
  | 'test.completed'
  | 'error.detected';

export interface BridgeEvent {
  type: EventType;
  productId: 'insight' | 'autopilot' | 'guardian';
  timestamp: Date;
  payload: unknown;
}

export class BridgeProtocol {
  private static listeners = new Map<EventType, Array<(event: BridgeEvent) => void>>();

  /**
   * Emit event to other products
   */
  static emit(event: BridgeEvent): void {
    const handlers = this.listeners.get(event.type) || [];
    handlers.forEach(handler => handler(event));
  }

  /**
   * Listen for events from other products
   */
  static on(eventType: EventType, handler: (event: BridgeEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  static off(eventType: EventType, handler: (event: BridgeEvent) => void): void {
    const handlers = this.listeners.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }
}

// ============================================================================
// Handoff Protocol (Generic Data Transfer)
// ============================================================================

export interface Handoff<T = unknown> {
  from: string;
  to: string;
  data: T;
  timestamp: Date;
  signature?: string;
}

export class HandoffProtocol {
  /**
   * Create handoff from one product to another
   */
  static create<T>(from: string, to: string, data: T): Handoff<T> {
    return {
      from,
      to,
      data,
      timestamp: new Date(),
    };
  }

  /**
   * Validate handoff integrity
   */
  static validate<T>(handoff: Handoff<T>): boolean {
    return (
      typeof handoff.from === 'string' &&
      typeof handoff.to === 'string' &&
      handoff.timestamp instanceof Date &&
      handoff.data !== undefined
    );
  }
}
