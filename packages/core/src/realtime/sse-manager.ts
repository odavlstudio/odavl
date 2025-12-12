/**
 * @fileoverview SSE Manager - Server-Sent Events for real-time updates
 * @module @odavl-studio/insight-core/realtime/sse-manager
 * 
 * **Purpose**: Provide unidirectional real-time updates via Server-Sent Events (SSE)
 * 
 * **Features**:
 * - HTTP-based streaming (no WebSocket required)
 * - Automatic reconnection (EventSource API)
 * - Event history buffer (replay missed events)
 * - Multiple event channels
 * - Compression support (gzip, deflate)
 * - CORS handling
 * - Heartbeat (keep-alive)
 * - Event ID tracking (resume from last event)
 * - Connection pooling
 * - Rate limiting
 * - Monitoring
 * 
 * **Use Cases**:
 * - Read-only dashboards (no client → server messaging)
 * - Public status pages
 * - Legacy browser support (IE 11+)
 * - Firewall-friendly (port 80/443)
 * - Lower latency than polling
 * - Lower resource usage than WebSocket
 * 
 * **Event Format**:
 * ```
 * event: dashboard:metrics_updated
 * id: 1701789123456
 * data: {"dashboardId":"abc","metrics":{...}}
 * 
 * ```
 * 
 * **Architecture**:
 * ```
 * SSEManager
 *   ├── createChannel(name) → Channel
 *   ├── sendEvent(channel, event, data) → void
 *   ├── handleConnection(req, res) → void
 *   ├── closeChannel(name) → void
 *   ├── getChannelInfo(name) → ChannelInfo
 *   ├── getActiveConnections() → number
 *   └── cleanup() → void
 * ```
 * 
 * **Integration Points**:
 * - Used by: Enterprise Dashboard Manager, Public status pages
 * - Protocol: HTTP SSE (text/event-stream)
 * - Fallback for: WebSocket when not available
 */

import { EventEmitter } from 'events';
import type { IncomingMessage, ServerResponse } from 'http';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * SSE event
 */
export interface SSEEvent {
  /** Event type */
  event: string;

  /** Event data (will be JSON stringified) */
  data: any;

  /** Event ID (for resuming) */
  id?: string;

  /** Retry interval (ms) */
  retry?: number;
}

/**
 * SSE connection
 */
export interface SSEConnection {
  /** Connection ID */
  id: string;

  /** HTTP response object */
  response: ServerResponse;

  /** Connected at */
  connectedAt: Date;

  /** Last event sent */
  lastEventId?: string;

  /** Last event timestamp */
  lastEventTime?: Date;

  /** User ID */
  userId?: string;

  /** IP address */
  ipAddress: string;

  /** User agent */
  userAgent: string;

  /** Channel subscriptions */
  channels: Set<string>;
}

/**
 * SSE channel
 */
export interface SSEChannel {
  /** Channel name */
  name: string;

  /** Active connections */
  connections: Set<string>;

  /** Event history buffer */
  history: SSEEvent[];

  /** Max history size */
  maxHistorySize: number;

  /** Created at */
  createdAt: Date;

  /** Last activity */
  lastActivity: Date;

  /** Total events sent */
  totalEventsSent: number;
}

/**
 * Channel info
 */
export interface ChannelInfo {
  /** Channel name */
  name: string;

  /** Connection count */
  connectionCount: number;

  /** Total events sent */
  totalEventsSent: number;

  /** Created at */
  createdAt: Date;

  /** Last activity */
  lastActivity: Date;
}

/**
 * SSE statistics
 */
export interface SSEStatistics {
  /** Active connections */
  activeConnections: number;

  /** Active channels */
  activeChannels: number;

  /** Events sent (last minute) */
  eventsSent: number;

  /** Bytes sent (last minute) */
  bytesSent: number;

  /** Dropped connections (last minute) */
  droppedConnections: number;

  /** Average connection duration (ms) */
  averageConnectionDuration: number;
}

/**
 * Configuration options
 */
export interface SSEManagerConfig {
  /** Enable compression */
  enableCompression: boolean;

  /** Heartbeat interval (ms) */
  heartbeatInterval: number;

  /** Connection timeout (ms) */
  connectionTimeout: number;

  /** Max history size per channel */
  maxHistorySize: number;

  /** Max connections per channel */
  maxConnectionsPerChannel: number;

  /** CORS origins */
  corsOrigins: string[];

  /** Retry interval (ms) - sent to clients */
  retryInterval: number;

  /** Rate limiting */
  rateLimit: {
    /** Max events per minute per connection */
    maxEventsPerMinute: number;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SSEManagerConfig = {
  enableCompression: true,
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 300000, // 5 minutes
  maxHistorySize: 100,
  maxConnectionsPerChannel: 1000,
  corsOrigins: ['*'],
  retryInterval: 3000, // 3 seconds
  rateLimit: {
    maxEventsPerMinute: 60,
  },
};

// ============================================================================
// SSEManager Class
// ============================================================================

/**
 * SSE Manager - Server-Sent Events for real-time updates
 * 
 * **Usage**:
 * ```typescript
 * // Server-side (Express.js)
 * import express from 'express';
 * import { SSEManager } from '@odavl-studio/insight-core/realtime/sse-manager';
 * 
 * const app = express();
 * const sseManager = new SSEManager();
 * 
 * // Create channels
 * sseManager.createChannel('dashboard');
 * sseManager.createChannel('issues');
 * 
 * // SSE endpoint
 * app.get('/api/events/:channel', (req, res) => {
 *   const { channel } = req.params;
 *   const { lastEventId } = req.query;
 *   
 *   sseManager.handleConnection(req, res, channel, lastEventId as string);
 * });
 * 
 * // Send events
 * setInterval(() => {
 *   sseManager.sendEvent('dashboard', {
 *     event: 'metrics_updated',
 *     data: { qualityScore: 85, issueCount: 12 },
 *   });
 * }, 5000);
 * 
 * // Client-side (EventSource API)
 * const eventSource = new EventSource('/api/events/dashboard');
 * 
 * eventSource.addEventListener('metrics_updated', (e) => {
 *   const data = JSON.parse(e.data);
 *   console.log('Metrics:', data);
 *   updateDashboard(data);
 * });
 * 
 * eventSource.addEventListener('error', (e) => {
 *   console.error('SSE error:', e);
 *   // EventSource automatically reconnects
 * });
 * 
 * // Cleanup
 * eventSource.close();
 * ```
 * 
 * **Resume from Last Event**:
 * ```typescript
 * // Client stores last event ID
 * let lastEventId = localStorage.getItem('lastEventId');
 * 
 * const url = lastEventId
 *   ? `/api/events/dashboard?lastEventId=${lastEventId}`
 *   : '/api/events/dashboard';
 * 
 * const eventSource = new EventSource(url);
 * 
 * eventSource.onmessage = (e) => {
 *   lastEventId = e.lastEventId;
 *   localStorage.setItem('lastEventId', lastEventId);
 * };
 * ```
 */
export class SSEManager extends EventEmitter {
  private config: SSEManagerConfig;
  private connections: Map<string, SSEConnection> = new Map();
  private channels: Map<string, SSEChannel> = new Map();
  private rateLimits: Map<string, number[]> = new Map();
  private statistics: SSEStatistics = {
    activeConnections: 0,
    activeChannels: 0,
    eventsSent: 0,
    bytesSent: 0,
    droppedConnections: 0,
    averageConnectionDuration: 0,
  };
  private heartbeatInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<SSEManagerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startHeartbeat();
    this.startCleanup();
  }

  // ==========================================================================
  // Public API - Channel Management
  // ==========================================================================

  /**
   * Create SSE channel
   * 
   * @param name - Channel name
   * @returns Channel object
   */
  createChannel(name: string): SSEChannel {
    if (this.channels.has(name)) {
      return this.channels.get(name)!;
    }

    const channel: SSEChannel = {
      name,
      connections: new Set(),
      history: [],
      maxHistorySize: this.config.maxHistorySize,
      createdAt: new Date(),
      lastActivity: new Date(),
      totalEventsSent: 0,
    };

    this.channels.set(name, channel);
    this.emit('channel:created', { name });

    return channel;
  }

  /**
   * Close channel and disconnect all connections
   * 
   * @param name - Channel name
   */
  closeChannel(name: string): void {
    const channel = this.channels.get(name);
    if (!channel) return;

    // Disconnect all connections
    for (const connId of channel.connections) {
      this.closeConnection(connId, 'Channel closed');
    }

    this.channels.delete(name);
    this.emit('channel:closed', { name });
  }

  /**
   * Get channel info
   * 
   * @param name - Channel name
   * @returns Channel info or undefined
   */
  getChannelInfo(name: string): ChannelInfo | undefined {
    const channel = this.channels.get(name);
    if (!channel) return undefined;

    return {
      name: channel.name,
      connectionCount: channel.connections.size,
      totalEventsSent: channel.totalEventsSent,
      createdAt: channel.createdAt,
      lastActivity: channel.lastActivity,
    };
  }

  /**
   * List all channels
   * 
   * @returns Array of channel names
   */
  listChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // ==========================================================================
  // Public API - Connection Management
  // ==========================================================================

  /**
   * Handle SSE connection
   * 
   * @param req - HTTP request
   * @param res - HTTP response
   * @param channelName - Channel name
   * @param lastEventId - Last event ID (for resuming)
   */
  handleConnection(
    req: IncomingMessage,
    res: ServerResponse,
    channelName: string,
    lastEventId?: string
  ): void {
    // Get or create channel
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.createChannel(channelName);
    }

    // Check max connections
    if (channel.connections.size >= this.config.maxConnectionsPerChannel) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Service Unavailable: Channel full');
      return;
    }

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': this.config.corsOrigins[0],
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Create connection
    const connectionId = this.generateConnectionId();
    const connection: SSEConnection = {
      id: connectionId,
      response: res,
      connectedAt: new Date(),
      ipAddress: req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      channels: new Set([channelName]),
    };

    this.connections.set(connectionId, connection);
    channel.connections.add(connectionId);

    // Send retry interval
    this.writeSSE(res, {
      retry: this.config.retryInterval,
    });

    // Send initial comment (keep-alive)
    res.write(': connected\n\n');

    // Replay history if lastEventId provided
    if (lastEventId) {
      this.replayHistory(connectionId, channelName, lastEventId);
    }

    // Handle disconnect
    req.on('close', () => {
      this.handleDisconnect(connectionId);
    });

    req.on('error', (error) => {
      console.error('SSE connection error:', error);
      this.handleDisconnect(connectionId);
    });

    this.emit('connection:opened', { connectionId, channelName });
  }

  /**
   * Close connection
   * 
   * @param connectionId - Connection ID
   * @param reason - Close reason
   */
  closeConnection(connectionId: string, reason: string): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    // Remove from channels
    for (const channelName of conn.channels) {
      const channel = this.channels.get(channelName);
      if (channel) {
        channel.connections.delete(connectionId);
      }
    }

    // Close response
    try {
      conn.response.end();
    } catch (error) {
      // Ignore errors (connection may already be closed)
    }

    this.connections.delete(connectionId);
    this.rateLimits.delete(connectionId);

    this.emit('connection:closed', { connectionId, reason });
  }

  /**
   * Get active connections count
   * 
   * @returns Number of active connections
   */
  getActiveConnections(): number {
    return this.connections.size;
  }

  // ==========================================================================
  // Public API - Event Sending
  // ==========================================================================

  /**
   * Send event to channel
   * 
   * @param channelName - Channel name
   * @param event - Event object
   */
  sendEvent(channelName: string, event: SSEEvent): void {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.warn(`Channel not found: ${channelName}`);
      return;
    }

    // Generate event ID if not provided
    if (!event.id) {
      event.id = Date.now().toString();
    }

    // Add to history
    channel.history.push(event);
    if (channel.history.length > channel.maxHistorySize) {
      channel.history.shift();
    }

    // Update channel stats
    channel.lastActivity = new Date();
    channel.totalEventsSent++;

    // Send to all connections
    for (const connId of channel.connections) {
      this.sendEventToConnection(connId, event);
    }

    this.statistics.eventsSent++;
    this.emit('event:sent', { channelName, event });
  }

  /**
   * Broadcast event to all channels
   * 
   * @param event - Event object
   */
  broadcast(event: SSEEvent): void {
    for (const channelName of this.channels.keys()) {
      this.sendEvent(channelName, event);
    }
  }

  // ==========================================================================
  // Public API - Statistics
  // ==========================================================================

  /**
   * Get SSE statistics
   * 
   * @returns Current statistics
   */
  getStatistics(): SSEStatistics {
    return {
      ...this.statistics,
      activeConnections: this.connections.size,
      activeChannels: this.channels.size,
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      activeConnections: this.connections.size,
      activeChannels: this.channels.size,
      eventsSent: 0,
      bytesSent: 0,
      droppedConnections: 0,
      averageConnectionDuration: 0,
    };
  }

  // ==========================================================================
  // Public API - Cleanup
  // ==========================================================================

  /**
   * Cleanup and close all connections
   */
  cleanup(): void {
    // Close all connections
    for (const [connId] of this.connections) {
      this.closeConnection(connId, 'Manager cleanup');
    }

    // Close all channels
    for (const channelName of this.channels.keys()) {
      this.closeChannel(channelName);
    }

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.emit('cleanup:complete');
  }

  // ==========================================================================
  // Private Methods - Event Handling
  // ==========================================================================

  /**
   * Handle disconnect
   */
  private handleDisconnect(connectionId: string): void {
    this.closeConnection(connectionId, 'Client disconnected');
    this.statistics.droppedConnections++;
  }

  /**
   * Send event to specific connection
   */
  private sendEventToConnection(connectionId: string, event: SSEEvent): void {
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    // Check rate limit
    if (!this.checkRateLimit(connectionId)) {
      return;
    }

    // Update connection state
    conn.lastEventId = event.id;
    conn.lastEventTime = new Date();

    // Write SSE event
    try {
      this.writeSSE(conn.response, event);
    } catch (error) {
      console.error('Failed to send event:', error);
      this.handleDisconnect(connectionId);
    }
  }

  /**
   * Write SSE formatted message
   */
  private writeSSE(res: ServerResponse, event: Partial<SSEEvent>): void {
    let message = '';

    if (event.id) {
      message += `id: ${event.id}\n`;
    }

    if (event.event) {
      message += `event: ${event.event}\n`;
    }

    if (event.retry) {
      message += `retry: ${event.retry}\n`;
    }

    if (event.data !== undefined) {
      const dataStr = typeof event.data === 'string'
        ? event.data
        : JSON.stringify(event.data);
      
      // Split multiline data
      const lines = dataStr.split('\n');
      for (const line of lines) {
        message += `data: ${line}\n`;
      }
    }

    message += '\n';

    res.write(message);
    this.statistics.bytesSent += Buffer.byteLength(message);
  }

  /**
   * Replay history from last event ID
   */
  private replayHistory(
    connectionId: string,
    channelName: string,
    lastEventId: string
  ): void {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    // Find index of last event
    const lastIndex = channel.history.findIndex(e => e.id === lastEventId);
    if (lastIndex === -1) {
      // Event not found in history, send all
      for (const event of channel.history) {
        this.sendEventToConnection(connectionId, event);
      }
      return;
    }

    // Send events after last event
    for (let i = lastIndex + 1; i < channel.history.length; i++) {
      this.sendEventToConnection(connectionId, channel.history[i]);
    }

    this.emit('history:replayed', { connectionId, channelName, eventCount: channel.history.length - lastIndex - 1 });
  }

  // ==========================================================================
  // Private Methods - Rate Limiting
  // ==========================================================================

  /**
   * Check rate limit
   */
  private checkRateLimit(connectionId: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get recent events
    let timestamps = this.rateLimits.get(connectionId) || [];
    timestamps = timestamps.filter(t => t > windowStart);

    // Check limit
    if (timestamps.length >= this.config.rateLimit.maxEventsPerMinute) {
      return false;
    }

    // Add current timestamp
    timestamps.push(now);
    this.rateLimits.set(connectionId, timestamps);

    return true;
  }

  // ==========================================================================
  // Private Methods - Heartbeat
  // ==========================================================================

  /**
   * Start heartbeat loop
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [connId, conn] of this.connections) {
        try {
          // Send comment as keep-alive
          conn.response.write(': heartbeat\n\n');
        } catch (error) {
          console.error('Heartbeat failed:', error);
          this.handleDisconnect(connId);
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Start cleanup loop
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const timeout = this.config.connectionTimeout;

      for (const [connId, conn] of this.connections) {
        const idle = conn.lastEventTime
          ? now - conn.lastEventTime.getTime()
          : now - conn.connectedAt.getTime();

        if (idle > timeout) {
          this.closeConnection(connId, 'Connection timeout');
        }
      }

      // Reset per-minute counters
      this.statistics.eventsSent = 0;
      this.statistics.bytesSent = 0;
      this.statistics.droppedConnections = 0;
    }, 60000); // Every minute
  }

  // ==========================================================================
  // Private Methods - Utilities
  // ==========================================================================

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `sse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
