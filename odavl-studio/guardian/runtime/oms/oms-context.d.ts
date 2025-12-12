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
import type { FileTypeDefinition } from './file-types/ts.js';
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
export declare function loadOMSContext(workspaceRoot?: string): Promise<OMSContext>;
/**
 * Resolve file type by path
 * OMEGA-P5: Real implementation with all 20 types
 */
export declare function resolveFileType(filePath: string): FileTypeDefinition | undefined;
/**
 * Build OMS context for specific file paths
 * OMEGA-P5: Real implementation with risk scoring
 */
export declare function buildOMSContextForPaths(filePaths: string[], workspaceRoot?: string): Promise<OMSContext>;
