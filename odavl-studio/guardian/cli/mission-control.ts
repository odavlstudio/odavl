/**
 * Guardian Mission Control - Smart Interface System
 */

import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  getTheme,
  drawBox,
  drawSeparator,
  drawProgressBar,
  formatDuration,
  formatTrend,
  formatHealthScore,
  formatIssueCount,
  centerText,
} from './theme.js';
import { LanguageDetector } from './language-detector.js';
import { UniversalProjectDetector } from './universal-detector.js';

/**
 * Project Context (cached information)
 */
export interface ProjectContext {
  name: string;
  type: 'monorepo' | 'single' | 'extension' | 'website' | 'cli' | 'unknown';
  primaryLanguage: string;
  languageBreakdown: { language: string; percentage: number }[];
  lastScanTime?: Date;
  healthScore?: number;
  totalIssues?: number;
  framework?: string;
}

/**
 * Scan History Entry
 */
export interface ScanHistoryEntry {
  id: string;
  type: string;
  timestamp: Date;
  duration: number;
  healthScore: number;
  issuesFound: number;
  status: 'passed' | 'warning' | 'failed';
}

/**
 * AI Recommendation
 */
export interface AIRecommendation {
  priority: number;
  action: string;
  reason: string;
  estimatedTime: number;
  command: string;
}

/**
 * Mission Control State
 */
export class MissionControl {
  private projectPath: string;
  private context?: ProjectContext;
  private history: ScanHistoryEntry[] = [];
  private cacheFile: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.cacheFile = join(projectPath, '.odavl', 'guardian', 'mission-control.json');
  }

  /**
   * Initialize and load cached data
   */
  async initialize(): Promise<void> {
    await this.loadCache();
    
    if (!this.context) {
      await this.detectProjectContext();
    }
  }

  /**
   * Detect project context using existing detectors
   */
  private async detectProjectContext(): Promise<void> {
    const spinner = ora({ text: 'Analyzing project...', spinner: 'dots' }).start();

    try {
      // Detect language
      const langDetector = new LanguageDetector(this.projectPath);
      const languages = await langDetector.detectLanguages();

      // Detect project structure
      const projectDetector = new UniversalProjectDetector(this.projectPath);
      const projectInfo = await projectDetector.detectProject();

      // Calculate language breakdown
      const languageBreakdown = [
        { language: languages.primary.language, percentage: languages.primary.confidence },
        ...languages.secondary.map(lang => ({
          language: lang.language,
          percentage: lang.confidence,
        })),
      ];

      // Determine project name
      const packageJsonPath = join(this.projectPath, 'package.json');
      let projectName = 'Unknown Project';
      
      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
          projectName = packageJson.name || projectName;
        } catch {
          // Use folder name
          projectName = this.projectPath.split(/[\\/]/).pop() || projectName;
        }
      }

      this.context = {
        name: projectName,
        type: this.determineProjectType(projectInfo.type),
        primaryLanguage: languages.primary.language,
        languageBreakdown,
        framework: projectInfo.frameworks?.[0]?.name,
      };

      await this.saveCache();
      spinner.succeed('Project analyzed');
    } catch (error) {
      spinner.fail('Failed to analyze project');
      throw error;
    }
  }

  /**
   * Map project type
   */
  private determineProjectType(detectedType: string): ProjectContext['type'] {
    const typeMap: Record<string, ProjectContext['type']> = {
      'pnpm-workspace': 'monorepo',
      'npm-workspace': 'monorepo',
      'yarn-workspace': 'monorepo',
      'lerna': 'monorepo',
      'next.js': 'website',
      'react': 'website',
      'vue': 'website',
      'extension': 'extension',
    };

    return typeMap[detectedType.toLowerCase()] || 'single';
  }

  /**
   * Display Smart Welcome Screen
   */
  async displayWelcomeScreen(): Promise<void> {
    const theme = getTheme();
    const { colors } = theme;

    console.clear();

    // Main header
    const headerLines = [
      centerText(colors.primary('🛡️  GUARDIAN v5.0'), 62),
      centerText(colors.muted('Advanced AI-Powered Code Quality Guardian'), 62),
    ];

    console.log('\n' + drawBox(headerLines, undefined, 64));

    // Project info box
    if (this.context) {
      console.log();
      
      const infoLines = [
        `${colors.highlight('Project:')} ${colors.info(this.context.name)}`,
        `${colors.highlight('Type:')} ${colors.info(this.getProjectTypeDisplay())}`,
        `${colors.highlight('Language:')} ${this.getLanguageBreakdownDisplay()}`,
      ];

      // Add last scan info if available
      if (this.context.lastScanTime) {
        const timeSince = this.formatTimeSince(this.context.lastScanTime);
        infoLines.push(`${colors.highlight('Last Scan:')} ${colors.muted(timeSince)}`);
      }

      // Add health score if available
      if (this.context.healthScore !== undefined) {
        infoLines.push(`${colors.highlight('Health Score:')} ${formatHealthScore(this.context.healthScore)}`);
      }

      console.log(drawBox(infoLines, '📊 Project Status', 64));
    }
  }

  /**
   * Display AI Recommendations
   */
  displayRecommendations(recommendations: AIRecommendation[]): void {
    if (recommendations.length === 0) return;

    const theme = getTheme();
    const { colors } = theme;

    console.log();

    const lines: string[] = [];
    
    recommendations.forEach((rec, index) => {
      const priority = rec.priority === 1 ? colors.error('HIGH') : 
                      rec.priority === 2 ? colors.warning('MEDIUM') : 
                      colors.info('LOW');
      
      lines.push(`${colors.primary((index + 1).toString() + '.')} ${rec.action}`);
      lines.push(`   ${colors.muted('└─')} ${rec.reason}`);
      lines.push(`   ${colors.muted('⏱️')} ${formatDuration(rec.estimatedTime)} ${priority}`);
      
      if (index < recommendations.length - 1) {
        lines.push('');
      }
    });

    lines.push('');
    lines.push(colors.highlight('💡 Quick Action:') + ' Press ' + colors.primary('\'a\'') + ' to run all recommendations');

    console.log(drawBox(lines, '🤖 AI Recommendations', 64));
  }

  /**
   * Generate AI recommendations based on context
   */
  async generateRecommendations(): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    // Check if scan is needed
    if (!this.context?.lastScanTime || this.isScanStale()) {
      recommendations.push({
        priority: 1,
        action: '🤖 Run AI Full Scan',
        reason: this.context?.lastScanTime 
          ? 'Code not scanned recently - new issues may exist'
          : 'No previous scan found - initial analysis recommended',
        estimatedTime: 300, // 5 minutes
        command: '1',
      });
    }

    // Check if there are critical issues
    if (this.context?.totalIssues && this.context.totalIssues > 0) {
      recommendations.push({
        priority: 1,
        action: '🔧 Auto-fix Issues',
        reason: `${this.context.totalIssues} issues detected - automated fixes available`,
        estimatedTime: 60,
        command: 'autopilot',
      });
    }

    // Check if visual regression baseline exists
    const baselinePath = join(this.projectPath, '.odavl', 'guardian', 'baseline');
    if (!existsSync(baselinePath)) {
      recommendations.push({
        priority: 2,
        action: '📸 Create Visual Baseline',
        reason: 'No baseline found - visual regression testing unavailable',
        estimatedTime: 120,
        command: '5',
      });
    }

    // Language-specific recommendations
    if (this.context?.primaryLanguage === 'typescript') {
      recommendations.push({
        priority: 2,
        action: '🗣️ Language Analysis',
        reason: 'Verify TypeScript configuration and dependencies',
        estimatedTime: 10,
        command: '3',
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }

  /**
   * Display recent scan history
   */
  displayHistory(): void {
    if (this.history.length === 0) return;

    const theme = getTheme();
    const { colors } = theme;

    const lines: string[] = [];
    
    this.history.slice(0, 5).forEach((entry, index) => {
      const statusEmoji = entry.status === 'passed' ? '✅' : entry.status === 'warning' ? '⚠️' : '❌';
      const timeAgo = this.formatTimeSince(entry.timestamp);
      const trend = index > 0 ? formatTrend(entry.healthScore, this.history[index - 1].healthScore) : '';
      
      lines.push(
        `${index + 1}. ${statusEmoji} ${colors.info(entry.type.padEnd(20))} ` +
        `${colors.muted(timeAgo.padEnd(15))} ` +
        `${formatHealthScore(entry.healthScore)} ${trend}`
      );
    });

    lines.push('');
    lines.push(colors.muted('💡 Press \'r\' to re-run last scan'));

    console.log();
    console.log(drawBox(lines, '📜 Recent Scans', 64));
  }

  /**
   * Add scan to history
   */
  async addToHistory(entry: Omit<ScanHistoryEntry, 'id'>): Promise<void> {
    const newEntry: ScanHistoryEntry = {
      ...entry,
      id: Date.now().toString(),
    };

    this.history.unshift(newEntry);
    this.history = this.history.slice(0, 10); // Keep last 10

    // Update context
    if (this.context) {
      this.context.lastScanTime = entry.timestamp;
      this.context.healthScore = entry.healthScore;
      this.context.totalIssues = entry.issuesFound;
    }

    await this.saveCache();
  }

  /**
   * Format time since date
   */
  private formatTimeSince(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Check if scan is stale (older than 6 hours)
   */
  private isScanStale(): boolean {
    if (!this.context?.lastScanTime) return true;
    
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    return this.context.lastScanTime.getTime() < sixHoursAgo;
  }

  /**
   * Get project type display string
   */
  private getProjectTypeDisplay(): string {
    if (!this.context) return 'Unknown';
    
    const typeMap: Record<ProjectContext['type'], string> = {
      monorepo: 'Monorepo',
      single: 'Single Package',
      extension: 'VS Code Extension',
      website: 'Web Application',
      cli: 'CLI Tool',
      unknown: 'Unknown',
    };

    let display = typeMap[this.context.type];
    
    if (this.context.framework) {
      display += ` (${this.context.framework})`;
    }

    return display;
  }

  /**
   * Get language breakdown display
   */
  private getLanguageBreakdownDisplay(): string {
    if (!this.context) return 'Unknown';

    const theme = getTheme();
    const { colors } = theme;

    const primary = this.context.languageBreakdown[0];
    const others = this.context.languageBreakdown.slice(1, 3);

    let display = colors.info(`${primary.language} (${primary.percentage}%)`);

    if (others.length > 0) {
      const otherStr = others.map(l => `${l.language} (${l.percentage}%)`).join(', ');
      display += colors.muted(`, ${otherStr}`);
    }

    return display;
  }

  /**
   * Save cache to disk
   */
  private async saveCache(): Promise<void> {
    try {
      const cacheDir = join(this.projectPath, '.odavl', 'guardian');
      const { mkdir, writeFile } = await import('fs/promises');
      
      await mkdir(cacheDir, { recursive: true });
      
      const data = {
        context: this.context,
        history: this.history,
        updatedAt: new Date().toISOString(),
      };

      await writeFile(this.cacheFile, JSON.stringify(data, null, 2));
    } catch {
      // Ignore cache save errors
    }
  }

  /**
   * Load cache from disk
   */
  private async loadCache(): Promise<void> {
    try {
      if (!existsSync(this.cacheFile)) return;

      const data = JSON.parse(await readFile(this.cacheFile, 'utf-8'));
      
      this.context = data.context;
      this.history = data.history.map((entry: ScanHistoryEntry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));

      // Convert lastScanTime to Date
      if (this.context?.lastScanTime) {
        this.context.lastScanTime = new Date(this.context.lastScanTime);
      }
    } catch {
      // Ignore cache load errors
    }
  }

  /**
   * Get project context
   */
  getContext(): ProjectContext | undefined {
    return this.context;
  }

  /**
   * Get scan history
   */
  getHistory(): ScanHistoryEntry[] {
    return this.history;
  }
}
