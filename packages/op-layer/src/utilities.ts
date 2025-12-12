/**
 * ODAVL Protocol Layer - Shared Utilities
 * Product-agnostic utilities for all ODAVL products
 */

import chalk from 'chalk';

// ============================================================================
// Phase 3B: Parallel Execution Utilities
// ============================================================================

export * from './utilities/parallel.js';

// ============================================================================
// Phase 3B: Global Caching Layer
// ============================================================================

export * from './cache/global-cache.js';

// ============================================================================
// Phase 3B: Performance Profiling Utilities
// ============================================================================

export * from './utilities/performance.js';

// ============================================================================
// Logger Utility
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level || 'info';
    this.prefix = options.prefix || '';
    this.timestamp = options.timestamp ?? true;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private format(level: LogLevel, message: string): string {
    const parts: string[] = [];
    
    if (this.timestamp) {
      parts.push(chalk.gray(new Date().toISOString()));
    }
    
    if (this.prefix) {
      parts.push(chalk.cyan(`[${this.prefix}]`));
    }
    
    const levelColors = {
      debug: chalk.gray,
      info: chalk.blue,
      warn: chalk.yellow,
      error: chalk.red,
    };
    
    parts.push(levelColors[level](`[${level.toUpperCase()}]`));
    parts.push(message);
    
    return parts.join(' ');
  }

  debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.log(this.format('debug', message));
    }
  }

  info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message));
    }
  }

  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message));
    }
  }

  error(message: string, error?: Error): void {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message));
      if (error) {
        console.error(chalk.red(error.stack || error.message));
      }
    }
  }
}

// Export singleton logger instance
export const logger = new Logger();

// ============================================================================
// Cache Utility (LRU Cache)
// ============================================================================

export interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}

export class Cache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value as string;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Progress Tracker
// ============================================================================

export class ProgressTracker {
  private total: number;
  private current: number = 0;
  private label: string;

  constructor(total: number, label: string = 'Progress') {
    this.total = total;
    this.label = label;
  }

  increment(amount: number = 1): void {
    this.current += amount;
    this.render();
  }

  setProgress(current: number): void {
    this.current = current;
    this.render();
  }

  private render(): void {
    const percentage = Math.round((this.current / this.total) * 100);
    const bar = this.createBar(percentage);
    process.stdout.write(`\r${this.label}: ${bar} ${percentage}% (${this.current}/${this.total})`);
    
    if (this.current >= this.total) {
      process.stdout.write('\n');
    }
  }

  private createBar(percentage: number): string {
    const barLength = 30;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  }

  complete(): void {
    this.current = this.total;
    this.render();
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function formatTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

// ============================================================================
// Async Utilities
// ============================================================================

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, backoff = 2 } = options;
  
  let lastError: Error;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await sleep(delay * Math.pow(backoff, i));
      }
    }
  }
  
  throw lastError!;
}

export async function timeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

// ============================================================================
// File System Helpers
// ============================================================================

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

export function isAbsolutePath(path: string): boolean {
  return /^([a-zA-Z]:)?[\/\\]/.test(path);
}

export function joinPaths(...paths: string[]): string {
  return paths
    .map(p => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
}
