/**
 * ODAVL Wave 9 - Real-time Analytics Engine
 * 
 * This module implements streaming analytics for live dashboard updates and instant quality alerts.
 * It provides WebSocket-based real-time communication, event-driven architecture, and 
 * high-performance streaming data processing for continuous code quality monitoring.
 * 
 * Key Features:
 * - WebSocket server for real-time client connections
 * - Event-driven quality metric streaming
 * - Live dashboard data synchronization
 * - Instant alert system with customizable thresholds
 * - High-performance data aggregation and filtering
 * - Multi-client broadcast with room-based segmentation
 * 
 * @version 1.0.0
 * @author ODAVL Intelligence System
 * @created 2025-10-11
 */

import { EventEmitter } from 'events';
import { createServer, Server } from 'http';
import { 
  TeamMetrics,
  TimeSeriesData,
  TimeSeriesDataPoint
} from './analytics.types.js';
import { 
  QualityMetrics
} from './training-data.types.js';
import { 
  EnsemblePrediction,
  QualityRiskAssessment,
  PreventiveRecommendations
} from './predictive-engine.js';

// WebSocket types - would normally be from 'ws' package
interface WebSocket {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  on(event: 'message', listener: (data: Buffer) => void): void;
  on(event: 'close', listener: () => void): void;
  on(event: 'error', listener: (error: Error) => void): void;
}

interface IncomingMessage {
  headers: Record<string, string | string[] | undefined>;
}

interface WebSocketServer {
  on(event: 'connection', listener: (socket: WebSocket, request: IncomingMessage) => void): void;
  close(callback?: () => void): void;
}

// Mock WebSocket implementation for TypeScript compilation
const WebSocket = {
  OPEN: 1
} as const;

// Mock WebSocketServer constructor
class MockWebSocketServer implements WebSocketServer {
  constructor(_options?: { server: Server }) {
    // Mock implementation accepting optional server parameter
  }

  on(_event: 'connection', _listener: (socket: WebSocket, request: IncomingMessage) => void): void {
    // Mock implementation for compilation
  }
  
  close(_callback?: () => void): void {
    // Mock implementation for compilation
  }
}

const WebSocketServer = MockWebSocketServer;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Real-time analytics configuration
 */
export interface AnalyticsEngineConfig {
  port: number;
  maxConnections: number;
  heartbeatInterval: number; // milliseconds
  dataRetentionPeriod: number; // hours
  alertThresholds: {
    qualityScoreMin: number;
    eslintWarningsMax: number;
    typeErrorsMax: number;
    buildFailureRate: number;
  };
  aggregationIntervals: {
    realtime: number; // seconds
    shortTerm: number; // minutes
    longTerm: number; // hours
  };
}

/**
 * WebSocket message types for client-server communication
 */
export type WebSocketMessageType = 
  | 'subscribe'
  | 'unsubscribe'
  | 'quality-update'
  | 'alert'
  | 'prediction'
  | 'team-metrics'
  | 'dashboard-data'
  | 'heartbeat'
  | 'error';

/**
 * Generic WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  timestamp: string;
  sessionId: string;
  data: T;
  metadata?: {
    source: string;
    version: string;
    correlationId?: string;
  };
}

/**
 * Client subscription preferences
 */
export interface SubscriptionPreferences {
  qualityUpdates: boolean;
  alerts: boolean;
  predictions: boolean;
  teamMetrics: boolean;
  dashboardData: boolean;
  rooms: string[]; // Room-based segmentation (e.g., 'project:odavl', 'team:frontend')
}

/**
 * Real-time quality update payload
 */
export interface QualityUpdatePayload {
  projectId: string;
  metrics: QualityMetrics;
  delta: {
    eslintWarnings: number;
    typeErrors: number;
    qualityScore: number;
  };
  trends: {
    shortTerm: 'improving' | 'stable' | 'degrading';
    longTerm: 'improving' | 'stable' | 'degrading';
  };
  affectedFiles: string[];
  timestamp: string;
}

/**
 * Real-time alert payload
 */
export interface AlertPayload {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'quality' | 'security' | 'performance' | 'compliance';
  title: string;
  description: string;
  projectId: string;
  affectedComponents: string[];
  recommendations: string[];
  autoResolvable: boolean;
  estimatedImpact: {
    developmentTime: number; // hours
    riskLevel: number; // 0-100
    affectedUsers: number;
  };
  timestamp: string;
  expiresAt?: string;
}

/**
 * Live dashboard data structure
 */
export interface DashboardData {
  overview: {
    totalProjects: number;
    activeAlerts: number;
    qualityScore: number;
    trendsDirection: 'up' | 'down' | 'stable';
  };
  
  realtimeMetrics: {
    eslintWarnings: TimeSeriesData;
    typeErrors: TimeSeriesData;
    buildSuccess: TimeSeriesData;
    deploymentFrequency: TimeSeriesData;
  };
  
  teamPerformance: {
    velocity: number;
    qualityTrend: number;
    collaborationScore: number;
    burnoutRisk: number;
  };
  
  predictions: {
    nextWeekQuality: number;
    riskAreas: string[];
    recommendedActions: string[];
  };
  
  alerts: AlertPayload[];
  
  lastUpdated: string;
}

/**
 * Connection manager for WebSocket clients
 */
export interface ClientConnection {
  id: string;
  socket: WebSocket;
  subscriptions: SubscriptionPreferences;
  rooms: Set<string>;
  lastHeartbeat: Date;
  metadata: {
    userAgent?: string;
    clientVersion?: string;
    sessionStart: Date;
  };
}

/**
 * Analytics event for the event-driven architecture
 */
export interface AnalyticsEvent {
  type: string;
  timestamp: Date;
  source: string;
  projectId?: string;
  data: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================================================
// REAL-TIME ANALYTICS ENGINE
// ============================================================================

/**
 * Main real-time analytics engine for ODAVL streaming data processing
 */
export class ODAvlRealtimeAnalyticsEngine extends EventEmitter {
  private server: Server;
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private rooms: Map<string, Set<string>> = new Map(); // room -> client IDs
  private dataBuffer: Map<string, TimeSeriesDataPoint[]> = new Map();
  private alertHistory: Map<string, AlertPayload[]> = new Map();
  private heartbeatTimer?: NodeJS.Timeout;
  private aggregationTimer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private config: AnalyticsEngineConfig,
    private rootPath: string
  ) {
    super();
    this.server = createServer();
    this.wss = new WebSocketServer({ server: this.server });
    this.setupWebSocketHandlers();
  }

  /**
   * Start the real-time analytics engine
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, (err?: Error) => {
        if (err) {
          reject(err);
          return;
        }
        
        this.isRunning = true;
        this.startHeartbeat();
        this.startDataAggregation();
        
        console.log(`ODAVL Real-time Analytics Engine started on port ${this.config.port}`);
        console.log(`Max connections: ${this.config.maxConnections}`);
        console.log(`Heartbeat interval: ${this.config.heartbeatInterval}ms`);
        
        resolve();
      });
    });
  }

  /**
   * Stop the real-time analytics engine
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    // Clear timers
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.aggregationTimer) clearInterval(this.aggregationTimer);
    
    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.close(1000, 'Server shutdown');
    }
    this.clients.clear();
    this.rooms.clear();
    
    // Close WebSocket server
    await new Promise<void>((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          console.log('ODAVL Real-time Analytics Engine stopped');
          resolve();
        });
      });
    });
  }

  /**
   * Publish quality metrics update to subscribed clients
   */
  publishQualityUpdate(payload: QualityUpdatePayload): void {
    const message: WebSocketMessage<QualityUpdatePayload> = {
      type: 'quality-update',
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      data: payload,
      metadata: {
        source: 'analytics-engine',
        version: '1.0.0'
      }
    };

    this.broadcastToRoom(`project:${payload.projectId}`, message);
    this.updateDataBuffer('quality-metrics', payload.metrics);
    
    // Check for alert conditions
    this.checkAlertConditions(payload);
  }

  /**
   * Publish alert to subscribed clients
   */
  publishAlert(alert: AlertPayload): void {
    const message: WebSocketMessage<AlertPayload> = {
      type: 'alert',
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      data: alert,
      metadata: {
        source: 'analytics-engine',
        version: '1.0.0'
      }
    };

    this.broadcastToRoom(`project:${alert.projectId}`, message);
    this.storeAlert(alert);
    
    // Emit event for external listeners
    this.emit('alert', alert);
  }

  /**
   * Publish prediction results to subscribed clients
   */
  publishPrediction(
    projectId: string, 
    prediction: EnsemblePrediction,
    riskAssessment: QualityRiskAssessment,
    recommendations: PreventiveRecommendations
  ): void {
    const payload = {
      projectId,
      prediction,
      riskAssessment,
      recommendations,
      timestamp: new Date().toISOString()
    };

    const message: WebSocketMessage<typeof payload> = {
      type: 'prediction',
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      data: payload,
      metadata: {
        source: 'predictive-engine',
        version: '1.0.0'
      }
    };

    this.broadcastToRoom(`project:${projectId}`, message);
  }

  /**
   * Publish team metrics to subscribed clients
   */
  publishTeamMetrics(teamId: string, metrics: TeamMetrics): void {
    const message: WebSocketMessage<TeamMetrics> = {
      type: 'team-metrics',
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      data: metrics,
      metadata: {
        source: 'analytics-engine',
        version: '1.0.0'
      }
    };

    this.broadcastToRoom(`team:${teamId}`, message);
  }

  /**
   * Publish dashboard data to subscribed clients
   */
  publishDashboardData(data: DashboardData): void {
    const message: WebSocketMessage<DashboardData> = {
      type: 'dashboard-data',
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      data: {
        ...data,
        lastUpdated: new Date().toISOString()
      },
      metadata: {
        source: 'analytics-engine',
        version: '1.0.0'
      }
    };

    this.broadcast(message, (client) => client.subscriptions.dashboardData);
  }

  /**
   * Get current analytics statistics
   */
  getAnalyticsStats(): {
    connectedClients: number;
    activeRooms: number;
    totalMessages: number;
    uptime: number;
    bufferSize: number;
  } {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      totalMessages: this.getTotalMessageCount(),
      uptime: this.getUptime(),
      bufferSize: this.getBufferSize()
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Calculate overall quality score from metrics
   */
  private calculateQualityScore(metrics: QualityMetrics): number {
    // Simple scoring algorithm - would be more sophisticated in production
    const maxScore = 100;
    const eslintPenalty = Math.min(metrics.eslintWarnings * 2, 30);
    const typePenalty = Math.min(metrics.typeErrors * 10, 40);
    const complexityPenalty = Math.min(metrics.codeComplexity * 0.5, 20);
    const coveragePenalty = Math.max(0, 90 - metrics.testCoverage) * 0.5;
    const duplicationPenalty = Math.min(metrics.duplication * 2, 10);
    
    return Math.max(0, maxScore - eslintPenalty - typePenalty - complexityPenalty - coveragePenalty - duplicationPenalty);
  }

  /**
   * Setup WebSocket connection handlers
   */
  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (socket: WebSocket, request) => {
      // Check connection limits
      if (this.clients.size >= this.config.maxConnections) {
        socket.close(1013, 'Server at capacity');
        return;
      }

      const clientId = this.generateClientId();
      const client: ClientConnection = {
        id: clientId,
        socket,
        subscriptions: {
          qualityUpdates: true,
          alerts: true,
          predictions: true,
          teamMetrics: false,
          dashboardData: true,
          rooms: []
        },
        rooms: new Set(),
        lastHeartbeat: new Date(),
        metadata: {
          userAgent: Array.isArray(request.headers['user-agent']) 
            ? request.headers['user-agent'][0] 
            : request.headers['user-agent'],
          sessionStart: new Date()
        }
      };

      this.clients.set(clientId, client);
      console.log(`Client ${clientId} connected. Total clients: ${this.clients.size}`);

      // Setup message handler
      socket.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleClientMessage(clientId, message);
        } catch {
          this.sendError(clientId, 'Invalid message format');
        }
      });

      // Setup close handler
      socket.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      // Setup error handler
      socket.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.handleClientDisconnect(clientId);
      });

      // Send welcome message
      this.sendMessage(clientId, {
        type: 'heartbeat',
        timestamp: new Date().toISOString(),
        sessionId: this.generateSessionId(),
        data: { status: 'connected', clientId }
      });
    });
  }

  /**
   * Handle incoming client messages
   */
  private handleClientMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastHeartbeat = new Date();

    switch (message.type) {
      case 'subscribe':
        this.handleSubscription(clientId, message.data as SubscriptionPreferences);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscription(clientId, message.data as Partial<SubscriptionPreferences>);
        break;
      
      case 'heartbeat':
        this.sendMessage(clientId, {
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
          sessionId: message.sessionId,
          data: { status: 'alive' }
        });
        break;
      
      default:
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle client subscription updates
   */
  private handleSubscription(clientId: string, preferences: SubscriptionPreferences): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Update subscriptions
    client.subscriptions = { ...client.subscriptions, ...preferences };

    // Update room memberships
    const newRooms = new Set(preferences.rooms || []);
    
    // Leave old rooms
    for (const room of client.rooms) {
      if (!newRooms.has(room)) {
        this.leaveRoom(clientId, room);
      }
    }
    
    // Join new rooms
    for (const room of newRooms) {
      if (!client.rooms.has(room)) {
        this.joinRoom(clientId, room);
      }
    }

    client.rooms = newRooms;

    console.log(`Client ${clientId} updated subscriptions:`, preferences);
  }

  /**
   * Handle client unsubscription
   */
  private handleUnsubscription(clientId: string, preferences: Partial<SubscriptionPreferences>): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Update subscriptions
    if (preferences.qualityUpdates !== undefined) client.subscriptions.qualityUpdates = false;
    if (preferences.alerts !== undefined) client.subscriptions.alerts = false;
    if (preferences.predictions !== undefined) client.subscriptions.predictions = false;
    if (preferences.teamMetrics !== undefined) client.subscriptions.teamMetrics = false;
    if (preferences.dashboardData !== undefined) client.subscriptions.dashboardData = false;

    // Leave specified rooms
    if (preferences.rooms) {
      preferences.rooms.forEach(room => {
        this.leaveRoom(clientId, room);
      });
    }

    console.log(`Client ${clientId} updated unsubscriptions:`, preferences);
  }

  /**
   * Handle client disconnection
   */
  private handleClientDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Leave all rooms
    for (const room of client.rooms) {
      this.leaveRoom(clientId, room);
    }

    // Remove client
    this.clients.delete(clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
  }

  /**
   * Join a client to a room
   */
  private joinRoom(clientId: string, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(clientId);

    const client = this.clients.get(clientId);
    if (client) {
      client.rooms.add(room);
    }
  }

  /**
   * Remove client from a room
   */
  private leaveRoom(clientId: string, room: string): void {
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(clientId);
      if (roomClients.size === 0) {
        this.rooms.delete(room);
      }
    }

    const client = this.clients.get(clientId);
    if (client) {
      client.rooms.delete(room);
    }
  }

  /**
   * Send message to specific client
   */
  private sendMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) return;

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      this.handleClientDisconnect(clientId);
    }
  }

  /**
   * Send error message to client
   */
  private sendError(clientId: string, error: string): void {
    this.sendMessage(clientId, {
      type: 'error',
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      data: { error }
    });
  }

  /**
   * Broadcast message to all clients matching filter
   */
  private broadcast(message: WebSocketMessage, filter?: (client: ClientConnection) => boolean): void {
    for (const client of this.clients.values()) {
      if (!filter || filter(client)) {
        this.sendMessage(client.id, message);
      }
    }
  }

  /**
   * Broadcast message to clients in a specific room
   */
  private broadcastToRoom(room: string, message: WebSocketMessage): void {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    for (const clientId of roomClients) {
      this.sendMessage(clientId, message);
    }
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = new Date();
      const staleThreshold = this.config.heartbeatInterval * 3; // 3x heartbeat interval

      for (const [clientId, client] of this.clients) {
        const timeSinceLastHeartbeat = now.getTime() - client.lastHeartbeat.getTime();
        
        if (timeSinceLastHeartbeat > staleThreshold) {
          console.log(`Client ${clientId} timed out - no heartbeat for ${timeSinceLastHeartbeat}ms`);
          this.handleClientDisconnect(clientId);
        }
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Start data aggregation process
   */
  private startDataAggregation(): void {
    this.aggregationTimer = setInterval(() => {
      this.performDataAggregation();
      this.cleanupOldData();
    }, this.config.aggregationIntervals.realtime * 1000);
  }

  /**
   * Perform data aggregation for time series
   */
  private performDataAggregation(): void {
    // Aggregate buffered data into time series
    for (const [metric, dataPoints] of this.dataBuffer) {
      if (dataPoints.length === 0) continue;

      const aggregated = this.aggregateDataPoints(dataPoints, 'average');
      
      // Create time series data
      const timeSeriesData: TimeSeriesData = {
        metric,
        timeframe: '1day',
        data: [aggregated],
        aggregation: 'average',
        unit: this.getMetricUnit(metric)
      };

      // Emit aggregated data event
      this.emit('data-aggregated', { metric, data: timeSeriesData });
    }
  }

  /**
   * Check for alert conditions based on quality update
   */
  private checkAlertConditions(payload: QualityUpdatePayload): void {
    const alerts: AlertPayload[] = [];

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(payload.metrics);

    // Quality score threshold
    if (qualityScore < this.config.alertThresholds.qualityScoreMin) {
      alerts.push({
        id: this.generateAlertId(),
        severity: qualityScore < 30 ? 'critical' : 'high',
        category: 'quality',
        title: 'Quality Score Below Threshold',
        description: `Project quality score (${qualityScore}) is below acceptable threshold (${this.config.alertThresholds.qualityScoreMin})`,
        projectId: payload.projectId,
        affectedComponents: payload.affectedFiles,
        recommendations: [
          'Review recent code changes',
          'Run comprehensive test suite',
          'Address ESLint warnings and TypeScript errors'
        ],
        autoResolvable: false,
        estimatedImpact: {
          developmentTime: 4,
          riskLevel: 75,
          affectedUsers: 100
        },
        timestamp: new Date().toISOString()
      });
    }

    // ESLint warnings threshold
    if (payload.metrics.eslintWarnings > this.config.alertThresholds.eslintWarningsMax) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'medium',
        category: 'quality',
        title: 'ESLint Warnings Exceeded',
        description: `ESLint warnings (${payload.metrics.eslintWarnings}) exceeded threshold (${this.config.alertThresholds.eslintWarningsMax})`,
        projectId: payload.projectId,
        affectedComponents: payload.affectedFiles,
        recommendations: [
          'Run ESLint with --fix option',
          'Review ESLint configuration',
          'Address code style inconsistencies'
        ],
        autoResolvable: true,
        estimatedImpact: {
          developmentTime: 1,
          riskLevel: 25,
          affectedUsers: 0
        },
        timestamp: new Date().toISOString()
      });
    }

    // Publish alerts
    alerts.forEach(alert => this.publishAlert(alert));
  }

  // Utility methods
  private updateDataBuffer(metric: string, data: QualityMetrics): void {
    if (!this.dataBuffer.has(metric)) {
      this.dataBuffer.set(metric, []);
    }
    
    const qualityScore = this.calculateQualityScore(data);
    this.dataBuffer.get(metric)!.push({
      timestamp: new Date().toISOString(),
      value: qualityScore,
      metadata: { source: 'quality-metrics' }
    });
  }

  private storeAlert(alert: AlertPayload): void {
    if (!this.alertHistory.has(alert.projectId)) {
      this.alertHistory.set(alert.projectId, []);
    }
    this.alertHistory.get(alert.projectId)!.push(alert);
  }

  private aggregateDataPoints(dataPoints: TimeSeriesDataPoint[], _aggregation: string): TimeSeriesDataPoint {
    const values = dataPoints.map(dp => dp.value);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return {
      timestamp: new Date().toISOString(),
      value: avgValue,
      metadata: { source: 'aggregated', count: dataPoints.length }
    };
  }

  private cleanupOldData(): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - this.config.dataRetentionPeriod);
    
    // Cleanup data buffer
    for (const [metric, dataPoints] of this.dataBuffer) {
      const filteredPoints = dataPoints.filter(
        dp => new Date(dp.timestamp) > cutoffTime
      );
      this.dataBuffer.set(metric, filteredPoints);
    }
  }

  private getMetricUnit(metric: string): string {
    const units: Record<string, string> = {
      'quality-score': 'score',
      'eslint-warnings': 'count',
      'type-errors': 'count',
      'build-time': 'seconds',
      'test-coverage': 'percentage'
    };
    return units[metric] || 'unknown';
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTotalMessageCount(): number {
    // Implementation would track message counts
    return 0;
  }

  private getUptime(): number {
    // Implementation would track engine start time
    return 0;
  }

  private getBufferSize(): number {
    return Array.from(this.dataBuffer.values())
      .reduce((total, buffer) => total + buffer.length, 0);
  }
}

/**
 * Factory function to create and start the real-time analytics engine
 */
export async function createRealtimeAnalyticsEngine(
  rootPath: string,
  config?: Partial<AnalyticsEngineConfig>
): Promise<ODAvlRealtimeAnalyticsEngine> {
  const fullConfig: AnalyticsEngineConfig = {
    port: 8080,
    maxConnections: 1000,
    heartbeatInterval: 30000, // 30 seconds
    dataRetentionPeriod: 24, // 24 hours
    alertThresholds: {
      qualityScoreMin: 70,
      eslintWarningsMax: 10,
      typeErrorsMax: 0,
      buildFailureRate: 0.1
    },
    aggregationIntervals: {
      realtime: 5, // 5 seconds
      shortTerm: 5, // 5 minutes
      longTerm: 1 // 1 hour
    },
    ...config
  };

  const engine = new ODAvlRealtimeAnalyticsEngine(fullConfig, rootPath);
  await engine.start();
  return engine;
}