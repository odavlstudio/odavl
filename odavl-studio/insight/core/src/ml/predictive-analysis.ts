/**
 * ODAVL Insight Predictive Analysis Engine
 * Predicts issues before they occur using git history and pattern analysis
 * 
 * Features:
 * - Git commit history analysis
 * - Bug-prone code identification
 * - Change impact prediction
 * - Risk scoring for files/functions
 * - Proactive recommendations
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { EnhancedIssue } from '../analyzer/enhanced-analyzer.js';

export interface FileRiskScore {
  file: string;
  risk_score: number; // 0-100
  factors: {
    bug_history: number;
    change_frequency: number;
    complexity: number;
    recent_changes: number;
    author_experience: number;
  };
  predicted_issues: PredictedIssue[];
  recommendation: string;
}

export interface PredictedIssue {
  type: string;
  description: string;
  probability: number; // 0-1
  severity: 'critical' | 'high' | 'medium' | 'low';
  based_on: string[]; // Evidence from history
  prevention_tip: string;
  estimated_time_to_occurrence: string; // "1 week", "1 month", etc.
}

export interface ChangeImpactAnalysis {
  changed_files: string[];
  affected_files: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  potential_issues: {
    type: string;
    description: string;
    affected_areas: string[];
  }[];
  recommendations: string[];
}

export interface BugPattern {
  pattern_id: string;
  description: string;
  commits: string[]; // Commit SHAs where this pattern caused bugs
  code_pattern: RegExp;
  occurrences: number;
  typical_severity: string;
  fix_pattern?: string;
}

export class PredictiveAnalysisEngine {
  private workspaceRoot: string;
  private gitAvailable: boolean = false;
  private bugPatterns: Map<string, BugPattern> = new Map();
  private fileRisks: Map<string, FileRiskScore> = new Map();

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Initialize predictive engine
   */
  async initialize(): Promise<void> {
    this.gitAvailable = await this.checkGitAvailable();
    
    if (this.gitAvailable) {
      await this.analyzeBugPatterns();
      await this.calculateFileRisks();
    }
  }

  /**
   * Analyze git history to identify bug patterns
   */
  private async analyzeBugPatterns(): Promise<void> {
    try {
      // Get commits with bug-related keywords
      const bugCommits = this.getGitLog('--all --grep="fix\\|bug\\|issue\\|error" --format=%H');
      const commits = bugCommits.split('\n').filter(Boolean);

      console.log(`📊 Analyzing ${commits.length} bug-fix commits...`);

      for (const commitSha of commits.slice(0, 100)) { // Limit to recent 100
        await this.analyzeBugCommit(commitSha);
      }

      console.log(`✅ Identified ${this.bugPatterns.size} bug patterns`);
    } catch (error) {
      console.error('Error analyzing bug patterns:', error);
    }
  }

  /**
   * Analyze a single bug-fix commit
   */
  private async analyzeBugCommit(commitSha: string): Promise<void> {
    try {
      // Get commit diff
      const diff = this.getGitLog(`show ${commitSha} --format= --unified=3`);
      
      // Extract patterns from removed code (the buggy code)
      const removedLines = diff
        .split('\n')
        .filter(line => line.startsWith('-') && !line.startsWith('---'))
        .map(line => line.substring(1).trim());

      // Identify common bug patterns
      for (const line of removedLines) {
        // Pattern 1: Missing null checks
        if (line.match(/\.\w+\s*\(/)) {
          const pattern = 'missing_null_check';
          this.recordBugPattern(pattern, 'Missing null/undefined check before method call', commitSha, /\.\w+\s*\(/);
        }

        // Pattern 2: Async without await
        if (line.match(/=\s*async\s*\(/) && !line.match(/await/)) {
          const pattern = 'async_without_await';
          this.recordBugPattern(pattern, 'Async function called without await', commitSha, /=\s*async\s*\(/);
        }

        // Pattern 3: Array index without bounds check
        if (line.match(/\[\d+\]/) || line.match(/\[.*\]/)) {
          const pattern = 'unsafe_array_access';
          this.recordBugPattern(pattern, 'Array access without bounds checking', commitSha, /\[.*\]/);
        }

        // Pattern 4: String concatenation in loops
        if (line.match(/(for|while).*\{.*\+=.*['"]/)) {
          const pattern = 'string_concat_loop';
          this.recordBugPattern(pattern, 'String concatenation in loop (performance)', commitSha, /\+=.*['"]/);
        }

        // Pattern 5: Missing error handling
        if (line.match(/(fetch|axios|http)\./)) {
          const pattern = 'missing_error_handling';
          this.recordBugPattern(pattern, 'Network call without error handling', commitSha, /(fetch|axios|http)\./);
        }
      }
    } catch (error) {
      // Skip commits that can't be analyzed
    }
  }

  /**
   * Record a bug pattern
   */
  private recordBugPattern(
    patternId: string,
    description: string,
    commitSha: string,
    codePattern: RegExp
  ): void {
    const existing = this.bugPatterns.get(patternId);
    
    if (existing) {
      existing.commits.push(commitSha);
      existing.occurrences++;
    } else {
      this.bugPatterns.set(patternId, {
        pattern_id: patternId,
        description,
        commits: [commitSha],
        code_pattern: codePattern,
        occurrences: 1,
        typical_severity: 'medium',
      });
    }
  }

  /**
   * Calculate risk scores for all files
   */
  private async calculateFileRisks(): Promise<void> {
    try {
      // Get all tracked files
      const files = this.getGitLog('ls-files').split('\n').filter(Boolean);
      
      // Filter for code files only
      const codeFiles = files.filter(f => 
        /\.(ts|tsx|js|jsx|py|java|go|rs)$/.test(f)
      );

      console.log(`📊 Calculating risk scores for ${codeFiles.length} files...`);

      for (const file of codeFiles.slice(0, 200)) { // Limit to 200 files
        const riskScore = await this.calculateFileRisk(file);
        this.fileRisks.set(file, riskScore);
      }

      console.log(`✅ Calculated risk scores for ${this.fileRisks.size} files`);
    } catch (error) {
      console.error('Error calculating file risks:', error);
    }
  }

  /**
   * Calculate risk score for a single file
   */
  private async calculateFileRisk(file: string): Promise<FileRiskScore> {
    const factors = {
      bug_history: await this.getBugHistoryScore(file),
      change_frequency: await this.getChangeFrequencyScore(file),
      complexity: await this.getComplexityScore(file),
      recent_changes: await this.getRecentChangesScore(file),
      author_experience: await this.getAuthorExperienceScore(file),
    };

    // Weighted risk calculation
    const risk_score = Math.round(
      factors.bug_history * 0.35 +
      factors.change_frequency * 0.25 +
      factors.complexity * 0.20 +
      factors.recent_changes * 0.15 +
      factors.author_experience * 0.05
    );

    const predicted_issues = await this.predictIssuesForFile(file, factors);

    const recommendation = this.generateRecommendation(risk_score, factors);

    return {
      file,
      risk_score,
      factors,
      predicted_issues,
      recommendation,
    };
  }

  /**
   * Get bug history score (0-100)
   */
  private async getBugHistoryScore(file: string): Promise<number> {
    try {
      const bugFixCommits = this.getGitLog(
        `log --all --grep="fix\\|bug" --follow --format=%H -- "${file}"`
      );
      const bugCount = bugFixCommits.split('\n').filter(Boolean).length;
      
      // More bugs = higher risk
      return Math.min(100, bugCount * 10);
    } catch {
      return 0;
    }
  }

  /**
   * Get change frequency score (0-100)
   */
  private async getChangeFrequencyScore(file: string): Promise<number> {
    try {
      const commits = this.getGitLog(
        `log --all --follow --format=%H -- "${file}"`
      );
      const commitCount = commits.split('\n').filter(Boolean).length;
      
      // More changes = higher risk (instability)
      return Math.min(100, commitCount * 2);
    } catch {
      return 0;
    }
  }

  /**
   * Get complexity score (0-100)
   */
  private async getComplexityScore(file: string): Promise<number> {
    try {
      const filePath = path.join(this.workspaceRoot, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Simple complexity heuristic
      const lines = content.split('\n').length;
      const cyclomaticComplexity = (content.match(/if|while|for|case|catch/g) || []).length;
      const nestingLevel = this.estimateNestingLevel(content);
      
      const complexityScore = (lines / 10) + (cyclomaticComplexity * 2) + (nestingLevel * 5);
      
      return Math.min(100, complexityScore);
    } catch {
      return 0;
    }
  }

  /**
   * Get recent changes score (0-100)
   */
  private async getRecentChangesScore(file: string): Promise<number> {
    try {
      const recentCommits = this.getGitLog(
        `log --since="1 month ago" --follow --format=%H -- "${file}"`
      );
      const recentCount = recentCommits.split('\n').filter(Boolean).length;
      
      // Recent changes = higher risk (more likely to have new bugs)
      return Math.min(100, recentCount * 15);
    } catch {
      return 0;
    }
  }

  /**
   * Get author experience score (0-100, lower = more experienced)
   */
  private async getAuthorExperienceScore(file: string): Promise<number> {
    try {
      const authors = this.getGitLog(
        `log --all --follow --format=%an -- "${file}"`
      );
      const uniqueAuthors = new Set(authors.split('\n').filter(Boolean));
      
      // More authors = potentially higher risk (less ownership)
      // But also more reviews, so moderate impact
      return Math.min(100, uniqueAuthors.size * 20);
    } catch {
      return 50; // Default medium risk
    }
  }

  /**
   * Predict likely issues for a file
   */
  private async predictIssuesForFile(
    file: string,
    factors: FileRiskScore['factors']
  ): Promise<PredictedIssue[]> {
    const issues: PredictedIssue[] = [];

    try {
      const filePath = path.join(this.workspaceRoot, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Check against learned bug patterns
      for (const [patternId, pattern] of this.bugPatterns) {
        if (pattern.code_pattern.test(content)) {
          const probability = Math.min(0.9, pattern.occurrences / 10);
          
          issues.push({
            type: patternId,
            description: pattern.description,
            probability,
            severity: this.probabilityToSeverity(probability),
            based_on: [`${pattern.occurrences} similar bugs in history`],
            prevention_tip: this.getPreventionTip(patternId),
            estimated_time_to_occurrence: this.estimateTimeToOccurrence(factors, probability),
          });
        }
      }

      // High complexity prediction
      if (factors.complexity > 70) {
        issues.push({
          type: 'high_complexity',
          description: 'File complexity may lead to maintenance issues',
          probability: factors.complexity / 100,
          severity: 'medium',
          based_on: ['High cyclomatic complexity', 'Deep nesting levels'],
          prevention_tip: 'Refactor into smaller, testable functions',
          estimated_time_to_occurrence: 'Next 2-3 months',
        });
      }

      // Frequent changes prediction
      if (factors.change_frequency > 60 && factors.bug_history > 30) {
        issues.push({
          type: 'regression_risk',
          description: 'High risk of regression bugs due to frequent changes',
          probability: 0.7,
          severity: 'high',
          based_on: ['Frequent changes', 'Bug history'],
          prevention_tip: 'Add comprehensive integration tests before next change',
          estimated_time_to_occurrence: 'Next 2-4 weeks',
        });
      }

    } catch (error) {
      // File might not exist or be readable
    }

    return issues.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Analyze change impact
   */
  async analyzeChangeImpact(changedFiles: string[]): Promise<ChangeImpactAnalysis> {
    const affected_files: Set<string> = new Set(changedFiles);
    const potential_issues: ChangeImpactAnalysis['potential_issues'] = [];

    // Find files that import changed files
    for (const file of changedFiles) {
      const importers = await this.findImporters(file);
      importers.forEach(imp => affected_files.add(imp));
    }

    // Calculate overall risk
    let totalRisk = 0;
    for (const file of changedFiles) {
      const riskScore = this.fileRisks.get(file);
      if (riskScore) {
        totalRisk += riskScore.risk_score;
      }
    }

    const avgRisk = totalRisk / changedFiles.length;
    const risk_level = avgRisk > 75 ? 'critical' : avgRisk > 50 ? 'high' : avgRisk > 25 ? 'medium' : 'low';

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (risk_level === 'critical' || risk_level === 'high') {
      recommendations.push('⚠️  Run comprehensive test suite before merging');
      recommendations.push('👥 Request thorough code review from senior developer');
      recommendations.push('🧪 Add integration tests for changed functionality');
    }

    if (affected_files.size > changedFiles.length * 2) {
      recommendations.push('📊 Many files affected - consider feature flag for gradual rollout');
      potential_issues.push({
        type: 'wide_impact',
        description: 'Changes affect many files, increasing regression risk',
        affected_areas: Array.from(affected_files),
      });
    }

    return {
      changed_files: changedFiles,
      affected_files: Array.from(affected_files),
      risk_level,
      potential_issues,
      recommendations,
    };
  }

  /**
   * Get high-risk files (top 10)
   */
  getHighRiskFiles(): FileRiskScore[] {
    return Array.from(this.fileRisks.values())
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 10);
  }

  /**
   * Get proactive recommendations for the codebase
   */
  getProactiveRecommendations(): string[] {
    const recommendations: string[] = [];
    const highRiskFiles = this.getHighRiskFiles();

    if (highRiskFiles.length > 0) {
      recommendations.push(`🎯 Focus testing efforts on ${highRiskFiles.length} high-risk files`);
      recommendations.push(`📝 Consider adding documentation to complex files`);
    }

    const bugPatternCount = this.bugPatterns.size;
    if (bugPatternCount > 5) {
      recommendations.push(`🔍 ${bugPatternCount} recurring bug patterns detected - create linting rules`);
    }

    return recommendations;
  }

  // Helper methods

  private async checkGitAvailable(): Promise<boolean> {
    try {
      execSync('git --version', { cwd: this.workspaceRoot, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  private getGitLog(command: string): string {
    try {
      return execSync(`git ${command}`, { 
        cwd: this.workspaceRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return '';
    }
  }

  private estimateNestingLevel(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;

    for (const line of code.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.match(/\{$/)) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      if (trimmed.startsWith('}')) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    }

    return maxNesting;
  }

  private async findImporters(file: string): Promise<string[]> {
    try {
      const allFiles = this.getGitLog('ls-files').split('\n').filter(Boolean);
      const importers: string[] = [];
      const fileBaseName = path.basename(file, path.extname(file));

      for (const f of allFiles) {
        if (f === file) continue;
        
        try {
          const content = await fs.readFile(path.join(this.workspaceRoot, f), 'utf-8');
          if (content.includes(fileBaseName)) {
            importers.push(f);
          }
        } catch {
          // Skip files that can't be read
        }
      }

      return importers;
    } catch {
      return [];
    }
  }

  private probabilityToSeverity(prob: number): 'critical' | 'high' | 'medium' | 'low' {
    if (prob >= 0.8) return 'critical';
    if (prob >= 0.6) return 'high';
    if (prob >= 0.4) return 'medium';
    return 'low';
  }

  private getPreventionTip(patternId: string): string {
    const tips: Record<string, string> = {
      missing_null_check: 'Add null/undefined checks or use optional chaining (?.)',
      async_without_await: 'Always await async functions or handle promises',
      unsafe_array_access: 'Check array length before accessing by index',
      string_concat_loop: 'Use array.join() or StringBuilder pattern',
      missing_error_handling: 'Wrap network calls in try-catch blocks',
      high_complexity: 'Break down into smaller, single-responsibility functions',
      regression_risk: 'Add comprehensive test coverage before making changes',
    };

    return tips[patternId] || 'Follow established coding best practices';
  }

  private estimateTimeToOccurrence(factors: FileRiskScore['factors'], probability: number): string {
    const urgency = factors.recent_changes * probability;
    
    if (urgency > 70) return 'Within 1-2 weeks';
    if (urgency > 50) return 'Within 1 month';
    if (urgency > 30) return 'Within 2-3 months';
    return 'Within 6 months';
  }

  private generateRecommendation(risk_score: number, factors: FileRiskScore['factors']): string {
    if (risk_score > 75) {
      return '🚨 CRITICAL: High-risk file - add comprehensive tests and consider refactoring';
    }
    if (risk_score > 50) {
      return '⚠️  HIGH RISK: Monitor closely, add tests before next change';
    }
    if (risk_score > 25) {
      return '📊 MEDIUM RISK: Keep an eye on this file during reviews';
    }
    return '✅ LOW RISK: File is stable and well-maintained';
  }
}
