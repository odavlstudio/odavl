/**
 * Performance Profiler Detector
 * Integrates real-time performance profiling with ODAVL Insight
 */

import { PerformanceProfiler, PerformanceMetrics, PerformanceBottleneck } from '../profiler/performance-profiler.js';

export interface ProfilerResult {
  name: string;
  issues: ProfilerIssue[];
  metrics: PerformanceMetrics;
  summary: {
    score: number;
    slowFunctions: number;
    memoryLeaks: number;
    largeFiles: number;
    bottlenecks: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
}

export interface ProfilerIssue {
  type: 'performance-bottleneck';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line?: number;
  bottleneck: PerformanceBottleneck;
  metric: string;
  impact: string;
  recommendation: string;
}

export class PerformanceProfilerDetector {
  private workspaceRoot: string;
  private profiler: PerformanceProfiler;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.profiler = new PerformanceProfiler(workspaceRoot);
  }

  /**
   * Run performance profiling
   */
  async detect(): Promise<ProfilerResult> {
    const metrics = await this.profiler.profile();
    const issues = this.convertBottlenecksToIssues(metrics.bottlenecks);

    return {
      name: 'Performance Profiler',
      issues,
      metrics,
      summary: this.calculateSummary(metrics),
    };
  }

  /**
   * Convert bottlenecks to issues
   */
  private convertBottlenecksToIssues(bottlenecks: PerformanceBottleneck[]): ProfilerIssue[] {
    return bottlenecks.map(bottleneck => {
      const [file, line] = this.parseLocation(bottleneck.location);

      return {
        type: 'performance-bottleneck',
        severity: bottleneck.severity,
        message: bottleneck.description,
        file,
        line,
        bottleneck,
        metric: this.getMetricName(bottleneck.type),
        impact: bottleneck.impact,
        recommendation: bottleneck.recommendation,
      };
    });
  }

  /**
   * Calculate summary
   */
  private calculateSummary(metrics: PerformanceMetrics) {
    const grade = this.getPerformanceGrade(metrics.score);

    return {
      score: metrics.score,
      slowFunctions: metrics.executionTime.slowFunctions.length,
      memoryLeaks: metrics.memory.leaks.length,
      largeFiles: metrics.bundleSize.largeFiles.length,
      bottlenecks: metrics.bottlenecks.length,
      grade,
    };
  }

  /**
   * Parse location string
   */
  private parseLocation(location: string): [string, number | undefined] {
    const match = location.match(/^(.+):(\d+)$/);
    
    if (match) {
      return [match[1], parseInt(match[2], 10)];
    }
    
    return [location, undefined];
  }

  /**
   * Get metric name
   */
  private getMetricName(type: string): string {
    switch (type) {
      case 'slow-function': return 'Execution Time';
      case 'memory-leak': return 'Memory Usage';
      case 'large-bundle': return 'Bundle Size';
      case 'slow-import': return 'Import Performance';
      case 'blocking-render': return 'Render Performance';
      default: return 'Performance';
    }
  }

  /**
   * Get performance grade
   */
  private getPerformanceGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}
