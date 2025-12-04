/**
 * Guardian Mission Control - Live Progress Tracking & Rich Results
 */

import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import {
  getTheme,
  drawBox,
  drawProgressBar,
  formatDuration,
  formatHealthScore,
  formatIssueCount,
  formatTrend,
  centerText as themeCenterText,
} from './theme.js';

/**
 * Analysis Phase
 */
export interface AnalysisPhase {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  filesProcessed?: number;
  issuesFound?: number;
  duration?: number;
  details?: string;
}

/**
 * Analysis Result
 */
export interface AnalysisResult {
  healthScore: number;
  previousHealthScore?: number;
  totalIssues: number;
  issuesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trends?: {
    codeQuality: { current: number; previous: number };
    testCoverage: { current: number; previous: number };
    security: { current: number; previous: number };
    performance: { current: number; previous: number };
  };
  topIssues?: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    file: string;
    line?: number;
    fixCommand?: string;
  }>;
  duration: number;
  timestamp: Date;
}

/**
 * Live Progress Tracker
 */
export class ProgressTracker {
  private phases: AnalysisPhase[] = [];
  private currentPhaseIndex: number = -1;
  private spinner?: Ora;
  private startTime: number = 0;
  private updateInterval?: NodeJS.Timeout;

  /**
   * Initialize phases
   */
  initialize(phases: Array<{ id: string; name: string }>): void {
    this.phases = phases.map(p => ({
      id: p.id,
      name: p.name,
      status: 'pending',
      progress: 0,
    }));
    this.startTime = Date.now();
  }

  /**
   * Start tracking
   */
  start(): void {
    const theme = getTheme();
    const { colors } = theme;

    console.log();
    console.log(colors.primary('━'.repeat(64)));
    console.log(centerText(colors.highlight('🚀 ANALYSIS IN PROGRESS'), 64));
    console.log(colors.primary('━'.repeat(64)));
    console.log();

    // Start live updates
    this.updateInterval = setInterval(() => {
      this.displayProgress();
    }, 500);
  }

  /**
   * Start a phase
   */
  startPhase(phaseId: string): void {
    const phaseIndex = this.phases.findIndex(p => p.id === phaseId);
    if (phaseIndex === -1) return;

    // Mark previous phase as completed
    if (this.currentPhaseIndex >= 0) {
      this.phases[this.currentPhaseIndex].status = 'completed';
      this.phases[this.currentPhaseIndex].progress = 100;
    }

    this.currentPhaseIndex = phaseIndex;
    this.phases[phaseIndex].status = 'running';
    this.phases[phaseIndex].progress = 0;
  }

  /**
   * Update current phase progress
   */
  updateProgress(progress: number, details?: string): void {
    if (this.currentPhaseIndex < 0) return;

    this.phases[this.currentPhaseIndex].progress = Math.min(100, Math.max(0, progress));
    if (details) {
      this.phases[this.currentPhaseIndex].details = details;
    }
  }

  /**
   * Update phase statistics
   */
  updateStats(filesProcessed?: number, issuesFound?: number): void {
    if (this.currentPhaseIndex < 0) return;

    if (filesProcessed !== undefined) {
      this.phases[this.currentPhaseIndex].filesProcessed = filesProcessed;
    }
    if (issuesFound !== undefined) {
      this.phases[this.currentPhaseIndex].issuesFound = issuesFound;
    }
  }

  /**
   * Mark current phase as failed
   */
  failPhase(error: string): void {
    if (this.currentPhaseIndex < 0) return;

    this.phases[this.currentPhaseIndex].status = 'failed';
    this.phases[this.currentPhaseIndex].details = error;
  }

  /**
   * Complete tracking
   */
  complete(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Mark last phase as completed
    if (this.currentPhaseIndex >= 0) {
      this.phases[this.currentPhaseIndex].status = 'completed';
      this.phases[this.currentPhaseIndex].progress = 100;
    }

    this.displayProgress(true);
  }

  /**
   * Display current progress
   */
  private displayProgress(final: boolean = false): void {
    const theme = getTheme();
    const { colors } = theme;

    // Clear previous output (move cursor up)
    if (!final && this.currentPhaseIndex > 0) {
      const linesToClear = 8 + (this.phases.length * 2);
      process.stdout.write(`\x1b[${linesToClear}A`);
      process.stdout.write('\x1b[J');
    }

    const lines: string[] = [];

    // Overall progress
    const completedPhases = this.phases.filter(p => p.status === 'completed').length;
    const totalProgress = Math.floor((completedPhases / this.phases.length) * 100);
    
    lines.push(drawProgressBar(totalProgress, 50));
    lines.push('');
    
    // Current phase info
    const currentPhase = this.currentPhaseIndex >= 0 ? this.phases[this.currentPhaseIndex] : null;
    if (currentPhase) {
      lines.push(
        colors.highlight(`Phase ${this.currentPhaseIndex + 1}/${this.phases.length}:`) +
        ' ' +
        colors.info(currentPhase.name)
      );
    }

    lines.push('');

    // Phase list
    this.phases.forEach((phase, index) => {
      const icon = phase.status === 'completed' ? colors.success('✅') :
                   phase.status === 'running' ? colors.warning('⏳') :
                   phase.status === 'failed' ? colors.error('❌') :
                   colors.muted('⏸️');

      let line = `${icon} ${phase.name}`;

      // Add details if running
      if (phase.status === 'running' && phase.details) {
        line += colors.muted(` - ${phase.details}`);
      }

      // Add stats
      const stats: string[] = [];
      if (phase.filesProcessed !== undefined) {
        stats.push(`${phase.filesProcessed} files`);
      }
      if (phase.issuesFound !== undefined) {
        stats.push(`${phase.issuesFound} issues`);
      }

      if (stats.length > 0) {
        line += colors.muted(` (${stats.join(', ')})`);
      }

      lines.push('   ' + line);
    });

    // Estimated time
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const estimatedTotal = this.estimateTotal();
    const remaining = Math.max(0, estimatedTotal - elapsed);

    lines.push('');
    lines.push(
      colors.muted('⏱️  Elapsed: ') + colors.info(formatDuration(elapsed)) +
      colors.muted(' │ Remaining: ') + colors.info(formatDuration(remaining))
    );

    if (!final) {
      lines.forEach(line => console.log(line));
    } else {
      console.log();
      console.log(drawBox(lines, '📊 Analysis Progress', 64));
    }
  }

  /**
   * Estimate total duration
   */
  private estimateTotal(): number {
    // Rough estimate: 60 seconds per phase
    return this.phases.length * 60;
  }

  /**
   * Get phases
   */
  getPhases(): AnalysisPhase[] {
    return this.phases;
  }
}

/**
 * Display rich analysis results
 */
export function displayResults(result: AnalysisResult): void {
  const theme = getTheme();
  const { colors } = theme;

  console.log();
  console.log(colors.primary('━'.repeat(64)));
  console.log(centerText(colors.highlight('🎯 SCAN COMPLETE - RESULTS'), 64));
  console.log(colors.primary('━'.repeat(64)));
  console.log();

  // Health Score
  const lines: string[] = [];
  
  const scoreDisplay = formatHealthScore(result.healthScore);
  const trendDisplay = result.previousHealthScore !== undefined
    ? ' ' + formatTrend(result.healthScore, result.previousHealthScore)
    : '';

  lines.push(colors.highlight('📊 HEALTH SCORE: ') + scoreDisplay + trendDisplay);
  lines.push('');

  // Issues breakdown
  lines.push(colors.highlight('🔍 ISSUES FOUND:'));
  lines.push('┌─────────────────────────────────────────┐');
  lines.push(`│ ${formatIssueCount(result.issuesBySeverity.critical, 'critical')} Critical:  ${result.issuesBySeverity.critical.toString().padStart(3)} ${getTrendIcon(result, 'critical')}                      │`);
  lines.push(`│ ${formatIssueCount(result.issuesBySeverity.high, 'high')} High:      ${result.issuesBySeverity.high.toString().padStart(3)} ${getTrendIcon(result, 'high')}                      │`);
  lines.push(`│ ${formatIssueCount(result.issuesBySeverity.medium, 'medium')} Medium:    ${result.issuesBySeverity.medium.toString().padStart(3)}                         │`);
  lines.push(`│ ${formatIssueCount(result.issuesBySeverity.low, 'low')} Low:       ${result.issuesBySeverity.low.toString().padStart(3)}                         │`);
  lines.push('└─────────────────────────────────────────┘');

  console.log(drawBox(lines, undefined, 64));

  // Trends (if available)
  if (result.trends) {
    console.log();
    displayTrends(result.trends);
  }

  // Top Issues
  if (result.topIssues && result.topIssues.length > 0) {
    console.log();
    displayTopIssues(result.topIssues);
  }

  // Next Actions
  console.log();
  displayNextActions(result);

  console.log();
}

/**
 * Display trends
 */
function displayTrends(trends: NonNullable<AnalysisResult['trends']>): void {
  const theme = getTheme();
  const { colors } = theme;

  const lines: string[] = [];

  const metrics = [
    { name: 'Code Quality', data: trends.codeQuality },
    { name: 'Test Coverage', data: trends.testCoverage },
    { name: 'Security', data: trends.security },
    { name: 'Performance', data: trends.performance },
  ];

  metrics.forEach(metric => {
    const percentage = `${metric.data.current}%`;
    const trend = formatTrend(metric.data.current, metric.data.previous);
    lines.push(`• ${colors.info(metric.name.padEnd(15))}: ${colors.highlight(percentage.padStart(4))} ${trend}`);
  });

  console.log(drawBox(lines, '📈 TRENDS', 64));
}

/**
 * Display top issues
 */
function displayTopIssues(issues: NonNullable<AnalysisResult['topIssues']>): void {
  const theme = getTheme();
  const { colors } = theme;

  const lines: string[] = [];

  issues.slice(0, 3).forEach((issue, index) => {
    const severityIcon = issue.severity === 'critical' ? '🔴' :
                         issue.severity === 'high' ? '🟡' :
                         issue.severity === 'medium' ? '🟢' : '🔵';

    lines.push(`${colors.primary((index + 1).toString() + '.')} ${severityIcon} ${colors.highlight(issue.message)}`);
    lines.push(`   ${colors.muted('→')} ${colors.info(issue.file)}${issue.line ? colors.muted(':' + issue.line) : ''}`);
    
    if (issue.fixCommand) {
      lines.push(`   ${colors.muted('Fix:')} ${colors.secondary(issue.fixCommand)}`);
    }

    if (index < issues.length - 1) {
      lines.push('');
    }
  });

  console.log(drawBox(lines, '🎯 TOP ISSUES', 64));
}

/**
 * Display next actions
 */
function displayNextActions(result: AnalysisResult): void {
  const theme = getTheme();
  const { colors } = theme;

  const lines: string[] = [];

  lines.push(`${colors.primary('[1]')} ${colors.info('🔧 Auto-fix all issues')} ${colors.muted('(pnpm autopilot run)')}`);
  lines.push(`${colors.primary('[2]')} ${colors.info('📊 View detailed report')} ${colors.muted('(guardian open:dashboard)')}`);
  lines.push(`${colors.primary('[3]')} ${colors.info('💾 Save report')}`);
  lines.push(`${colors.primary('[4]')} ${colors.info('↩️  Back to menu')}`);
  lines.push('');
  lines.push(colors.muted('Select action (1-4) or press Enter to continue:'));

  console.log(drawBox(lines, '🎯 NEXT ACTIONS', 64));
}

/**
 * Get trend icon helper
 */
function getTrendIcon(result: AnalysisResult, severity: 'critical' | 'high'): string {
  // Placeholder - would need previous data to calculate
  return '';
}

/**
 * Center text helper
 */
function centerText(text: string, width: number): string {
  return themeCenterText(text, width);
}
