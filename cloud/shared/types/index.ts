/**
 * Shared TypeScript interfaces for ODAVL Cloud Platform
 */

export interface CloudJob {
  id: string;
  product: 'insight' | 'autopilot' | 'guardian';
  action: string;
  payload: Record<string, unknown>;
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface CloudEvent {
  id: string;
  type: string;
  product: 'insight' | 'autopilot' | 'guardian';
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CloudConfig {
  port: number;
  environment: 'development' | 'staging' | 'production';
  apiKey?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
