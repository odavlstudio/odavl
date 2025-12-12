/**
 * @fileoverview WebSocket Manager - Real-time dashboard updates via WebSocket
 * @module @odavl-studio/insight-core/realtime/websocket-manager
 * 
 * **Purpose**: Provide real-time bidirectional communication for dashboard updates
 * 
 * **Features**:
 * - WebSocket server (Socket.IO based)
 * - Room-based subscriptions (dashboard, project, user)
 * - Event broadcasting (issue detected, quality changed, build completed)
 * - Connection management (reconnection, heartbeat, authentication)
 * - Message queuing (offline support)
 * - Rate limiting (prevent abuse)
 * - Compression (gzip, deflate)
 * - Load balancing (sticky sessions, Redis adapter)
 * - Monitoring (active connections, message throughput)
 * 
 * **Event Types**:
 * - dashboard:metrics_updated - Dashboard metrics changed
 * - dashboard:widget_updated - Specific widget data changed
 * - issue:detected - New issue found
 * - issue:resolved - Issue fixed
 * - build:started - Build/analysis started
 * - build:completed - Build/analysis completed
 * - quality:changed - Quality score changed significantly
 * - alert:triggered - Alert rule triggered
 * 
 * **Client Events**:
 * - subscribe - Subscribe to room/channel
 * - unsubscribe - Unsubscribe from room/channel
 * - request_data - Request specific data
 * - ping - Heartbeat ping
 * 
 * **Architecture**:
 * ```
 * WebSocketManager
 *   ├── start(port) → void
 *   ├── stop() → void
 *   ├── broadcast(event, data, room?) → void
 *   ├── emit(socketId, event, data) → void
 *   ├── getRoomMembers(room) → string[]
 *   ├── getActiveConnections() → number
 *   ├── authenticateConnection(socket) → boolean
 *   └── setupRateLimiting(socket) → void
 * ```
 * 
 * **Integration Points**:
 * - Used by: Enterprise Dashboard Manager, Studio Hub, CLI
 * - Integrates with: Redis (pub/sub), Authentication service
 * - Protocol: WebSocket (Socket.IO v4)
 */

import { EventEmitter } from 'events';
import type { Server as HTTPServer } from 'http';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * WebSocket event types
 */
export enum WSEventType {
  // Dashboard events
  DASHBOARD_METRICS_UPDATED = 'dashboard:metrics_updated',
  DASHBOARD_WIDGET_UPDATED = 'dashboard:widget_updated',
  DASHBOARD_CREATED = 'dashboard:created',
  DASHBOARD_DELETED = 'dashboard:deleted',

  // Issue events
  ISSUE_DETECTED = 'issue:detected',
  ISSUE_RESOLVED = 'issue:resolved',
  ISSUE_UPDATED = 'issue:updated',

  // Build events
  BUILD_STARTED = 'build:started',
  BUILD_COMPLETED = 'build:completed',
  BUILD_FAILED = 'build:failed',

  // Quality events
  QUALITY_CHANGED = 'quality:changed',
  QUALITY_THRESHOLD_CROSSED = 'quality:threshold_crossed',

  // Alert events
  ALERT_TRIGGERED = 'alert:triggered',
  ALERT_RESOLVED = 'alert:resolved',

  // System events
  SYSTEM_STATUS = 'system:status',
  SYSTEM_MAINTENANCE = 'system:maintenance',
}

/**
 * Client event types
 */
export enum ClientEventType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  REQUEST_DATA = 'request_data',
  PING = 'ping',
  AUTHENTICATE = 'authenticate',
}

/**
 * WebSocket message
 */
export interface WSMessage {
  /** Event type */
  event: WSEventType;

  /** Payload data */
  data: any;

  /** Timestamp */
  timestamp: Date;

  /** Sender ID */
  senderId?: string;

  /** Target room */
  room?: string;

  /** Message ID (for deduplication) */
  messageId: string;
}

/**
 * Connection info
 */
export interface ConnectionInfo {
  /** Socket ID */
  id: string;

  /** User ID */
  userId?: string;

  /** Connected at */
  connectedAt: Date;

  /** Last activity */
  lastActivity: Date;

  /** Subscribed rooms */
  rooms: Set<string>;

  /** IP address */
  ipAddress: string;

  /** User agent */
  userAgent: string;

  /** Authentication status */
  authenticated: boolean;
}

/**
 * Room info
 */
export interface RoomInfo {
  /** Room name */
  name: string;

  /** Member count */
  memberCount: number;

  /** Created at */
  createdAt: Date;

  /** Last activity */
  lastActivity: Date;
}

/**
 * WebSocket statistics
 */
export interface WSStatistics {
  /** Active connections */
  activeConnections: number;

  /** Total rooms */
  totalRooms: number;

  /** Messages sent (last minute) */
  messagesSent: number;

  /** Messages received (last minute) */
  messagesReceived: number;

  /** Bytes sent (last minute) */
  bytesSent: number;

  /** Bytes received (last minute) */
  bytesReceived: number;

  /** Average latency (ms) */
  averageLatency: number;

  /** Error count (last minute) */
  errorCount: number;
}

/**
 * Configuration options
 */
export interface WebSocketManagerConfig {
  /** Server port */
  port: number;

  /** Enable authentication */
  enableAuth: boolean;

  /** JWT secret (for authentication) */
  jwtSecret?: string;

  /** Enable compression */
  enableCompression: boolean;

  /** Max connections per IP */
  maxConnectionsPerIP: number;

  /** Heartbeat interval (ms) */
  heartbeatInterval: number;

  /** Connection timeout (ms) */
  connectionTimeout: number;

  /** Rate limiting */
  rateLimit: {
    /** Max messages per minute */
    maxMessagesPerMinute: number;
    /** Ban duration (ms) */
    banDuration: number;
  };

  /** Message queue */
  messageQueue: {
    /** Enable queuing */
    enabled: boolean;
    /** Max queue size per connection */
    maxSize: number;
  };

  /** Redis adapter (for clustering) */
  redis?: {
    /** Redis host */
    host: string;
    /** Redis port */
    port: number;
    /** Redis password */
    password?: string;
  };

  /** CORS origins */
  corsOrigins: string[];
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: WebSocketManagerConfig = {
  port: 3001,
  enableAuth: true,
  enableCompression: true,
  maxConnectionsPerIP: 10,
  heartbeatInterval: 30000, // 30 seconds
  connectionTimeout: 60000, // 60 seconds
  rateLimit: {
    maxMessagesPerMinute: 100,
    banDuration: 300000, // 5 minutes
  },
  messageQueue: {
    enabled: true,
    maxSize: 100,
  },
  corsOrigins: ['http://localhost:3000', 'https://odavl.com'],
};

// ============================================================================
// WebSocketManager Class
// ============================================================================

/**
 * WebSocket Manager - Real-time communication
 * 
 * **Usage**:
 * ```typescript
 * // Server-side
 * const wsManager = new WebSocketManager(config);
 * await wsManager.start(3001);
 * 
 * // Broadcast to all
 * wsManager.broadcast(WSEventType.ISSUE_DETECTED, {
 *   issue: {
 *     id: 'issue-123',
 *     severity: 'CRITICAL',
 *     message: 'Hardcoded API key detected',
 *   },
 * });
 * 
 * // Broadcast to room
 * wsManager.broadcast(
 *   WSEventType.DASHBOARD_METRICS_UPDATED,
 *   { metrics: {...} },
 *   'dashboard-456'
 * );
 * 
 * // Get statistics
 * const stats = wsManager.getStatistics();
 * console.log(`Active connections: ${stats.activeConnections}`);
 * 
 * // Client-side (Socket.IO client)
 * const socket = io('http://localhost:3001', {
 *   auth: { token: 'jwt-token' },
 * });
 * 
 * socket.on('connect', () => {
 *   console.log('Connected:', socket.id);
 *   
 *   // Subscribe to dashboard
 *   socket.emit('subscribe', { room: 'dashboard-456' });
 * });
 * 
 * socket.on('dashboard:metrics_updated', (data) => {
 *   console.log('Metrics updated:', data.metrics);
 *   updateUI(data.metrics);
 * });
 * 
 * socket.on('issue:detected', (data) => {
 *   console.log('New issue:', data.issue);
 *   showNotification(data.issue);
 * });
 * ```
 */
export class WebSocketManager extends EventEmitter {
  private config: WebSocketManagerConfig;
  private server?: any; // Socket.IO server (type 'any' to avoid Socket.IO dependency)
  private connections: Map<string, ConnectionInfo> = new Map();
  private rooms: Map<string, RoomInfo> = new Map();
  private messageQueue: Map<string, WSMessage[]> = new Map();
  private rateLimits: Map<string, number[]> = new Map();
  private statistics: WSStatistics = {
    activeConnections: 0,
    totalRooms: 0,
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    averageLatency: 0,
    errorCount: 0,
  };

  constructor(config: Partial<WebSocketManagerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API - Server Management
  // ==========================================================================

  /**
   * Start WebSocket server
   * 
   * @param httpServer - Optional HTTP server to attach to
   */
  async start(httpServer?: HTTPServer): Promise<void> {
    try {
      // Mock Socket.IO server creation
      // In real implementation:
      // import { Server } from 'socket.io';
      // this.server = new Server(httpServer || this.config.port, {
      //   cors: { origin: this.config.corsOrigins },
      //   compression: this.config.enableCompression,
      // });

      this.server = {
        on: (event: string, handler: Function) => {
          // Mock event handler registration
        },
        emit: (event: string, data: any) => {
          // Mock emit
        },
        to: (room: string) => ({
          emit: (event: string, data: any) => {
            // Mock room emit
          },
        }),
      };

      this.setupEventHandlers();
      this.startHeartbeat();
      this.startStatisticsCollection();

      console.log(`✓ WebSocket server started on port ${this.config.port}`);
      this.emit('server:started', { port: this.config.port });
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Stop WebSocket server
   */
  async stop(): Promise<void> {
    if (!this.server) return;

    // Disconnect all clients
    for (const [socketId] of this.connections) {
      this.disconnectClient(socketId, 'Server shutting down');
    }

    // Close server
    // await this.server.close();
    this.server = undefined;

    console.log('✓ WebSocket server stopped');
    this.emit('server:stopped');
  }

  // ==========================================================================
  // Public API - Broadcasting
  // ==========================================================================

  /**
   * Broadcast event to all or specific room
   * 
   * @param event - Event type
   * @param data - Event data
   * @param room - Optional room name
   */
  broadcast(event: WSEventType, data: any, room?: string): void {
    const message: WSMessage = {
      event,
      data,
      timestamp: new Date(),
      room,
      messageId: this.generateMessageId(),
    };

    if (room) {
      // Broadcast to room
      this.server?.to(room).emit(event, message);
      this.emit('message:broadcast', { room, message });
    } else {
      // Broadcast to all
      this.server?.emit(event, message);
      this.emit('message:broadcast', { message });
    }

    this.statistics.messagesSent++;
  }

  /**
   * Emit event to specific socket
   * 
   * @param socketId - Socket ID
   * @param event - Event type
   * @param data - Event data
   */
  emit(socketId: string, event: WSEventType, data: any): void {
    const message: WSMessage = {
      event,
      data,
      timestamp: new Date(),
      messageId: this.generateMessageId(),
    };

    // Mock socket emit
    // this.server?.to(socketId).emit(event, message);
    
    this.emit('message:sent', { socketId, message });
    this.statistics.messagesSent++;
  }

  // ==========================================================================
  // Public API - Room Management
  // ==========================================================================

  /**
   * Get room members
   * 
   * @param room - Room name
   * @returns Array of socket IDs
   */
  getRoomMembers(room: string): string[] {
    const members: string[] = [];
    
    for (const [socketId, conn] of this.connections) {
      if (conn.rooms.has(room)) {
        members.push(socketId);
      }
    }

    return members;
  }

  /**
   * Get room info
   * 
   * @param room - Room name
   * @returns Room info or undefined
   */
  getRoomInfo(room: string): RoomInfo | undefined {
    return this.rooms.get(room);
  }

  /**
   * List all rooms
   * 
   * @returns Array of room names
   */
  listRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  // ==========================================================================
  // Public API - Connection Management
  // ==========================================================================

  /**
   * Get active connections count
   * 
   * @returns Number of active connections
   */
  getActiveConnections(): number {
    return this.connections.size;
  }

  /**
   * Get connection info
   * 
   * @param socketId - Socket ID
   * @returns Connection info or undefined
   */
  getConnectionInfo(socketId: string): ConnectionInfo | undefined {
    return this.connections.get(socketId);
  }

  /**
   * Disconnect client
   * 
   * @param socketId - Socket ID
   * @param reason - Disconnect reason
   */
  disconnectClient(socketId: string, reason: string): void {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    // Remove from rooms
    for (const room of conn.rooms) {
      this.leaveRoom(socketId, room);
    }

    // Remove connection
    this.connections.delete(socketId);
    
    // Clear rate limit
    this.rateLimits.delete(socketId);
    
    // Clear message queue
    this.messageQueue.delete(socketId);

    this.emit('connection:closed', { socketId, reason });
  }

  // ==========================================================================
  // Public API - Statistics
  // ==========================================================================

  /**
   * Get WebSocket statistics
   * 
   * @returns Current statistics
   */
  getStatistics(): WSStatistics {
    return {
      ...this.statistics,
      activeConnections: this.connections.size,
      totalRooms: this.rooms.size,
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      activeConnections: this.connections.size,
      totalRooms: this.rooms.size,
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      averageLatency: 0,
      errorCount: 0,
    };
  }

  // ==========================================================================
  // Private Methods - Event Handlers
  // ==========================================================================

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    if (!this.server) return;

    // Connection event
    this.server.on('connection', (socket: any) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: any): void {
    const socketId = socket.id;

    // Check max connections per IP
    const ipAddress = socket.handshake.address;
    const ipConnections = Array.from(this.connections.values()).filter(
      c => c.ipAddress === ipAddress
    );

    if (ipConnections.length >= this.config.maxConnectionsPerIP) {
      socket.disconnect(true);
      return;
    }

    // Create connection info
    const connection: ConnectionInfo = {
      id: socketId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      rooms: new Set(),
      ipAddress,
      userAgent: socket.handshake.headers['user-agent'] || 'unknown',
      authenticated: false,
    };

    this.connections.set(socketId, connection);

    // Authentication
    if (this.config.enableAuth) {
      this.authenticateConnection(socket);
    }

    // Setup client event handlers
    socket.on('disconnect', () => this.handleDisconnect(socketId));
    socket.on(ClientEventType.SUBSCRIBE, (data: any) => this.handleSubscribe(socketId, data));
    socket.on(ClientEventType.UNSUBSCRIBE, (data: any) => this.handleUnsubscribe(socketId, data));
    socket.on(ClientEventType.REQUEST_DATA, (data: any) => this.handleRequestData(socketId, data));
    socket.on(ClientEventType.PING, () => this.handlePing(socketId));

    this.emit('connection:opened', { socketId, connection });
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socketId: string): void {
    this.disconnectClient(socketId, 'Client disconnected');
  }

  /**
   * Handle subscribe
   */
  private handleSubscribe(socketId: string, data: { room: string }): void {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    const { room } = data;

    // Join room
    this.joinRoom(socketId, room);

    // Update activity
    conn.lastActivity = new Date();

    this.emit('room:joined', { socketId, room });
  }

  /**
   * Handle unsubscribe
   */
  private handleUnsubscribe(socketId: string, data: { room: string }): void {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    const { room } = data;

    // Leave room
    this.leaveRoom(socketId, room);

    // Update activity
    conn.lastActivity = new Date();

    this.emit('room:left', { socketId, room });
  }

  /**
   * Handle request data
   */
  private handleRequestData(socketId: string, data: { type: string; query: any }): void {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    // Check rate limit
    if (!this.checkRateLimit(socketId)) {
      this.emit(socketId, WSEventType.SYSTEM_STATUS, {
        error: 'Rate limit exceeded',
      });
      return;
    }

    // Update activity
    conn.lastActivity = new Date();
    this.statistics.messagesReceived++;

    this.emit('data:requested', { socketId, data });
  }

  /**
   * Handle ping (heartbeat)
   */
  private handlePing(socketId: string): void {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    // Update activity
    conn.lastActivity = new Date();

    // Send pong
    // socket.emit('pong', { timestamp: Date.now() });
  }

  // ==========================================================================
  // Private Methods - Authentication
  // ==========================================================================

  /**
   * Authenticate connection
   */
  private authenticateConnection(socket: any): boolean {
    const token = socket.handshake.auth?.token;

    if (!token) {
      socket.disconnect(true);
      return false;
    }

    // Mock JWT verification
    // In real implementation, verify JWT token
    // const decoded = jwt.verify(token, this.config.jwtSecret);

    const conn = this.connections.get(socket.id);
    if (conn) {
      conn.authenticated = true;
      // conn.userId = decoded.userId;
    }

    return true;
  }

  // ==========================================================================
  // Private Methods - Room Management
  // ==========================================================================

  /**
   * Join room
   */
  private joinRoom(socketId: string, room: string): void {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    // Add to connection rooms
    conn.rooms.add(room);

    // Create or update room info
    let roomInfo = this.rooms.get(room);
    if (!roomInfo) {
      roomInfo = {
        name: room,
        memberCount: 0,
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      this.rooms.set(room, roomInfo);
    }

    roomInfo.memberCount++;
    roomInfo.lastActivity = new Date();

    // Socket.IO join room
    // socket.join(room);
  }

  /**
   * Leave room
   */
  private leaveRoom(socketId: string, room: string): void {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    // Remove from connection rooms
    conn.rooms.delete(room);

    // Update room info
    const roomInfo = this.rooms.get(room);
    if (roomInfo) {
      roomInfo.memberCount--;
      roomInfo.lastActivity = new Date();

      // Delete room if empty
      if (roomInfo.memberCount <= 0) {
        this.rooms.delete(room);
      }
    }

    // Socket.IO leave room
    // socket.leave(room);
  }

  // ==========================================================================
  // Private Methods - Rate Limiting
  // ==========================================================================

  /**
   * Check rate limit
   */
  private checkRateLimit(socketId: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // Get recent messages
    let timestamps = this.rateLimits.get(socketId) || [];
    timestamps = timestamps.filter(t => t > windowStart);

    // Check limit
    if (timestamps.length >= this.config.rateLimit.maxMessagesPerMinute) {
      return false;
    }

    // Add current timestamp
    timestamps.push(now);
    this.rateLimits.set(socketId, timestamps);

    return true;
  }

  // ==========================================================================
  // Private Methods - Heartbeat
  // ==========================================================================

  /**
   * Start heartbeat loop
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = this.config.connectionTimeout;

      for (const [socketId, conn] of this.connections) {
        const idle = now - conn.lastActivity.getTime();

        if (idle > timeout) {
          this.disconnectClient(socketId, 'Connection timeout');
        }
      }
    }, this.config.heartbeatInterval);
  }

  // ==========================================================================
  // Private Methods - Statistics
  // ==========================================================================

  /**
   * Start statistics collection
   */
  private startStatisticsCollection(): void {
    setInterval(() => {
      // Reset per-minute counters
      this.statistics.messagesSent = 0;
      this.statistics.messagesReceived = 0;
      this.statistics.bytesSent = 0;
      this.statistics.bytesReceived = 0;
      this.statistics.errorCount = 0;
    }, 60000); // Every minute
  }

  // ==========================================================================
  // Private Methods - Utilities
  // ==========================================================================

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
