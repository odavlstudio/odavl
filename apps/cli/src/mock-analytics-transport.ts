/**
 * ODAVL Wave 10 - Mock Analytics Transport
 * 
 * In-memory transport for testing real-time analytics without WebSocket servers.
 * Eliminates timeouts and provides reliable test execution.
 * 
 * @version 1.0.0
 * @author ODAVL Developer Experience System
 * @created 2025-10-11
 */

import { EventEmitter } from 'events';
import type { QualityUpdatePayload } from './realtime-analytics.js';

/**
 * Mock transport configuration
 */
export interface MockTransportConfig {
  maxConnections?: number;
  heartbeatInterval?: number;
  alertThresholds?: {
    qualityScoreMin?: number;
    eslintWarningsMax?: number;
    typeErrorsMax?: number;
    buildFailureRate?: number;
  };
}

/**
 * Mock client connection for testing
 */
export class MockClient extends EventEmitter {
  public readonly id: string;
  public readonly room: string;
  public connected: boolean = true;

  constructor(id: string, room: string = 'default') {
    super();
    this.id = id;
    this.room = room;
  }

  send(data: any): void {
    if (!this.connected) return;
    this.emit('message', data);
  }

  disconnect(): void {
    this.connected = false;
    this.emit('disconnect');
  }
}

/**
 * Mock analytics transport for testing
 */
export class MockAnalyticsTransport extends EventEmitter {
  private clients = new Map<string, MockClient>();
  private rooms = new Map<string, Set<string>>();
  private config: MockTransportConfig;
  private running = false;

  constructor(config: MockTransportConfig = {}) {
    super();
    this.config = {
      maxConnections: 100,
      heartbeatInterval: 5000,
      ...config
    };
  }

  async start(): Promise<void> {
    this.running = true;
    this.emit('started');
  }

  async stop(): Promise<void> {
    this.running = false;
    // Disconnect all clients
    for (const client of this.clients.values()) {
      client.disconnect();
    }
    this.clients.clear();
    this.rooms.clear();
    this.emit('stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Mock client connection
   */
  connectClient(clientId: string, room: string = 'default'): MockClient {
    if (this.clients.size >= this.config.maxConnections!) {
      throw new Error('Max connections exceeded');
    }

    const client = new MockClient(clientId, room);
    this.clients.set(clientId, client);

    // Add to room
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(clientId);

    client.on('disconnect', () => {
      this.clients.delete(clientId);
      this.rooms.get(room)?.delete(clientId);
      if (this.rooms.get(room)?.size === 0) {
        this.rooms.delete(room);
      }
    });

    this.emit('client-connected', client);
    return client;
  }

  /**
   * Publish quality update to all clients in room
   */
  publishQualityUpdate(payload: QualityUpdatePayload): void {
    if (!this.running) return;

    const room = payload.projectId || 'default';
    const clientIds = this.rooms.get(room);
    
    // Send to all clients in room if there are any
    if (clientIds) {
      const message = {
        type: 'quality-update',
        payload,
        timestamp: new Date().toISOString()
      };

      for (const clientId of clientIds) {
        const client = this.clients.get(clientId);
        if (client?.connected) {
          client.send(message);
        }
      }
    }

    // Check for alert conditions and generate alerts (always run this)
    this.checkAlertThresholds(payload);
  }

  private checkAlertThresholds(payload: QualityUpdatePayload): void {
    const { metrics } = payload;
    
    // Check various thresholds and emit alerts
    if (metrics.eslintWarnings > 10) {
      this.emit('alert', {
        severity: 'warning',
        category: 'quality',
        message: `High ESLint warnings: ${metrics.eslintWarnings}`,
        projectId: payload.projectId,
        timestamp: metrics.timestamp
      });
    }

    if (metrics.typeErrors > 0) {
      this.emit('alert', {
        severity: 'error',
        category: 'quality', 
        message: `TypeScript errors detected: ${metrics.typeErrors}`,
        projectId: payload.projectId,
        timestamp: metrics.timestamp
      });
    }

    if (metrics.testCoverage < 50) {
      this.emit('alert', {
        severity: 'warning',
        category: 'quality',
        message: `Low test coverage: ${metrics.testCoverage}%`,
        projectId: payload.projectId,
        timestamp: metrics.timestamp
      });
    }

    if (metrics.codeComplexity > 20) {
      this.emit('alert', {
        severity: 'warning',
        category: 'quality',
        message: `High code complexity: ${metrics.codeComplexity}`,
        projectId: payload.projectId,
        timestamp: metrics.timestamp
      });
    }
  }

  /**
   * Check quality thresholds and emit alerts
   */
  private checkAndEmitAlerts(payload: QualityUpdatePayload): void {
    const thresholds = this.config.alertThresholds;
    if (!thresholds) return;

    const alerts: Array<{severity: string; category: string; type: string; message: string; projectId: string; timestamp: string}> = [];

    // Check ESLint warnings threshold
    if (thresholds.eslintWarningsMax !== undefined && 
        payload.metrics.eslintWarnings > thresholds.eslintWarningsMax) {
      alerts.push({
        severity: 'warning',
        category: 'quality',
        type: 'eslint-threshold',
        message: `ESLint warnings (${payload.metrics.eslintWarnings}) exceed threshold (${thresholds.eslintWarningsMax})`,
        projectId: payload.projectId,
        timestamp: new Date().toISOString()
      });
    }

    // Check type errors threshold
    if (thresholds.typeErrorsMax !== undefined && 
        payload.metrics.typeErrors > thresholds.typeErrorsMax) {
      alerts.push({
        severity: 'error',
        category: 'quality',
        type: 'type-error-threshold',
        message: `Type errors (${payload.metrics.typeErrors}) exceed threshold (${thresholds.typeErrorsMax})`,
        projectId: payload.projectId,
        timestamp: new Date().toISOString()
      });
    }

    // Emit alerts
    for (const alert of alerts) {
      this.emit('alert', alert);
    }
  }

  /**
   * Get analytics stats
   */
  getAnalyticsStats(): {
    connectedClients: number;
    activeRooms: number;
    totalMessagesProcessed: number;
  } {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      totalMessagesProcessed: 0 // Mock value
    };
  }

  /**
   * Get clients in room
   */
  getClientsInRoom(room: string): string[] {
    return Array.from(this.rooms.get(room) || []);
  }

  /**
   * Broadcast to all clients
   */
  broadcast(message: {type: string; payload?: unknown; timestamp: string}): void {
    for (const client of this.clients.values()) {
      if (client.connected) {
        client.send(message);
      }
    }
  }
}

/**
 * Create mock analytics transport for testing
 */
export function createMockAnalyticsTransport(config: MockTransportConfig = {}): MockAnalyticsTransport {
  return new MockAnalyticsTransport(config);
}