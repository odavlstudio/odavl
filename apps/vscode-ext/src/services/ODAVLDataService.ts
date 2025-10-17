import * as vscode from 'vscode';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
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
    private fsWatcher: fs.FSWatcher | undefined;
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

        this.fileWatcher.watch(historyPath, async () => {
            this._onHistoryChanged.fire(await this.getHistoryEntries());
        });

        this.fileWatcher.watch(gatesPath, async () => {
            this._onConfigChanged.fire(await this.getConfiguration());
        });

        this.fileWatcher.watch(policyPath, async () => {
            this._onConfigChanged.fire(await this.getConfiguration());
        });

        this.fileWatcher.watch(trustPath, async () => {
            // Trigger a general metrics update when trust scores change
            this._onMetricsChanged.fire(await this.getCurrentMetrics());
        });

        // Watch reports directory for new observation files
        const reportsDir = path.join(this.workspaceRoot, 'reports');
        if (fs.existsSync(reportsDir)) {
            // Avoid watching untrusted workspaces
            const trust = vscode.workspace.isTrusted ?? true;
            if (trust) {
                try {
                    this.fsWatcher = fs.watch(reportsDir, (eventType: string, filename: string | Buffer | null) => {
                        if (!filename) return;
                        const fileStr = typeof filename === 'string' ? filename : filename.toString();
                        if (fileStr.startsWith('observe-') && fileStr.endsWith('.json')) {
                            setTimeout(async () => {
                                this._onMetricsChanged.fire(await this.getCurrentMetrics());
                            }, 100); // Small delay to ensure file is written completely
                        }
                    });
                } catch (error) {
                    console.error('Failed to watch reports directory:', error);
                }
            }
        }
    }

    async getCurrentMetrics(): Promise<SystemMetrics> {
        try {
            const reportsDir = path.join(this.workspaceRoot, 'reports');
            const files = await fsp.readdir(reportsDir);
            const observeFiles = files.filter((f: string) => f.startsWith('observe-') && f.endsWith('.json'))
                .sort((a: string, b: string) => b.localeCompare(a));
            if (observeFiles.length === 0) {
                return { eslintWarnings: 0, typeErrors: 0, timestamp: new Date().toISOString() };
            }
            const latestFile = path.join(reportsDir, observeFiles[0]);
            const content = await fsp.readFile(latestFile, 'utf8');
            return JSON.parse(content);
        } catch {
            return { eslintWarnings: 0, typeErrors: 0, timestamp: new Date().toISOString() };
        }
    }

    async getHistoryEntries(limit = 10): Promise<HistoryEntry[]> {
        try {
            const historyPath = path.join(this.workspaceRoot, '.odavl', 'history.json');
            const content = await fsp.readFile(historyPath, 'utf8');
            const data = JSON.parse(content);
            return data.slice(-limit);
        } catch {
            return [];
        }
    }

    async getRecipeTrust(): Promise<RecipeTrust[]> {
        try {
            const trustPath = path.join(this.workspaceRoot, '.odavl', 'recipes-trust.json');
            const content = await fsp.readFile(trustPath, 'utf8');
            return JSON.parse(content);
        } catch {
            return [];
        }
    }

    async getConfiguration(): Promise<ODAVLConfig> {
        try {
            const gatesPath = path.join(this.workspaceRoot, '.odavl', 'gates.yml');
            const policyPath = path.join(this.workspaceRoot, '.odavl', 'policy.yml');
            let gates = {};
            let policy = {};
            try {
                const gatesContent = await fsp.readFile(gatesPath, 'utf8');
                gates = yaml.load(gatesContent) as Record<string, unknown>;
            } catch {
                // ignore
            }
            try {
                const policyContent = await fsp.readFile(policyPath, 'utf8');
                policy = yaml.load(policyContent) as Record<string, unknown>;
            } catch {
                // ignore
            }
            return { gates, policy };
        } catch {
            return { gates: {}, policy: {} };
        }
    }

    // Intelligence Integration Methods (Phase 3)

    /**
     * Get evidence files for intelligence analysis
     */
    async getEvidenceFiles(): Promise<Array<{ id: string; type: string; timestamp: string; source: string; category: string; data: Record<string, unknown> }>> {
        try {
            const evidenceDir = path.join(this.workspaceRoot, 'evidence');
            if (!fs.existsSync(evidenceDir)) return [];
            const files = await fsp.readdir(evidenceDir);
            return await Promise.all(
                files.filter(file => file.endsWith('.json'))
                    .slice(-50)
                    .map(async file => {
                        let type = 'other';
                        if (file.includes('decision')) type = 'decision';
                        else if (file.includes('metric')) type = 'metric';
                        const stat = await fsp.stat(path.join(evidenceDir, file));
                        return {
                            id: file,
                            type,
                            timestamp: stat.mtime.toISOString(),
                            source: 'evidence',
                            category: 'forensic',
                            data: {}
                        };
                    })
            );
        } catch {
            return [];
        }
    }

    /**
     * Get performance metrics for analytics
     */
    async getPerformanceMetrics(): Promise<Array<{ timestamp: string; metrics: unknown }>> {
        try {
            const reportsDir = path.join(this.workspaceRoot, 'reports');
            if (!fs.existsSync(reportsDir)) return [];
            const files = await fsp.readdir(reportsDir);
            return await Promise.all(
                files.filter(file => file.startsWith('observe-') && file.endsWith('.json'))
                    .slice(-20)
                    .map(async file => {
                        const content = JSON.parse(await fsp.readFile(path.join(reportsDir, file), 'utf8'));
                        const regex = /observe-(\d+)\.json/;
                        const match = regex.exec(file);
                        return {
                            timestamp: match?.[1] || Date.now().toString(),
                            metrics: content
                        };
                    })
            );
        } catch {
            return [];
        }
    }

    /**
     * Cache historical data for intelligence processing
     */
    private intelligenceCache: { history?: HistoryEntry[]; lastUpdate?: number } = {};

    async getCachedHistoryForIntelligence(): Promise<HistoryEntry[]> {
        const now = Date.now();
        if (this.intelligenceCache.history && this.intelligenceCache.lastUpdate &&
            (now - this.intelligenceCache.lastUpdate) < 60000) { // 1 minute cache
            return this.intelligenceCache.history;
        }

        const history = await this.getHistoryEntries();
        this.intelligenceCache = { history, lastUpdate: now };
        return history;
    }

    dispose(): void {
        try { this.fsWatcher?.close(); } catch { /* ignore close errors */ }
        this.fileWatcher.dispose();
        this._onMetricsChanged.dispose();
        this._onHistoryChanged.dispose();
        this._onConfigChanged.dispose();
    }
}
