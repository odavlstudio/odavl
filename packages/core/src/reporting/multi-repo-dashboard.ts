/**
 * @fileoverview Multi-Repository Reporting Dashboard
 * Provides real-time visualization of concurrent repository analysis
 * Supports CLI, JSON, and event streaming outputs
 * 
 * Features:
 * - Live progress tracking with ETA
 * - Rich terminal UI (tables, progress bars, colors)
 * - JSON export for CI/CD integration
 * - Event streaming for external dashboards
 * - Historical comparison and trends
 * 
 * @module reporting/multi-repo-dashboard
 */

import { EventEmitter } from 'events';
import type { AnalysisResult, ConcurrentAnalysisResult } from '../concurrent/concurrent-repository-analyzer';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Dashboard configuration options
 */
export interface DashboardOptions {
  /** Output format: cli, json, events, html */
  format?: 'cli' | 'json' | 'events' | 'html';
  
  /** Enable real-time updates (CLI mode) */
  realtime?: boolean;
  
  /** Update interval in milliseconds (CLI mode) */
  updateInterval?: number;
  
  /** Enable colored output (CLI mode) */
  colors?: boolean;
  
  /** Show detailed statistics */
  verbose?: boolean;
  
  /** Output file path (JSON/HTML mode) */
  outputPath?: string;
  
  /** Compare with previous run (requires history) */
  compare?: boolean;
  
  /** Export format for results */
  exportFormat?: 'json' | 'csv' | 'html' | 'markdown';
}

/**
 * Repository status for dashboard tracking
 */
export interface RepoStatus {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cached' | 'timeout';
  progress: number; // 0-100
  startTime?: number;
  endTime?: number;
  duration?: number;
  issues?: number;
  linesOfCode?: number;
  filesAnalyzed?: number;
  cacheHit?: boolean;
  error?: string;
  priority?: number;
}

/**
 * Live dashboard state
 */
export interface DashboardState {
  totalRepos: number;
  completed: number;
  running: number;
  pending: number;
  failed: number;
  cached: number;
  startTime: number;
  currentTime: number;
  estimatedTimeRemaining?: number;
  overallProgress: number; // 0-100
  repositories: Map<string, RepoStatus>;
  totalIssues: number;
  totalLOC: number;
  cacheHitRate: number;
}

/**
 * Comparison report between two runs
 */
export interface ComparisonReport {
  previous: {
    timestamp: number;
    totalIssues: number;
    totalRepos: number;
    duration: number;
  };
  current: {
    timestamp: number;
    totalIssues: number;
    totalRepos: number;
    duration: number;
  };
  delta: {
    issues: number; // positive = more issues, negative = fewer
    issuesPercent: number;
    duration: number;
    durationPercent: number;
  };
  improvements: string[];
  regressions: string[];
}

/**
 * Export data structure
 */
export interface ExportData {
  metadata: {
    timestamp: number;
    duration: number;
    format: string;
    version: string;
  };
  summary: {
    totalRepos: number;
    successful: number;
    failed: number;
    cached: number;
    totalIssues: number;
    totalLOC: number;
    averageDuration: number;
    cacheHitRate: number;
  };
  repositories: Array<{
    id: string;
    name: string;
    status: string;
    duration: number;
    issues: number;
    linesOfCode: number;
    filesAnalyzed: number;
    cached: boolean;
    error?: string;
  }>;
  trends?: {
    issuesOverTime: number[];
    performanceOverTime: number[];
  };
}

// ============================================================================
// Multi-Repo Dashboard Class
// ============================================================================

/**
 * Real-time dashboard for monitoring concurrent repository analysis
 */
export class MultiRepoDashboard extends EventEmitter {
  private options: Required<DashboardOptions>;
  private state: DashboardState;
  private updateTimer?: NodeJS.Timeout;
  private history: ExportData[] = [];

  constructor(options: DashboardOptions = {}) {
    super();
    
    this.options = {
      format: options.format || 'cli',
      realtime: options.realtime ?? true,
      updateInterval: options.updateInterval || 500, // 500ms
      colors: options.colors ?? true,
      verbose: options.verbose ?? false,
      outputPath: options.outputPath || './reports/multi-repo-analysis.json',
      compare: options.compare ?? false,
      exportFormat: options.exportFormat || 'json',
    };

    this.state = {
      totalRepos: 0,
      completed: 0,
      running: 0,
      pending: 0,
      failed: 0,
      cached: 0,
      startTime: Date.now(),
      currentTime: Date.now(),
      overallProgress: 0,
      repositories: new Map(),
      totalIssues: 0,
      totalLOC: 0,
      cacheHitRate: 0,
    };
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Initialize dashboard with repositories
   */
  initialize(repositories: Array<{ id: string; name: string; priority?: number }>): void {
    this.state.totalRepos = repositories.length;
    this.state.pending = repositories.length;
    this.state.startTime = Date.now();
    this.state.currentTime = Date.now();

    // Initialize all repos as pending
    repositories.forEach(repo => {
      this.state.repositories.set(repo.id, {
        id: repo.id,
        name: repo.name,
        status: 'pending',
        progress: 0,
        priority: repo.priority,
      });
    });

    this.emit('initialized', { totalRepos: this.state.totalRepos });

    // Start real-time updates if enabled
    if (this.options.realtime && this.options.format === 'cli') {
      this.startRealtimeUpdates();
    }
  }

  /**
   * Update repository status
   */
  updateRepo(repoId: string, update: Partial<RepoStatus>): void {
    const repo = this.state.repositories.get(repoId);
    if (!repo) return;

    Object.assign(repo, update);
    this.state.repositories.set(repoId, repo);
    this.updateStateCounts();
    this.calculateProgress();

    this.emit('repoUpdated', { repoId, status: repo.status });
  }

  /**
   * Mark repository as started
   */
  onRepoStart(repoId: string): void {
    this.updateRepo(repoId, {
      status: 'running',
      startTime: Date.now(),
      progress: 0,
    });

    if (this.options.format === 'cli' && !this.options.realtime) {
      this.renderCLI();
    }
  }

  /**
   * Mark repository as completed
   */
  onRepoComplete(repoId: string, result: AnalysisResult): void {
    const repo = this.state.repositories.get(repoId);
    if (!repo) return;

    this.updateRepo(repoId, {
      status: 'completed',
      endTime: Date.now(),
      duration: Date.now() - (repo.startTime || Date.now()),
      progress: 100,
      issues: result.issues?.length || 0,
      linesOfCode: result.metrics?.linesOfCode || 0,
      filesAnalyzed: result.metrics?.filesAnalyzed || 0,
    });

    this.state.totalIssues += result.issues?.length || 0;
    this.state.totalLOC += result.metrics?.linesOfCode || 0;

    if (this.options.format === 'cli' && !this.options.realtime) {
      this.renderCLI();
    }
  }

  /**
   * Mark repository as failed
   */
  onRepoError(repoId: string, error: Error): void {
    this.updateRepo(repoId, {
      status: 'failed',
      endTime: Date.now(),
      progress: 0,
      error: error.message,
    });

    if (this.options.format === 'cli' && !this.options.realtime) {
      this.renderCLI();
    }
  }

  /**
   * Mark repository as cached
   */
  onCacheHit(repoId: string): void {
    this.updateRepo(repoId, {
      status: 'cached',
      cacheHit: true,
      progress: 100,
    });

    if (this.options.format === 'cli' && !this.options.realtime) {
      this.renderCLI();
    }
  }

  /**
   * Finalize dashboard and generate report
   */
  async finalize(result: ConcurrentAnalysisResult): Promise<void> {
    // Stop real-time updates
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.state.currentTime = Date.now();

    // Render final output
    switch (this.options.format) {
      case 'cli':
        this.renderFinalCLI(result);
        break;
      case 'json':
        await this.exportJSON(result);
        break;
      case 'html':
        await this.exportHTML(result);
        break;
      case 'events':
        this.emit('complete', { result, state: this.state });
        break;
    }

    // Generate comparison if enabled
    if (this.options.compare && this.history.length > 0) {
      const comparison = this.generateComparison(result);
      this.emit('comparison', comparison);
      
      if (this.options.format === 'cli') {
        this.renderComparison(comparison);
      }
    }

    // Save to history
    this.history.push(this.createExportData(result));

    this.emit('finalized', { result });
  }

  // --------------------------------------------------------------------------
  // Private Methods - State Management
  // --------------------------------------------------------------------------

  private updateStateCounts(): void {
    let completed = 0, running = 0, pending = 0, failed = 0, cached = 0;

    this.state.repositories.forEach(repo => {
      switch (repo.status) {
        case 'completed': completed++; break;
        case 'running': running++; break;
        case 'pending': pending++; break;
        case 'failed': failed++; break;
        case 'cached': cached++; break;
      }
    });

    this.state.completed = completed;
    this.state.running = running;
    this.state.pending = pending;
    this.state.failed = failed;
    this.state.cached = cached;
  }

  private calculateProgress(): void {
    const total = this.state.totalRepos;
    const done = this.state.completed + this.state.failed + this.state.cached;
    this.state.overallProgress = total > 0 ? Math.round((done / total) * 100) : 0;

    // Calculate cache hit rate
    const totalDone = done;
    this.state.cacheHitRate = totalDone > 0 
      ? Math.round((this.state.cached / totalDone) * 100) 
      : 0;

    // Estimate time remaining (simple linear projection)
    if (done > 0 && this.state.running > 0) {
      const elapsed = Date.now() - this.state.startTime;
      const avgTimePerRepo = elapsed / done;
      const remaining = total - done;
      this.state.estimatedTimeRemaining = Math.round(avgTimePerRepo * remaining);
    }
  }

  // --------------------------------------------------------------------------
  // Private Methods - CLI Rendering
  // --------------------------------------------------------------------------

  private startRealtimeUpdates(): void {
    this.updateTimer = setInterval(() => {
      this.state.currentTime = Date.now();
      this.calculateProgress();
      this.renderCLI();
    }, this.options.updateInterval);
  }

  private renderCLI(): void {
    if (!process.stdout.isTTY) return;

    // Clear screen (move cursor to top-left)
    process.stdout.write('\x1B[2J\x1B[0f');

    const lines: string[] = [];

    // Header
    lines.push(this.colorize('='.repeat(80), 'cyan'));
    lines.push(this.colorize('  ODAVL Multi-Repository Analysis Dashboard', 'cyan', true));
    lines.push(this.colorize('='.repeat(80), 'cyan'));
    lines.push('');

    // Overall progress
    const progressBar = this.createProgressBar(this.state.overallProgress, 40);
    lines.push(`  Overall Progress: ${progressBar} ${this.state.overallProgress}%`);
    lines.push('');

    // Statistics
    lines.push(this.colorize('  Statistics:', 'white', true));
    lines.push(`    Total Repositories: ${this.state.totalRepos}`);
    lines.push(`    ${this.colorize('✓', 'green')} Completed: ${this.state.completed}`);
    lines.push(`    ${this.colorize('◉', 'yellow')} Running: ${this.state.running}`);
    lines.push(`    ${this.colorize('○', 'gray')} Pending: ${this.state.pending}`);
    lines.push(`    ${this.colorize('⚡', 'blue')} Cached: ${this.state.cached} (${this.state.cacheHitRate}%)`);
    if (this.state.failed > 0) {
      lines.push(`    ${this.colorize('✗', 'red')} Failed: ${this.state.failed}`);
    }
    lines.push('');

    // Timing
    const elapsed = Date.now() - this.state.startTime;
    lines.push(`    Elapsed Time: ${this.formatDuration(elapsed)}`);
    if (this.state.estimatedTimeRemaining) {
      lines.push(`    Estimated Remaining: ${this.formatDuration(this.state.estimatedTimeRemaining)}`);
    }
    lines.push('');

    // Repository details (top 10 by priority)
    lines.push(this.colorize('  Repository Status:', 'white', true));
    const repos = Array.from(this.state.repositories.values())
      .sort((a, b) => (b.priority || 5) - (a.priority || 5))
      .slice(0, 10);

    repos.forEach(repo => {
      const statusIcon = this.getStatusIcon(repo.status);
      const statusColor = this.getStatusColor(repo.status);
      const status = this.colorize(statusIcon, statusColor);
      const name = repo.name.padEnd(30).slice(0, 30);
      
      let line = `    ${status} ${name}`;
      
      if (repo.status === 'running') {
        const bar = this.createProgressBar(repo.progress, 20);
        line += ` ${bar} ${repo.progress}%`;
      } else if (repo.status === 'completed') {
        line += ` ${this.colorize(`${repo.issues} issues`, 'gray')}`;
      } else if (repo.status === 'failed') {
        line += ` ${this.colorize(repo.error || 'Unknown error', 'red')}`;
      }
      
      lines.push(line);
    });

    lines.push('');
    lines.push(this.colorize('─'.repeat(80), 'gray'));

    console.log(lines.join('\n'));
  }

  private renderFinalCLI(result: ConcurrentAnalysisResult): void {
    // Clear screen
    if (process.stdout.isTTY) {
      process.stdout.write('\x1B[2J\x1B[0f');
    }

    const lines: string[] = [];

    // Header
    lines.push(this.colorize('='.repeat(80), 'green'));
    lines.push(this.colorize('  ✓ Multi-Repository Analysis Complete', 'green', true));
    lines.push(this.colorize('='.repeat(80), 'green'));
    lines.push('');

    // Summary
    lines.push(this.colorize('  Summary:', 'white', true));
    lines.push(`    Total Repositories: ${result.summary.total}`);
    lines.push(`    ${this.colorize('✓', 'green')} Successful: ${result.summary.successful}`);
    lines.push(`    ${this.colorize('✗', 'red')} Failed: ${result.summary.failed}`);
    lines.push(`    ${this.colorize('⚡', 'blue')} Cached: ${result.summary.cached}`);
    lines.push('');
    lines.push(`    Total Issues Found: ${this.colorize(result.summary.totalIssues.toString(), 'yellow', true)}`);
    lines.push(`    Total Lines of Code: ${this.formatNumber(result.summary.totalLOC)}`);
    lines.push(`    Average Duration: ${this.formatDuration(result.summary.averageDuration)}`);
    lines.push(`    Cache Hit Rate: ${result.summary.cacheHitRate}%`);
    lines.push('');

    // Detailed results
    if (this.options.verbose) {
      lines.push(this.colorize('  Detailed Results:', 'white', true));
      result.results.forEach(repo => {
        const statusIcon = repo.error ? this.colorize('✗', 'red') : this.colorize('✓', 'green');
        lines.push(`    ${statusIcon} ${repo.repositoryId}`);
        lines.push(`       Issues: ${repo.issues?.length || 0}, LOC: ${this.formatNumber(repo.metrics?.linesOfCode || 0)}, Duration: ${this.formatDuration(repo.metrics?.duration || 0)}`);
      });
      lines.push('');
    }

    lines.push(this.colorize('='.repeat(80), 'green'));

    console.log(lines.join('\n'));
  }

  private renderComparison(comparison: ComparisonReport): void {
    const lines: string[] = [];

    lines.push('');
    lines.push(this.colorize('  Comparison with Previous Run:', 'white', true));
    lines.push('');

    // Issues delta
    const issuesDelta = comparison.delta.issues;
    const issuesColor = issuesDelta > 0 ? 'red' : issuesDelta < 0 ? 'green' : 'gray';
    const issuesSign = issuesDelta > 0 ? '+' : '';
    lines.push(`    Issues: ${this.colorize(`${issuesSign}${issuesDelta}`, issuesColor)} (${comparison.delta.issuesPercent.toFixed(1)}%)`);

    // Duration delta
    const durationDelta = comparison.delta.duration;
    const durationColor = durationDelta > 0 ? 'red' : durationDelta < 0 ? 'green' : 'gray';
    const durationSign = durationDelta > 0 ? '+' : '';
    lines.push(`    Duration: ${this.colorize(`${durationSign}${this.formatDuration(durationDelta)}`, durationColor)} (${comparison.delta.durationPercent.toFixed(1)}%)`);
    lines.push('');

    if (comparison.improvements.length > 0) {
      lines.push(this.colorize('    Improvements:', 'green'));
      comparison.improvements.forEach(item => lines.push(`      ✓ ${item}`));
      lines.push('');
    }

    if (comparison.regressions.length > 0) {
      lines.push(this.colorize('    Regressions:', 'red'));
      comparison.regressions.forEach(item => lines.push(`      ✗ ${item}`));
      lines.push('');
    }

    console.log(lines.join('\n'));
  }

  // --------------------------------------------------------------------------
  // Private Methods - Export
  // --------------------------------------------------------------------------

  private createExportData(result: ConcurrentAnalysisResult): ExportData {
    return {
      metadata: {
        timestamp: Date.now(),
        duration: Date.now() - this.state.startTime,
        format: this.options.exportFormat,
        version: '1.0.0',
      },
      summary: {
        totalRepos: result.summary.total,
        successful: result.summary.successful,
        failed: result.summary.failed,
        cached: result.summary.cached,
        totalIssues: result.summary.totalIssues,
        totalLOC: result.summary.totalLOC,
        averageDuration: result.summary.averageDuration,
        cacheHitRate: result.summary.cacheHitRate,
      },
      repositories: result.results.map(repo => ({
        id: repo.repositoryId,
        name: repo.repositoryName || repo.repositoryId,
        status: repo.error ? 'failed' : 'completed',
        duration: repo.metrics?.duration || 0,
        issues: repo.issues?.length || 0,
        linesOfCode: repo.metrics?.linesOfCode || 0,
        filesAnalyzed: repo.metrics?.filesAnalyzed || 0,
        cached: repo.metrics?.cached || false,
        error: repo.error,
      })),
    };
  }

  private async exportJSON(result: ConcurrentAnalysisResult): Promise<void> {
    const data = this.createExportData(result);
    const json = JSON.stringify(data, null, 2);
    
    // In real implementation, write to file
    console.log(json);
    
    this.emit('exported', { format: 'json', path: this.options.outputPath });
  }

  private async exportHTML(result: ConcurrentAnalysisResult): Promise<void> {
    // HTML export implementation would go here
    this.emit('exported', { format: 'html', path: this.options.outputPath });
  }

  private generateComparison(current: ConcurrentAnalysisResult): ComparisonReport {
    const previous = this.history[this.history.length - 1];
    
    const issuesDelta = current.summary.totalIssues - previous.summary.totalIssues;
    const durationDelta = (Date.now() - this.state.startTime) - previous.metadata.duration;

    const improvements: string[] = [];
    const regressions: string[] = [];

    if (issuesDelta < 0) {
      improvements.push(`${Math.abs(issuesDelta)} fewer issues detected`);
    } else if (issuesDelta > 0) {
      regressions.push(`${issuesDelta} more issues detected`);
    }

    if (durationDelta < 0) {
      improvements.push(`Analysis ${this.formatDuration(Math.abs(durationDelta))} faster`);
    } else if (durationDelta > 0) {
      regressions.push(`Analysis ${this.formatDuration(durationDelta)} slower`);
    }

    return {
      previous: {
        timestamp: previous.metadata.timestamp,
        totalIssues: previous.summary.totalIssues,
        totalRepos: previous.summary.totalRepos,
        duration: previous.metadata.duration,
      },
      current: {
        timestamp: Date.now(),
        totalIssues: current.summary.totalIssues,
        totalRepos: current.summary.total,
        duration: Date.now() - this.state.startTime,
      },
      delta: {
        issues: issuesDelta,
        issuesPercent: previous.summary.totalIssues > 0 
          ? (issuesDelta / previous.summary.totalIssues) * 100 
          : 0,
        duration: durationDelta,
        durationPercent: previous.metadata.duration > 0 
          ? (durationDelta / previous.metadata.duration) * 100 
          : 0,
      },
      improvements,
      regressions,
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods - Utilities
  // --------------------------------------------------------------------------

  private colorize(text: string, color: string, bold = false): string {
    if (!this.options.colors) return text;

    const colors: Record<string, string> = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',
    };

    const colorCode = colors[color] || '';
    const boldCode = bold ? '\x1b[1m' : '';
    const reset = '\x1b[0m';

    return `${boldCode}${colorCode}${text}${reset}`;
  }

  private createProgressBar(percent: number, width: number): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return this.colorize(bar, percent === 100 ? 'green' : 'cyan');
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: '○',
      running: '◉',
      completed: '✓',
      failed: '✗',
      cached: '⚡',
      timeout: '⏱',
    };
    return icons[status] || '?';
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'gray',
      running: 'yellow',
      completed: 'green',
      failed: 'red',
      cached: 'blue',
      timeout: 'yellow',
    };
    return colors[status] || 'white';
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a new dashboard instance
 */
export function createDashboard(options?: DashboardOptions): MultiRepoDashboard {
  return new MultiRepoDashboard(options);
}

/**
 * Create and run dashboard for concurrent analysis
 */
export async function runDashboard(
  analyzer: any, // ConcurrentRepositoryAnalyzer
  repositories: Array<{ id: string; name: string; path: string; priority?: number }>,
  options?: DashboardOptions
): Promise<ConcurrentAnalysisResult> {
  const dashboard = createDashboard(options);

  // Initialize dashboard
  dashboard.initialize(repositories);

  // Connect analyzer events to dashboard
  analyzer.on('batchStart', () => {
    // Batch started
  });

  analyzer.on('repoStart', ({ id }: { id: string }) => {
    dashboard.onRepoStart(id);
  });

  analyzer.on('repoComplete', ({ id, result }: { id: string; result: AnalysisResult }) => {
    dashboard.onRepoComplete(id, result);
  });

  analyzer.on('repoError', ({ id, error }: { id: string; error: Error }) => {
    dashboard.onRepoError(id, error);
  });

  analyzer.on('cacheHit', ({ id }: { id: string }) => {
    dashboard.onCacheHit(id);
  });

  // Run analysis
  const result = await analyzer.analyzeRepositories(repositories);

  // Finalize dashboard
  await dashboard.finalize(result);

  return result;
}
