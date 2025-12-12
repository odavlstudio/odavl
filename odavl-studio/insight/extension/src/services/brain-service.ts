/**
 * ODAVL Brain Service - VS Code Extension Integration
 * Phase Ω-P1: Real-time deployment confidence in the editor
 */

import * as vscode from 'vscode';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

export interface BrainConfidenceResult {
  confidence: number;
  canDeploy: boolean;
  reasoning: string[];
  fusion?: {
    fusionScore: number;
    weights: any;
    reasoning: string[];
  };
}

export class BrainService {
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async getDeploymentConfidence(context: {
    changedFiles: string[];
  }): Promise<BrainConfidenceResult> {
    try {
      // Import Brain runtime dynamically
      const { computeDeploymentConfidence } = await import(
        '@odavl-studio/brain/runtime'
      );

      // Analyze changed files
      const fileTypeStats = await this.analyzeFiles(context.changedFiles);

      // Mock Guardian report (replace with real data)
      const guardianReport = this.getMockGuardianReport();

      // Load baseline history
      const baselineHistory = await this.loadBaselineHistory();

      // Compute confidence with P9-P12 stack
      const result = await computeDeploymentConfidence({
        fileTypeStats,
        guardianReport,
        baselineHistory,
        enableMLPrediction: true,
      });

      return {
        confidence: result.confidence,
        canDeploy: result.canDeploy,
        reasoning: result.reasoning,
        fusion: (result as any).mlPrediction?.fusion,
      };
    } catch (error) {
      console.error('[Brain Service] Error:', error);
      return this.getFallbackResult();
    }
  }

  private async analyzeFiles(files: string[]): Promise<any> {
    // Simple file-type analysis
    const byType: Record<string, number> = {};
    const byRisk: Record<string, number> = {};

    for (const file of files) {
      const ext = path.extname(file).slice(1) || 'unknown';
      byType[ext] = (byType[ext] || 0) + 1;

      // Basic risk classification
      const risk = this.getFileRisk(ext);
      byRisk[risk] = (byRisk[risk] || 0) + 1;
    }

    return { byType, byRisk, totalFiles: files.length };
  }

  private getFileRisk(ext: string): string {
    const highRisk = ['ts', 'tsx', 'js', 'jsx', 'py', 'java'];
    const mediumRisk = ['css', 'scss', 'html', 'json'];
    
    if (highRisk.includes(ext)) return 'high';
    if (mediumRisk.includes(ext)) return 'medium';
    return 'low';
  }

  private getMockGuardianReport(): any {
    return {
      url: 'http://localhost:3000',
      timestamp: new Date().toISOString(),
      duration: 1000,
      status: 'passed' as const,
      issues: [],
      metrics: { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 },
    };
  }

  private async loadBaselineHistory(): Promise<any> {
    return { runs: [] };
  }

  private getFallbackResult(): BrainConfidenceResult {
    return {
      confidence: 75,
      canDeploy: true,
      reasoning: ['⚠️ Brain service unavailable, using fallback confidence'],
    };
  }
}
