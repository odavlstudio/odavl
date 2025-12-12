/**
 * OMEGA-P5: OMS Unified Context Layer
 * Central nervous system for ODAVL intelligence
 * 
 * This is the single source of truth for:
 * - File type intelligence
 * - Risk indexing
 * - Detector activity
 * - Recipe history
 * - Guardian baselines
 * - Brain fusion weights
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import type { FileTypeDefinition, FileMetadata } from './file-types/ts.js';
import { TypeScriptFileType } from './file-types/ts.js';
import { JSONFileType } from './file-types/json.js';
import { YAMLFileType } from './file-types/yaml.js';
import { TSXFileType } from './file-types/tsx.js';
import { JSFileType as JavaScriptFileType } from './file-types/js.js';
import { JSXFileType } from './file-types/jsx.js';
import { MarkdownFileType } from './file-types/md.js';
import { EnvFileType } from './file-types/env.js';
import { PrismaFileType } from './file-types/prisma.js';
import { SQLFileType } from './file-types/sql.js';
import { DockerfileType } from './file-types/dockerfile.js';
import { DockerComposeType } from './file-types/docker-compose.js';
import { WorkflowsFileType } from './file-types/workflows.js';
import { ConfigTSFileType } from './file-types/config-ts.js';
import { ConfigJSFileType } from './file-types/config-js.js';
import { NextConfigFileType } from './file-types/next-config.js';
import { PackageJSONFileType } from './file-types/package-json.js';
import { PnpmLockFileType } from './file-types/pnpm-lock.js';
import { ESLintConfigFileType } from './file-types/eslint-config.js';
import { TSConfigFileType } from './file-types/tsconfig.js';
import { buildFileIntelligenceMatrix } from './matrix/file-intelligence-matrix.js';
import { computeFileRiskScore } from './risk/file-risk-index.js';

// Re-export file types and utilities for external use
export { JavaScriptFileType, TypeScriptFileType, JSONFileType, YAMLFileType, TSXFileType, JSXFileType };
export { computeFileRiskScore };

/**
 * Detector activity tracking
 */
export interface DetectorActivity {
  detector: string;
  fileType: string;
  runs: number;
  successRate: number;
  avgExecutionTime: number;
  lastRun: string;
}

/**
 * Recipe execution history
 */
export interface RecipeHistory {
  recipeId: string;
  fileType: string;
  successRate: number;
  totalRuns: number;
  avgLocChanged: number;
  lastUsed: string;
}

/**
 * Guardian gate history
 */
export interface GuardianGateHistory {
  gate: string;
  runs: number;
  passRate: number;
  avgScore: number;
  lastRun: string;
}

/**
 * Brain fusion weights
 */
export interface FusionWeights {
  nn: number;
  lstm: number;
  mtl: number;
  bayesian: number;
  heuristic: number;
  lastUpdated: string;
}

/**
 * File type metadata with intelligence
 */
export interface FileTypeMetadata {
  type: string;
  extensions: string[];
  category: string;
  riskWeight: number;
  importance: number;
  dominantDetectors: string[];
  effectiveRecipes: string[];
}

/**
 * Unified OMS Context
 * OMEGA-P5: Single source of truth for all ODAVL intelligence
 */
export interface OMSContext {
  fileTypes: FileTypeMetadata[];
  riskIndex: Record<string, number>;
  detectors: DetectorActivity[];
  recipes: RecipeHistory[];
  guardianHistory: GuardianGateHistory[];
  brainWeights: FusionWeights;
  loaded: boolean;
  timestamp: string;
}

/**
 * Load OMS Context from disk
 * OMEGA-P5: Real implementation loading from .odavl/
 */
export async function loadOMSContext(workspaceRoot: string = process.cwd()): Promise<OMSContext> {
  const odavlPath = path.join(workspaceRoot, '.odavl');

  try {
    // Load file types (from OMS definitions)
    const fileTypes = await loadFileTypes();

    // Load risk index
    const riskIndex = await loadRiskIndex(odavlPath);

    // Load detector activity
    const detectors = await loadDetectorActivity(odavlPath);

    // Load recipe history
    const recipes = await loadRecipeHistory(odavlPath);

    // Load Guardian history
    const guardianHistory = await loadGuardianHistory(odavlPath);

    // Load Brain fusion weights
    const brainWeights = await loadBrainWeights(odavlPath);

    return {
      fileTypes,
      riskIndex,
      detectors,
      recipes,
      guardianHistory,
      brainWeights,
      loaded: true,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to load OMS context:', error);
    return createEmptyContext();
  }
}

/**
 * Load file type definitions
 * OMEGA-P5: All 20 file types wired
 */
async function loadFileTypes(): Promise<FileTypeMetadata[]> {
  const allTypes: FileTypeDefinition[] = [
    TypeScriptFileType, TSXFileType, JavaScriptFileType, JSXFileType,
    JSONFileType, YAMLFileType, MarkdownFileType,
    EnvFileType, PrismaFileType, SQLFileType,
    DockerfileType, DockerComposeType, WorkflowsFileType,
    ConfigTSFileType, ConfigJSFileType, NextConfigFileType,
    PackageJSONFileType, PnpmLockFileType, ESLintConfigFileType, TSConfigFileType,
  ];

  const matrix = buildFileIntelligenceMatrix();

  return allTypes.map((type) => {
    const intel = matrix.find((m) => m.typeId === type.id);
    return {
      type: type.id,
      extensions: type.extensions,
      category: type.category,
      riskWeight: type.riskWeight,
      importance: type.importance,
      dominantDetectors: intel?.dominantDetectors || [],
      effectiveRecipes: intel?.preferredRecipes || [],
    };
  });
}

/**
 * Load risk index from disk
 */
async function loadRiskIndex(odavlPath: string): Promise<Record<string, number>> {
  const riskIndexPath = path.join(odavlPath, 'risk-index.json');
  
  if (!existsSync(riskIndexPath)) {
    return {};
  }

  try {
    const content = await readFile(riskIndexPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load risk index:', error);
    return {};
  }
}

/**
 * Load detector activity history
 */
async function loadDetectorActivity(odavlPath: string): Promise<DetectorActivity[]> {
  const detectorLogPath = path.join(odavlPath, 'detector-activity.json');
  
  if (!existsSync(detectorLogPath)) {
    return [];
  }

  try {
    const content = await readFile(detectorLogPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load detector activity:', error);
    return [];
  }
}

/**
 * Load recipe execution history
 */
async function loadRecipeHistory(odavlPath: string): Promise<RecipeHistory[]> {
  const recipeTrustPath = path.join(odavlPath, 'recipes-trust.json');
  
  if (!existsSync(recipeTrustPath)) {
    return [];
  }

  try {
    const content = await readFile(recipeTrustPath, 'utf-8');
    const trustData = JSON.parse(content);
    
    // Convert trust data to recipe history format
    return Object.entries(trustData).map(([recipeId, data]: [string, any]) => ({
      recipeId,
      fileType: 'typescript', // Default, will be enhanced
      successRate: data.successRate || 0,
      totalRuns: data.totalRuns || 0,
      avgLocChanged: data.avgLocChanged || 0,
      lastUsed: data.lastUsed || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to load recipe history:', error);
    return [];
  }
}

/**
 * Load Guardian gate history
 */
async function loadGuardianHistory(odavlPath: string): Promise<GuardianGateHistory[]> {
  const baselinePath = path.join(odavlPath, 'baseline-history.json');
  
  if (!existsSync(baselinePath)) {
    return [];
  }

  try {
    const content = await readFile(baselinePath, 'utf-8');
    const baseline = JSON.parse(content);
    
    if (!baseline.runs || !Array.isArray(baseline.runs)) {
      return [];
    }

    // Aggregate gate statistics
    const gateStats: Record<string, { passes: number; total: number; scores: number[] }> = {};
    
    for (const run of baseline.runs) {
      if (run.enforcement) {
        for (const [gate, passed] of Object.entries(run.enforcement)) {
          if (!gateStats[gate]) {
            gateStats[gate] = { passes: 0, total: 0, scores: [] };
          }
          gateStats[gate].total++;
          if (passed) gateStats[gate].passes++;
        }
      }
    }

    return Object.entries(gateStats).map(([gate, stats]) => ({
      gate,
      runs: stats.total,
      passRate: stats.total > 0 ? stats.passes / stats.total : 0,
      avgScore: stats.scores.length > 0 ? stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length : 0,
      lastRun: baseline.runs[baseline.runs.length - 1]?.timestamp || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to load Guardian history:', error);
    return [];
  }
}

/**
 * Load Brain fusion weights
 */
async function loadBrainWeights(odavlPath: string): Promise<FusionWeights> {
  const weightsPath = path.join(odavlPath, 'brain-history', 'fusion-weights.json');
  
  if (!existsSync(weightsPath)) {
    return {
      nn: 0.25,
      lstm: 0.15,
      mtl: 0.30,
      bayesian: 0.15,
      heuristic: 0.15,
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const content = await readFile(weightsPath, 'utf-8');
    const weights = JSON.parse(content);
    return {
      nn: weights.nn || 0.25,
      lstm: weights.lstm || 0.15,
      mtl: weights.mtl || 0.30,
      bayesian: weights.bayesian || 0.15,
      heuristic: weights.heuristic || 0.15,
      lastUpdated: weights.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to load Brain weights:', error);
    return {
      nn: 0.25,
      lstm: 0.15,
      mtl: 0.30,
      bayesian: 0.15,
      heuristic: 0.15,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Create empty context (fallback)
 */
function createEmptyContext(): OMSContext {
  return {
    fileTypes: [],
    riskIndex: {},
    detectors: [],
    recipes: [],
    guardianHistory: [],
    brainWeights: {
      nn: 0.25,
      lstm: 0.15,
      mtl: 0.30,
      bayesian: 0.15,
      heuristic: 0.15,
      lastUpdated: new Date().toISOString(),
    },
    loaded: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Resolve file type by path
 * OMEGA-P5: Real implementation with all 20 types
 */
export function resolveFileType(filePath: string): FileTypeDefinition | undefined {
  const allTypes: FileTypeDefinition[] = [
    TypeScriptFileType, TSXFileType, JavaScriptFileType, JSXFileType,
    JSONFileType, YAMLFileType, MarkdownFileType,
    EnvFileType, PrismaFileType, SQLFileType,
    DockerfileType, DockerComposeType, WorkflowsFileType,
    ConfigTSFileType, ConfigJSFileType, NextConfigFileType,
    PackageJSONFileType, PnpmLockFileType, ESLintConfigFileType, TSConfigFileType,
  ];

  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);

  for (const type of allTypes) {
    for (const pattern of type.extensions) {
      if (pattern.startsWith('.') && ext === pattern) {
        return type;
      }
      if (fileName === pattern || fileName.includes(pattern)) {
        return type;
      }
    }
  }

  return undefined;
}

/**
 * Build OMS context for specific file paths
 * OMEGA-P5: Real implementation with risk scoring
 */
export async function buildOMSContextForPaths(
  filePaths: string[],
  workspaceRoot: string = process.cwd()
): Promise<OMSContext> {
  const context = await loadOMSContext(workspaceRoot);

  for (const filePath of filePaths) {
    const fileType = resolveFileType(filePath);
    if (!fileType) continue;

    try {
      const metadata = await fileType.parse(filePath);
      
      const riskScore = computeFileRiskScore({
        type: fileType,
        detectorFailureRate: 0,
        changeFrequency: 0,
      });

      context.riskIndex[filePath] = riskScore;
    } catch (error) {
      console.error(`Failed to parse ${filePath}:`, error);
    }
  }

  return context;
}
