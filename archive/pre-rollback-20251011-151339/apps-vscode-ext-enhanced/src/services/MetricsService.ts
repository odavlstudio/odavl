/**
 * Enhanced Metrics Service for ODAVL Studio
 * 
 * Collects, processes, and manages ODAVL cycle metrics with
 * enterprise-grade caching and persistence.
 */

import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import { LoggingService } from './LoggingService';
import { ConfigurationService } from './ConfigurationService';

export interface OdavlMetrics {
    timestamp: string;
    eslintWarnings: number;
    typeScriptErrors: number;
    cyclePhase: 'idle' | 'observe' | 'decide' | 'act' | 'verify' | 'learn';
    cycleStatus: 'success' | 'error' | 'running';
    lastCycleTime?: number;
    trustScores: Record<string, number>;
    reportCounts: {
        total: number;
        successful: number;
        failed: number;
    };
}

export class MetricsService {
    private currentMetrics: OdavlMetrics;
    private metricsCache: Map<string, OdavlMetrics> = new Map();
    private workspaceRoot: string;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigurationService
    ) {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        this.currentMetrics = this.getDefaultMetrics();
    }

    async initialize(): Promise<void> {
        await this.loadMetrics();
        this.loggingService.info('MetricsService initialized');
    }

    private getDefaultMetrics(): OdavlMetrics {
        return {
            timestamp: new Date().toISOString(),
            eslintWarnings: 0,
            typeScriptErrors: 0,
            cyclePhase: 'idle',
            cycleStatus: 'success',
            trustScores: {},
            reportCounts: {
                total: 0,
                successful: 0,
                failed: 0
            }
        };
    }

    async runObserve(): Promise<void> {
        this.updatePhase('observe');
        this.loggingService.info('Starting ODAVL Observe phase');
        
        try {
            // Simulate observation logic
            await this.collectMetrics();
            this.currentMetrics.cycleStatus = 'success';
            this.loggingService.info('ODAVL Observe phase completed successfully');
        } catch (error) {
            this.currentMetrics.cycleStatus = 'error';
            this.loggingService.error('ODAVL Observe phase failed', { error });
            throw error;
        } finally {
            this.updatePhase('idle');
        }
    }

    async runDecide(): Promise<void> {
        this.updatePhase('decide');
        this.loggingService.info('Starting ODAVL Decide phase');
        
        try {
            // Simulate decision logic
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.currentMetrics.cycleStatus = 'success';
            this.loggingService.info('ODAVL Decide phase completed successfully');
        } catch (error) {
            this.currentMetrics.cycleStatus = 'error';
            this.loggingService.error('ODAVL Decide phase failed', { error });
            throw error;
        } finally {
            this.updatePhase('idle');
        }
    }

    async runAct(): Promise<void> {
        this.updatePhase('act');
        this.loggingService.info('Starting ODAVL Act phase');
        
        try {
            // Simulate action logic
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.currentMetrics.cycleStatus = 'success';
            this.currentMetrics.reportCounts.successful++;
            this.loggingService.info('ODAVL Act phase completed successfully');
        } catch (error) {
            this.currentMetrics.cycleStatus = 'error';
            this.currentMetrics.reportCounts.failed++;
            this.loggingService.error('ODAVL Act phase failed', { error });
            throw error;
        } finally {
            this.updatePhase('idle');
        }
    }

    async runVerify(): Promise<void> {
        this.updatePhase('verify');
        this.loggingService.info('Starting ODAVL Verify phase');
        
        try {
            // Simulate verification logic
            await this.collectMetrics();
            this.currentMetrics.cycleStatus = 'success';
            this.loggingService.info('ODAVL Verify phase completed successfully');
        } catch (error) {
            this.currentMetrics.cycleStatus = 'error';
            this.loggingService.error('ODAVL Verify phase failed', { error });
            throw error;
        } finally {
            this.updatePhase('idle');
        }
    }

    async runLearn(): Promise<void> {
        this.updatePhase('learn');
        this.loggingService.info('Starting ODAVL Learn phase');
        
        try {
            // Simulate learning logic
            await this.updateTrustScores();
            this.currentMetrics.cycleStatus = 'success';
            this.loggingService.info('ODAVL Learn phase completed successfully');
        } catch (error) {
            this.currentMetrics.cycleStatus = 'error';
            this.loggingService.error('ODAVL Learn phase failed', { error });
            throw error;
        } finally {
            this.updatePhase('idle');
        }
    }

    async runUndo(): Promise<void> {
        this.loggingService.info('Starting ODAVL Undo operation');
        
        try {
            // Simulate undo logic
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.loggingService.info('ODAVL Undo operation completed successfully');
        } catch (error) {
            this.loggingService.error('ODAVL Undo operation failed', { error });
            throw error;
        }
    }

    private updatePhase(phase: OdavlMetrics['cyclePhase']): void {
        this.currentMetrics.cyclePhase = phase;
        this.currentMetrics.timestamp = new Date().toISOString();
        this.loggingService.debug('Phase updated', { phase });
    }

    private async collectMetrics(): Promise<void> {
        // Simulate metrics collection
        this.currentMetrics.eslintWarnings = Math.floor(Math.random() * 10);
        this.currentMetrics.typeScriptErrors = Math.floor(Math.random() * 5);
        this.currentMetrics.reportCounts.total++;
    }

    private async updateTrustScores(): Promise<void> {
        // Simulate trust score updates
        this.currentMetrics.trustScores = {
            'eslint-fix': 0.85,
            'typescript-strict': 0.92,
            'import-cleanup': 0.78
        };
    }

    getCurrentMetrics(): OdavlMetrics {
        return { ...this.currentMetrics };
    }

    async refreshMetrics(): Promise<void> {
        await this.collectMetrics();
        this.loggingService.debug('Metrics refreshed');
    }

    async saveState(): Promise<void> {
        const stateKey = 'odavl-metrics';
        await this.context.globalState.update(stateKey, this.currentMetrics);
        this.loggingService.debug('Metrics state saved');
    }

    async loadMetrics(): Promise<void> {
        const stateKey = 'odavl-metrics';
        const savedMetrics = this.context.globalState.get<OdavlMetrics>(stateKey);
        
        if (savedMetrics) {
            this.currentMetrics = { ...this.getDefaultMetrics(), ...savedMetrics };
            this.loggingService.debug('Metrics loaded from state');
        }
    }

    async exportReports(filePath: string): Promise<void> {
        const reportData = {
            currentMetrics: this.currentMetrics,
            exportedAt: new Date().toISOString(),
            version: this.context.extension.packageJSON.version
        };

        await fs.writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf-8');
        this.loggingService.info('Reports exported', { filePath });
    }

    async clearCache(): Promise<void> {
        this.metricsCache.clear();
        this.currentMetrics = this.getDefaultMetrics();
        await this.context.globalState.update('odavl-metrics', undefined);
        this.loggingService.info('Metrics cache cleared');
    }

    async dispose(): Promise<void> {
        await this.saveState();
        this.loggingService.debug('MetricsService disposed');
    }
}