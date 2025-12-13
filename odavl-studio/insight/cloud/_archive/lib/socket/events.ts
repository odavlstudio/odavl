/**
 * Socket.IO Event Type Definitions
 * Type-safe event system for real-time communication
 */

// ==================== Project Events ====================

export interface ProjectUpdatePayload {
  projectId: string;
  userId: string;
  updateType: 'code' | 'config' | 'member' | 'analysis';
  data: unknown;
  timestamp: string;
}

export interface ProjectUserJoinedPayload {
  userId: string;
  email: string;
  name: string;
  projectId: string;
}

export interface ProjectUserLeftPayload {
  userId: string;
  email: string;
  projectId: string;
  reason?: string;
}

// ==================== Analysis Events ====================

export interface AnalysisStartedPayload {
  analysisId: string;
  projectId: string;
  userId: string;
  detectors: string[];
  timestamp: string;
}

export interface AnalysisProgressPayload {
  analysisId: string;
  projectId: string;
  detector: string;
  progress: number; // 0-100
  status: 'running' | 'complete' | 'error';
  issuesFound?: number;
  estimatedTimeRemaining?: number; // seconds
  timestamp: string;
}

export interface AnalysisCompletePayload {
  analysisId: string;
  projectId: string;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  duration: number; // seconds
  timestamp: string;
}

export interface AnalysisErrorPayload {
  analysisId: string;
  projectId: string;
  detector: string;
  error: string;
  timestamp: string;
}

export interface AnalysisCancelledPayload {
  analysisId: string;
  projectId: string;
  userId: string;
  timestamp: string;
}

// ==================== Notification Events ====================

export interface NotificationPayload {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface NotificationReadPayload {
  notificationId: string;
  userId: string;
  timestamp: string;
}

// ==================== User Presence Events ====================

export interface UserStatusPayload {
  userId: string;
  email: string;
  status: 'online' | 'away' | 'offline';
  currentProject?: string;
  lastSeen: string;
}

export interface PresenceChangedPayload {
  userId: string;
  email: string;
  status: 'online' | 'away' | 'offline';
  timestamp: string;
}

// ==================== Comment Events ====================

export interface CommentCreatedPayload {
  commentId: string;
  projectId: string;
  userId: string;
  userName: string;
  fileePath: string;
  line: number;
  content: string;
  timestamp: string;
}

export interface CommentResolvedPayload {
  commentId: string;
  projectId: string;
  userId: string;
  timestamp: string;
}

// ==================== Connection Events ====================

export interface ConnectedPayload {
  message: string;
  user: {
    userId: string;
    email: string;
    name: string;
  };
  timestamp: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  timestamp: string;
}

// ==================== Event Map (Type-Safe) ====================

export interface ServerToClientEvents {
  // Connection
  connected: (data: ConnectedPayload) => void;
  error: (data: ErrorPayload) => void;

  // Projects
  'project:update': (data: ProjectUpdatePayload) => void;
  'project:user:joined': (data: ProjectUserJoinedPayload) => void;
  'project:user:left': (data: ProjectUserLeftPayload) => void;

  // Analysis
  'analysis:started': (data: AnalysisStartedPayload) => void;
  'analysis:progress': (data: AnalysisProgressPayload) => void;
  'analysis:complete': (data: AnalysisCompletePayload) => void;
  'analysis:error': (data: AnalysisErrorPayload) => void;
  'analysis:cancelled': (data: AnalysisCancelledPayload) => void;

  // Notifications
  'notification:new': (data: NotificationPayload) => void;
  'notification:read': (data: NotificationReadPayload) => void;

  // Presence
  'presence:changed': (data: PresenceChangedPayload) => void;

  // Comments
  'comment:created': (data: CommentCreatedPayload) => void;
  'comment:resolved': (data: CommentResolvedPayload) => void;
}

export interface ClientToServerEvents {
  // Project management
  'project:join': (projectId: string) => void;
  'project:leave': (projectId: string) => void;

  // Presence
  'presence:update': (status: 'online' | 'away' | 'offline') => void;

  // Analysis control
  'analysis:cancel': (analysisId: string) => void;

  // Comments
  'comment:create': (data: Omit<CommentCreatedPayload, 'commentId' | 'timestamp'>) => void;
  'comment:resolve': (commentId: string) => void;
}

// ==================== Type Guards ====================

export function isAnalysisProgress(data: unknown): data is AnalysisProgressPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    'analysisId' in data &&
    'detector' in data &&
    'progress' in data
  );
}

export function isNotification(data: unknown): data is NotificationPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'userId' in data &&
    'type' in data &&
    'title' in data
  );
}

export function isPresenceChanged(data: unknown): data is PresenceChangedPayload {
  return (
    typeof data === 'object' &&
    data !== null &&
    'userId' in data &&
    'status' in data &&
    'timestamp' in data
  );
}
