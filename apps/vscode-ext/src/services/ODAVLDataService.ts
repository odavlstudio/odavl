import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { SystemMetrics, HistoryEntry, ODAVLConfig, RecipeTrust } from '../types/ODAVLTypes';
import { FileWatcher } from '../utils/FileWatcher';

export class ODAVLDataService {
  private readonly _onMetricsChanged = new vscode.EventEmitter<SystemMetrics>();
  private readonly _onHistoryChanged = new vscode.EventEmitter<HistoryEntry[]>();
  private readonly _onConfigChanged = new vscode.EventEmitter<ODAVLConfig>();
  
  readonly onMetricsChanged = this._onMetricsChanged.event;
  readonly onHistoryChanged = this._onHistoryChanged.event;
  readonly onConfigChanged = this._onConfigChanged.event;

  private readonly fileWatcher = new FileWatcher();
  private readonly workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.initializeWatchers();
  }

  private initializeWatchers(): void {
    // Watch ODAVL configuration files
    const historyPath = path.join(this.workspaceRoot, '.odavl', 'history.json');
    const gatesPath = path.join(this.workspaceRoot, '.odavl', 'gates.yml');
    const policyPath = path.join(this.workspaceRoot, '.odavl', 'policy.yml');
    const trustPath = path.join(this.workspaceRoot, '.odavl', 'recipes-trust.json');

    this.fileWatcher.watch(historyPath, () => {
      this._onHistoryChanged.fire(this.getHistoryEntries());
    });

    this.fileWatcher.watch(gatesPath, () => {
      this._onConfigChanged.fire(this.getConfiguration());
    });

    this.fileWatcher.watch(policyPath, () => {
      this._onConfigChanged.fire(this.getConfiguration());
    });

    this.fileWatcher.watch(trustPath, () => {
      // Trigger a general metrics update when trust scores change
      this._onMetricsChanged.fire(this.getCurrentMetrics());
    });

    // Watch reports directory for new observation files
    const reportsDir = path.join(this.workspaceRoot, 'reports');
    if (fs.existsSync(reportsDir)) {
      // Watch for new files in reports directory
      try {
        fs.watch(reportsDir, (eventType, filename) => {
          if (filename && filename.startsWith('observe-') && filename.endsWith('.json')) {
            setTimeout(() => {
              this._onMetricsChanged.fire(this.getCurrentMetrics());
            }, 100); // Small delay to ensure file is written completely
          }
        });
      } catch (error) {
        console.error('Failed to watch reports directory:', error);
      }
    }
  }

  getCurrentMetrics(): SystemMetrics {
    try {
      const reportsDir = path.join(this.workspaceRoot, 'reports');
      const observeFiles = fs.readdirSync(reportsDir)
        .filter(f => f.startsWith('observe-') && f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a));

      if (observeFiles.length === 0) {
        return { eslintWarnings: 0, typeErrors: 0, timestamp: new Date().toISOString() };
      }

      const latestFile = path.join(reportsDir, observeFiles[0]);
      return JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    } catch {
      return { eslintWarnings: 0, typeErrors: 0, timestamp: new Date().toISOString() };
    }
  }

  getHistoryEntries(limit = 10): HistoryEntry[] {
    try {
      const historyPath = path.join(this.workspaceRoot, '.odavl', 'history.json');
      const data = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      return data.slice(-limit);
    } catch {
      return [];
    }
  }

  getRecipeTrust(): RecipeTrust[] {
    try {
      const trustPath = path.join(this.workspaceRoot, '.odavl', 'recipes-trust.json');
      return JSON.parse(fs.readFileSync(trustPath, 'utf8'));
    } catch {
      return [];
    }
  }

  getConfiguration(): ODAVLConfig {
    try {
      const gatesPath = path.join(this.workspaceRoot, '.odavl', 'gates.yml');
      const policyPath = path.join(this.workspaceRoot, '.odavl', 'policy.yml');
      
      const gates = fs.existsSync(gatesPath) 
        ? yaml.load(fs.readFileSync(gatesPath, 'utf8')) as Record<string, unknown>
        : {};
      
      const policy = fs.existsSync(policyPath)
        ? yaml.load(fs.readFileSync(policyPath, 'utf8')) as Record<string, unknown>
        : {};

      return { gates, policy };
    } catch {
      return { gates: {}, policy: {} };
    }
  }

  // Intelligence Integration Methods (Phase 3)
  
  /**
   * Get evidence files for intelligence analysis
   */
  getEvidenceFiles(): Array<{ id: string; type: string; timestamp: string; source: string; category: string; data: Record<string, unknown> }> {
    try {
      const evidenceDir = path.join(this.workspaceRoot, 'evidence');
      if (!fs.existsSync(evidenceDir)) return [];
      
      return fs.readdirSync(evidenceDir)
        .filter(file => file.endsWith('.json'))
        .slice(-50) // Limit to recent files for performance
        .map(file => {
          let type = 'other';
          if (file.includes('decision')) type = 'decision';
          else if (file.includes('metric')) type = 'metric';
          
          return {
            id: file,
            type,
            timestamp: fs.statSync(path.join(evidenceDir, file)).mtime.toISOString(),
            source: 'evidence',
            category: 'forensic',
            data: {}
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Get performance metrics for analytics
   */
  getPerformanceMetrics(): Array<{ timestamp: string; metrics: unknown }> {
    try {
      const reportsDir = path.join(this.workspaceRoot, 'reports');
      if (!fs.existsSync(reportsDir)) return [];
      
      return fs.readdirSync(reportsDir)
        .filter(file => file.startsWith('observe-') && file.endsWith('.json'))
        .slice(-20) // Recent metrics only
        .map(file => {
          const content = JSON.parse(fs.readFileSync(path.join(reportsDir, file), 'utf8'));
          const regex = /observe-(\d+)\.json/;
          const match = regex.exec(file);
          
          return {
            timestamp: match?.[1] || Date.now().toString(),
            metrics: content
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Cache historical data for intelligence processing
   */
  private intelligenceCache: { history?: HistoryEntry[]; lastUpdate?: number } = {};
  
  getCachedHistoryForIntelligence(): HistoryEntry[] {
    const now = Date.now();
    if (this.intelligenceCache.history && this.intelligenceCache.lastUpdate && 
        (now - this.intelligenceCache.lastUpdate) < 60000) { // 1 minute cache
      return this.intelligenceCache.history;
    }
    
    const history = this.getHistoryEntries();
    this.intelligenceCache = { history, lastUpdate: now };
    return history;
  }

  dispose(): void {
    this.fileWatcher.dispose();
    this._onMetricsChanged.dispose();
    this._onHistoryChanged.dispose();
    this._onConfigChanged.dispose();
  }
}