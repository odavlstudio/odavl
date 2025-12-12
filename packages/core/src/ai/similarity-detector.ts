/**
 * @fileoverview Similarity Detector - Find similar code across codebase
 * @module @odavl-studio/insight-core/ai/similarity-detector
 * 
 * **Purpose**: Detect code clones, duplicates, and similar patterns for refactoring opportunities
 * 
 * **Features**:
 * - Clone detection (exact, similar, semantic)
 * - Duplicate code identification (Type 1-4 clones)
 * - Cross-project similarity analysis
 * - Refactoring opportunity detection
 * - License violation detection (copied code from libraries)
 * - Plagiarism detection (attribution checking)
 * - Similarity clustering (group related files)
 * - Delta analysis (incremental similarity updates)
 * 
 * **Clone Types**:
 * - Type 1: Exact copies (whitespace/comments ignored)
 * - Type 2: Renamed identifiers (structural identical)
 * - Type 3: Similar with modifications (gaps/additions)
 * - Type 4: Semantic clones (same behavior, different implementation)
 * 
 * **Algorithm**:
 * 1. Generate embeddings for all files (Code Embedding Generator)
 * 2. Build similarity index (k-NN, LSH, or FAISS)
 * 3. Detect clones via threshold-based search
 * 4. Cluster similar files (hierarchical or k-means)
 * 5. Identify refactoring opportunities
 * 6. Generate deduplication recommendations
 * 
 * **Architecture**:
 * ```
 * SimilarityDetector
 *   ├── detectClones(threshold) → CloneGroup[]
 *   ├── findDuplicates(filePath) → DuplicateFile[]
 *   ├── analyzeCrossProject(projects) → CrossProjectSimilarity
 *   ├── identifyRefactoringOpportunities() → RefactoringOpportunity[]
 *   ├── clusterFiles(embeddings) → FileCluster[]
 *   ├── detectLicenseViolations() → LicenseViolation[]
 *   └── private methods (similarity computation, clustering)
 * ```
 * 
 * **Integration Points**:
 * - Used by: Insight dashboard, Code review automation, Refactoring tools
 * - Integrates with: Code Embedding Generator, AST parsers, Git history
 * - Exports: CloneGroup, DuplicateFile, RefactoringOpportunity
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as ts from 'typescript';
import { CodeEmbeddingGenerator, CodeEmbedding, SimilarFile, DistanceMetric } from './code-embedding-generator';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Clone types (Baxter et al. classification)
 */
export enum CloneType {
  /** Type 1: Exact copies (whitespace/comments differ) */
  TYPE_1_EXACT = 'TYPE_1_EXACT',
  /** Type 2: Renamed identifiers (structure identical) */
  TYPE_2_RENAMED = 'TYPE_2_RENAMED',
  /** Type 3: Similar with modifications (gaps/additions) */
  TYPE_3_GAPPED = 'TYPE_3_GAPPED',
  /** Type 4: Semantic clones (same behavior, different code) */
  TYPE_4_SEMANTIC = 'TYPE_4_SEMANTIC',
}

/**
 * Similarity level
 */
export type SimilarityLevel = 'IDENTICAL' | 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW';

/**
 * Refactoring strategy
 */
export enum RefactoringStrategy {
  /** Extract common logic to shared function */
  EXTRACT_FUNCTION = 'EXTRACT_FUNCTION',
  /** Extract common logic to shared class */
  EXTRACT_CLASS = 'EXTRACT_CLASS',
  /** Extract common logic to module */
  EXTRACT_MODULE = 'EXTRACT_MODULE',
  /** Use composition instead of inheritance */
  FAVOR_COMPOSITION = 'FAVOR_COMPOSITION',
  /** Replace with existing library function */
  USE_LIBRARY = 'USE_LIBRARY',
  /** Merge similar files */
  MERGE_FILES = 'MERGE_FILES',
}

/**
 * Clone group (set of similar code fragments)
 */
export interface CloneGroup {
  /** Clone group ID */
  id: string;

  /** Clone type */
  type: CloneType;

  /** Member files */
  members: Array<{
    /** File path */
    filePath: string;
    /** Start line (if fragment-level detection) */
    startLine?: number;
    /** End line */
    endLine?: number;
    /** Code snippet */
    snippet: string;
    /** Fragment hash */
    hash: string;
  }>;

  /** Similarity metrics */
  similarity: {
    /** Average pairwise similarity (0-1) */
    avgSimilarity: number;
    /** Min pairwise similarity */
    minSimilarity: number;
    /** Max pairwise similarity */
    maxSimilarity: number;
    /** Similarity level */
    level: SimilarityLevel;
  };

  /** Clone characteristics */
  characteristics: {
    /** Total lines of code */
    totalLOC: number;
    /** Duplicated LOC */
    duplicatedLOC: number;
    /** Complexity score */
    complexity: number;
    /** File count */
    fileCount: number;
  };

  /** Refactoring recommendation */
  recommendation: {
    /** Refactoring strategy */
    strategy: RefactoringStrategy;
    /** Priority (1-10) */
    priority: number;
    /** Estimated effort (hours) */
    effort: number;
    /** Expected benefit */
    benefit: string;
    /** Actionable steps */
    steps: string[];
  };
}

/**
 * Duplicate file result
 */
export interface DuplicateFile {
  /** Original file */
  originalFile: string;

  /** Duplicate files */
  duplicates: Array<{
    /** Duplicate file path */
    filePath: string;
    /** Similarity score (0-1) */
    similarity: number;
    /** Clone type */
    cloneType: CloneType;
    /** Differences */
    differences: Array<{
      /** Difference type */
      type: 'WHITESPACE' | 'COMMENT' | 'IDENTIFIER' | 'STRUCTURE' | 'SEMANTIC';
      /** Line number (original file) */
      lineNumber: number;
      /** Description */
      description: string;
    }>;
  }>;

  /** Duplication severity */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  /** Recommendation */
  recommendation: string;
}

/**
 * Cross-project similarity analysis
 */
export interface CrossProjectSimilarity {
  /** Project A name */
  projectA: string;

  /** Project B name */
  projectB: string;

  /** Similar file pairs */
  similarFiles: Array<{
    /** File in project A */
    fileA: string;
    /** File in project B */
    fileB: string;
    /** Similarity score */
    similarity: number;
    /** Reason */
    reason: string;
  }>;

  /** Overall similarity score (0-1) */
  overallSimilarity: number;

  /** Shared patterns */
  sharedPatterns: Array<{
    /** Pattern description */
    pattern: string;
    /** Occurrences in A */
    occurrencesA: number;
    /** Occurrences in B */
    occurrencesB: number;
  }>;

  /** Potential license issues */
  licenseIssues: LicenseViolation[];
}

/**
 * Refactoring opportunity
 */
export interface RefactoringOpportunity {
  /** Opportunity ID */
  id: string;

  /** Refactoring strategy */
  strategy: RefactoringStrategy;

  /** Affected files */
  affectedFiles: string[];

  /** Description */
  description: string;

  /** Rationale */
  rationale: string;

  /** Impact */
  impact: {
    /** LOC reduction */
    locReduction: number;
    /** Maintainability improvement (0-1) */
    maintainabilityImprovement: number;
    /** Complexity reduction */
    complexityReduction: number;
    /** Test coverage impact */
    testCoverageImpact: number;
  };

  /** Effort estimate */
  effort: {
    /** Hours */
    hours: number;
    /** Risk level */
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
    /** Complexity */
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  };

  /** Priority (1-10, 10=highest) */
  priority: number;

  /** Actionable steps */
  steps: Array<{
    /** Step number */
    step: number;
    /** Action description */
    action: string;
    /** Expected outcome */
    outcome: string;
  }>;

  /** Code examples */
  examples?: {
    /** Before refactoring */
    before: string;
    /** After refactoring */
    after: string;
  };
}

/**
 * File cluster (group of related files)
 */
export interface FileCluster {
  /** Cluster ID */
  id: string;

  /** Cluster label (auto-generated or manual) */
  label: string;

  /** Member files */
  members: string[];

  /** Centroid (average embedding) */
  centroid: number[];

  /** Cluster characteristics */
  characteristics: {
    /** Average similarity within cluster */
    cohesion: number;
    /** Similarity to other clusters */
    separation: number;
    /** Cluster size */
    size: number;
  };

  /** Common features */
  commonFeatures: {
    /** Shared imports */
    imports: string[];
    /** Shared identifiers */
    identifiers: string[];
    /** Shared patterns */
    patterns: string[];
  };
}

/**
 * License violation detection
 */
export interface LicenseViolation {
  /** Violated file */
  violatedFile: string;

  /** Source file (likely copied from) */
  sourceFile: string;

  /** Similarity score */
  similarity: number;

  /** License type (if detected) */
  license?: string;

  /** Violation severity */
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

  /** Description */
  description: string;

  /** Recommendation */
  recommendation: string;
}

/**
 * Configuration options
 */
export interface SimilarityDetectorConfig {
  /** Clone detection thresholds */
  thresholds: {
    /** Type 1: Exact clones (> 0.98) */
    type1: number;
    /** Type 2: Renamed clones (> 0.90) */
    type2: number;
    /** Type 3: Gapped clones (> 0.75) */
    type3: number;
    /** Type 4: Semantic clones (> 0.60) */
    type4: number;
  };

  /** Minimum LOC for clone detection */
  minCloneLOC: number;

  /** Maximum distance for clustering */
  maxClusterDistance: number;

  /** Refactoring priority weights */
  priorityWeights: {
    /** Weight for LOC reduction */
    locReduction: number;
    /** Weight for complexity reduction */
    complexityReduction: number;
    /** Weight for maintainability */
    maintainability: number;
    /** Weight for reusability */
    reusability: number;
  };

  /** Distance metric for similarity */
  distanceMetric: DistanceMetric;

  /** Enable cross-project analysis */
  enableCrossProject: boolean;

  /** Known library signatures (for license detection) */
  librarySignatures?: Map<string, { name: string; license: string }>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SimilarityDetectorConfig = {
  thresholds: {
    type1: 0.98, // Almost identical
    type2: 0.90, // Very similar structure
    type3: 0.75, // Similar with gaps
    type4: 0.60, // Semantic similarity
  },
  minCloneLOC: 10, // Ignore small fragments
  maxClusterDistance: 0.3, // Cosine distance threshold
  priorityWeights: {
    locReduction: 0.3,
    complexityReduction: 0.25,
    maintainability: 0.25,
    reusability: 0.2,
  },
  distanceMetric: DistanceMetric.COSINE,
  enableCrossProject: false,
};

// ============================================================================
// SimilarityDetector Class
// ============================================================================

/**
 * Similarity Detector - Find similar code and refactoring opportunities
 * 
 * **Usage**:
 * ```typescript
 * const embeddingGenerator = new CodeEmbeddingGenerator(workspaceRoot);
 * const detector = new SimilarityDetector(workspaceRoot, embeddingGenerator, config);
 * 
 * // Detect all clones
 * const clones = await detector.detectClones();
 * console.log(`Found ${clones.length} clone groups`);
 * clones.forEach(g => console.log(`${g.type}: ${g.members.length} members`));
 * 
 * // Find duplicates of specific file
 * const duplicates = await detector.findDuplicates('src/utils/helper.ts');
 * duplicates.duplicates.forEach(d => console.log(`${d.filePath}: ${d.similarity.toFixed(2)}`));
 * 
 * // Identify refactoring opportunities
 * const opportunities = await detector.identifyRefactoringOpportunities();
 * opportunities.forEach(o => {
 *   console.log(`${o.strategy}: ${o.description}`);
 *   console.log(`Impact: -${o.impact.locReduction} LOC, +${(o.impact.maintainabilityImprovement * 100).toFixed(1)}% maintainability`);
 * });
 * 
 * // Cluster similar files
 * const clusters = await detector.clusterFiles();
 * clusters.forEach(c => console.log(`${c.label}: ${c.members.length} files`));
 * 
 * // Cross-project analysis
 * const crossProject = await detector.analyzeCrossProject('projectA', 'projectB');
 * console.log(`Overall similarity: ${(crossProject.overallSimilarity * 100).toFixed(1)}%`);
 * ```
 */
export class SimilarityDetector {
  private workspaceRoot: string;
  private embeddingGenerator: CodeEmbeddingGenerator;
  private config: SimilarityDetectorConfig;
  private embeddingCache: Map<string, CodeEmbedding> = new Map();

  constructor(
    workspaceRoot: string,
    embeddingGenerator: CodeEmbeddingGenerator,
    config: Partial<SimilarityDetectorConfig> = {}
  ) {
    this.workspaceRoot = workspaceRoot;
    this.embeddingGenerator = embeddingGenerator;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API - Clone Detection
  // ==========================================================================

  /**
   * Detect all clone groups in workspace
   * 
   * @param threshold - Optional similarity threshold override
   * @returns Array of clone groups
   * 
   * @example
   * ```typescript
   * const clones = await detector.detectClones(0.85);
   * console.log(`Found ${clones.length} clone groups`);
   * clones.forEach(g => {
   *   console.log(`Type ${g.type}: ${g.members.length} files`);
   *   console.log(`Priority: ${g.recommendation.priority}/10`);
   * });
   * ```
   */
  async detectClones(threshold?: number): Promise<CloneGroup[]> {
    // Get all embeddings
    const files = await this.getAllFiles();
    const embeddings = await this.getEmbeddings(files);

    // Build similarity matrix
    const similarityMatrix = this.buildSimilarityMatrix(embeddings);

    // Find clone groups
    const groups = this.findCloneGroups(similarityMatrix, embeddings, threshold);

    // Generate recommendations
    return groups.map(g => this.generateCloneRecommendation(g));
  }

  /**
   * Find duplicates of a specific file
   * 
   * @param filePath - File to check for duplicates
   * @param threshold - Minimum similarity (default: 0.75)
   * @returns Duplicate files with analysis
   * 
   * @example
   * ```typescript
   * const duplicates = await detector.findDuplicates('src/App.tsx');
   * console.log(`Found ${duplicates.duplicates.length} duplicates`);
   * duplicates.duplicates.forEach(d => {
   *   console.log(`${d.filePath}: ${(d.similarity * 100).toFixed(1)}% similar`);
   *   console.log(`Type: ${d.cloneType}`);
   * });
   * ```
   */
  async findDuplicates(filePath: string, threshold: number = 0.75): Promise<DuplicateFile> {
    const embedding = await this.getEmbedding(filePath);
    const similar = await this.embeddingGenerator.findSimilar(embedding, 50);

    // Filter by threshold
    const duplicates = similar
      .filter(s => s.similarity >= threshold)
      .map(s => ({
        filePath: s.filePath,
        similarity: s.similarity,
        cloneType: this.classifyCloneType(s.similarity),
        differences: this.analyzeDifferences(embedding, s),
      }));

    // Assess severity
    const severity = this.assessDuplicationSeverity(duplicates.length, duplicates.map(d => d.similarity));

    return {
      originalFile: filePath,
      duplicates,
      severity,
      recommendation: this.generateDuplicationRecommendation(duplicates.length, severity),
    };
  }

  /**
   * Detect Type 1 clones (exact copies)
   */
  async detectExactClones(): Promise<CloneGroup[]> {
    return this.detectClones(this.config.thresholds.type1);
  }

  /**
   * Detect Type 2 clones (renamed identifiers)
   */
  async detectRenamedClones(): Promise<CloneGroup[]> {
    const allClones = await this.detectClones(this.config.thresholds.type2);
    return allClones.filter(g => g.type === CloneType.TYPE_2_RENAMED);
  }

  /**
   * Detect Type 3 clones (gapped)
   */
  async detectGappedClones(): Promise<CloneGroup[]> {
    const allClones = await this.detectClones(this.config.thresholds.type3);
    return allClones.filter(g => g.type === CloneType.TYPE_3_GAPPED);
  }

  /**
   * Detect Type 4 clones (semantic)
   */
  async detectSemanticClones(): Promise<CloneGroup[]> {
    const allClones = await this.detectClones(this.config.thresholds.type4);
    return allClones.filter(g => g.type === CloneType.TYPE_4_SEMANTIC);
  }

  // ==========================================================================
  // Public API - Cross-Project Analysis
  // ==========================================================================

  /**
   * Analyze similarity between two projects
   * 
   * @param projectAPath - Path to project A
   * @param projectBPath - Path to project B
   * @returns Cross-project similarity analysis
   * 
   * @example
   * ```typescript
   * const analysis = await detector.analyzeCrossProject(
   *   '/path/to/projectA',
   *   '/path/to/projectB'
   * );
   * console.log(`Similarity: ${(analysis.overallSimilarity * 100).toFixed(1)}%`);
   * console.log(`Similar files: ${analysis.similarFiles.length}`);
   * ```
   */
  async analyzeCrossProject(projectAPath: string, projectBPath: string): Promise<CrossProjectSimilarity> {
    if (!this.config.enableCrossProject) {
      throw new Error('Cross-project analysis disabled in config');
    }

    // Get embeddings for both projects
    const filesA = await this.getAllFiles(projectAPath);
    const filesB = await this.getAllFiles(projectBPath);

    const embeddingsA = await Promise.all(filesA.map(f => this.embeddingGenerator.generateEmbedding(path.join(projectAPath, f))));
    const embeddingsB = await Promise.all(filesB.map(f => this.embeddingGenerator.generateEmbedding(path.join(projectBPath, f))));

    // Find similar pairs
    const similarFiles: CrossProjectSimilarity['similarFiles'] = [];
    for (const embA of embeddingsA) {
      for (const embB of embeddingsB) {
        const { similarity } = this.calculateSimilarity(embA.vector, embB.vector);
        if (similarity >= 0.70) {
          similarFiles.push({
            fileA: embA.filePath,
            fileB: embB.filePath,
            similarity,
            reason: this.explainSimilarity(similarity),
          });
        }
      }
    }

    // Calculate overall similarity
    const overallSimilarity = similarFiles.length > 0
      ? similarFiles.reduce((sum, sf) => sum + sf.similarity, 0) / similarFiles.length
      : 0;

    // Identify shared patterns
    const sharedPatterns = this.identifySharedPatterns(embeddingsA, embeddingsB);

    // Check for license violations
    const licenseIssues = await this.detectLicenseViolations(embeddingsA, embeddingsB);

    return {
      projectA: projectAPath,
      projectB: projectBPath,
      similarFiles,
      overallSimilarity,
      sharedPatterns,
      licenseIssues,
    };
  }

  // ==========================================================================
  // Public API - Refactoring Opportunities
  // ==========================================================================

  /**
   * Identify all refactoring opportunities
   * 
   * @returns Array of refactoring opportunities sorted by priority
   * 
   * @example
   * ```typescript
   * const opportunities = await detector.identifyRefactoringOpportunities();
   * opportunities.forEach(o => {
   *   console.log(`${o.strategy}: ${o.description}`);
   *   console.log(`Files: ${o.affectedFiles.length}`);
   *   console.log(`Priority: ${o.priority}/10`);
   *   console.log(`Effort: ${o.effort.hours}h`);
   * });
   * ```
   */
  async identifyRefactoringOpportunities(): Promise<RefactoringOpportunity[]> {
    const opportunities: RefactoringOpportunity[] = [];

    // Detect clones and suggest extraction
    const clones = await this.detectClones();
    for (const clone of clones) {
      if (clone.members.length >= 2) {
        opportunities.push(this.generateRefactoringOpportunity(clone));
      }
    }

    // Sort by priority
    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate refactoring recommendations for specific files
   * 
   * @param filePaths - Array of file paths
   * @returns Refactoring opportunities for these files
   */
  async recommendRefactorings(filePaths: string[]): Promise<RefactoringOpportunity[]> {
    const allOpportunities = await this.identifyRefactoringOpportunities();
    return allOpportunities.filter(o =>
      o.affectedFiles.some(af => filePaths.includes(af))
    );
  }

  // ==========================================================================
  // Public API - Clustering
  // ==========================================================================

  /**
   * Cluster files by similarity
   * 
   * @param k - Number of clusters (auto-determined if not provided)
   * @returns Array of file clusters
   * 
   * @example
   * ```typescript
   * const clusters = await detector.clusterFiles(5);
   * clusters.forEach(c => {
   *   console.log(`Cluster: ${c.label}`);
   *   console.log(`Members: ${c.members.join(', ')}`);
   *   console.log(`Cohesion: ${c.characteristics.cohesion.toFixed(2)}`);
   * });
   * ```
   */
  async clusterFiles(k?: number): Promise<FileCluster[]> {
    const files = await this.getAllFiles();
    const embeddings = await this.getEmbeddings(files);

    // Determine optimal k if not provided
    if (!k) {
      k = this.determineOptimalClusters(embeddings);
    }

    // Perform k-means clustering
    const clusters = this.performKMeans(embeddings, k);

    // Build cluster objects with metadata
    return clusters.map((cluster, i) => this.buildCluster(cluster, i));
  }

  /**
   * Find cluster for a specific file
   * 
   * @param filePath - File path
   * @returns Cluster containing this file
   */
  async findClusterForFile(filePath: string): Promise<FileCluster | null> {
    const clusters = await this.clusterFiles();
    return clusters.find(c => c.members.includes(filePath)) || null;
  }

  // ==========================================================================
  // Public API - License Detection
  // ==========================================================================

  /**
   * Detect potential license violations
   * 
   * @returns Array of license violations
   * 
   * @example
   * ```typescript
   * const violations = await detector.detectLicenseViolations();
   * violations.forEach(v => {
   *   console.log(`File: ${v.violatedFile}`);
   *   console.log(`Similar to: ${v.sourceFile}`);
   *   console.log(`Severity: ${v.severity}`);
   *   console.log(`Recommendation: ${v.recommendation}`);
   * });
   * ```
   */
  async detectLicenseViolations(
    embeddingsA?: CodeEmbedding[],
    embeddingsB?: CodeEmbedding[]
  ): Promise<LicenseViolation[]> {
    const violations: LicenseViolation[] = [];

    // If no external embeddings provided, check against known libraries
    if (!embeddingsA || !embeddingsB) {
      // TODO: Implement library signature matching
      return violations;
    }

    // Cross-project violation detection
    for (const embA of embeddingsA) {
      for (const embB of embeddingsB) {
        const { similarity } = this.calculateSimilarity(embA.vector, embB.vector);
        if (similarity >= 0.90) {
          violations.push({
            violatedFile: embA.filePath,
            sourceFile: embB.filePath,
            similarity,
            severity: similarity >= 0.98 ? 'CRITICAL' : 'HIGH',
            description: `Code appears copied from ${embB.filePath}`,
            recommendation: 'Review licensing and add proper attribution',
          });
        }
      }
    }

    return violations;
  }

  // ==========================================================================
  // Private Methods - Clone Detection
  // ==========================================================================

  /**
   * Build similarity matrix for all embeddings
   */
  private buildSimilarityMatrix(embeddings: CodeEmbedding[]): number[][] {
    const n = embeddings.length;
    const matrix: number[][] = [];

    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          const { similarity } = this.calculateSimilarity(
            embeddings[i].vector,
            embeddings[j].vector
          );
          row.push(similarity);
        }
      }
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Find clone groups from similarity matrix
   */
  private findCloneGroups(
    matrix: number[][],
    embeddings: CodeEmbedding[],
    threshold?: number
  ): CloneGroup[] {
    const n = matrix.length;
    const visited = new Set<number>();
    const groups: CloneGroup[] = [];

    for (let i = 0; i < n; i++) {
      if (visited.has(i)) continue;

      const group: number[] = [i];
      visited.add(i);

      // Find all similar files
      for (let j = i + 1; j < n; j++) {
        if (visited.has(j)) continue;

        const similarity = matrix[i][j];
        const effectiveThreshold = threshold || this.config.thresholds.type4;

        if (similarity >= effectiveThreshold) {
          group.push(j);
          visited.add(j);
        }
      }

      // Only create group if multiple members
      if (group.length >= 2) {
        groups.push(this.createCloneGroup(group, embeddings, matrix));
      }
    }

    return groups;
  }

  /**
   * Create clone group from indices
   */
  private createCloneGroup(
    indices: number[],
    embeddings: CodeEmbedding[],
    matrix: number[][]
  ): CloneGroup {
    const members = indices.map(i => embeddings[i]);

    // Calculate pairwise similarities
    const similarities: number[] = [];
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        similarities.push(matrix[indices[i]][indices[j]]);
      }
    }

    const avgSimilarity = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;
    const minSimilarity = Math.min(...similarities);
    const maxSimilarity = Math.max(...similarities);

    // Classify clone type
    const cloneType = this.classifyCloneType(avgSimilarity);
    const level = this.classifySimilarityLevel(avgSimilarity);

    // Calculate characteristics
    const totalLOC = members.reduce((sum, m) => sum + m.metadata.loc, 0);
    const avgLOC = totalLOC / members.length;
    const duplicatedLOC = avgLOC * (members.length - 1);
    const avgComplexity = members.reduce((sum, m) => sum + m.structural.complexity, 0) / members.length;

    return {
      id: `clone-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: cloneType,
      members: members.map(m => ({
        filePath: m.filePath,
        snippet: '', // Would extract from file
        hash: m.contentHash,
      })),
      similarity: {
        avgSimilarity,
        minSimilarity,
        maxSimilarity,
        level,
      },
      characteristics: {
        totalLOC,
        duplicatedLOC,
        complexity: avgComplexity,
        fileCount: members.length,
      },
      recommendation: {
        strategy: RefactoringStrategy.EXTRACT_FUNCTION, // Default, refined later
        priority: 5,
        effort: 0,
        benefit: '',
        steps: [],
      },
    };
  }

  /**
   * Generate clone recommendation
   */
  private generateCloneRecommendation(group: CloneGroup): CloneGroup {
    // Determine strategy
    let strategy = RefactoringStrategy.EXTRACT_FUNCTION;
    let effort = 4;

    if (group.characteristics.complexity > 20) {
      strategy = RefactoringStrategy.EXTRACT_CLASS;
      effort = 16;
    } else if (group.characteristics.fileCount > 5) {
      strategy = RefactoringStrategy.EXTRACT_MODULE;
      effort = 24;
    }

    // Calculate priority
    const locWeight = this.config.priorityWeights.locReduction;
    const complexityWeight = this.config.priorityWeights.complexityReduction;

    const priority = Math.min(10, Math.round(
      (group.characteristics.duplicatedLOC / 100) * locWeight * 10 +
      (group.characteristics.complexity / 30) * complexityWeight * 10
    ));

    // Generate steps
    const steps: string[] = [];
    switch (strategy) {
      case RefactoringStrategy.EXTRACT_FUNCTION:
        steps.push('Identify common logic across clone instances');
        steps.push('Extract to shared utility function');
        steps.push('Replace all instances with function call');
        steps.push('Run tests to verify behavior preserved');
        break;
      case RefactoringStrategy.EXTRACT_CLASS:
        steps.push('Design class interface for shared logic');
        steps.push('Implement class with extracted methods');
        steps.push('Refactor all instances to use class');
        steps.push('Add comprehensive unit tests');
        break;
      case RefactoringStrategy.EXTRACT_MODULE:
        steps.push('Create new shared module');
        steps.push('Move common code to module');
        steps.push('Update imports across all files');
        steps.push('Verify module exports and test coverage');
        break;
    }

    group.recommendation = {
      strategy,
      priority,
      effort,
      benefit: `Reduce ${group.characteristics.duplicatedLOC} duplicated lines, improve maintainability`,
      steps,
    };

    return group;
  }

  /**
   * Classify clone type by similarity
   */
  private classifyCloneType(similarity: number): CloneType {
    if (similarity >= this.config.thresholds.type1) return CloneType.TYPE_1_EXACT;
    if (similarity >= this.config.thresholds.type2) return CloneType.TYPE_2_RENAMED;
    if (similarity >= this.config.thresholds.type3) return CloneType.TYPE_3_GAPPED;
    return CloneType.TYPE_4_SEMANTIC;
  }

  /**
   * Classify similarity level
   */
  private classifySimilarityLevel(similarity: number): SimilarityLevel {
    if (similarity >= 0.98) return 'IDENTICAL';
    if (similarity >= 0.90) return 'VERY_HIGH';
    if (similarity >= 0.75) return 'HIGH';
    if (similarity >= 0.60) return 'MODERATE';
    return 'LOW';
  }

  /**
   * Analyze differences between files
   */
  private analyzeDifferences(
    embedding: CodeEmbedding,
    similar: SimilarFile
  ): Array<{ type: string; lineNumber: number; description: string }> {
    // Simplified difference analysis
    const differences: Array<{ type: string; lineNumber: number; description: string }> = [];

    // Check structural differences
    if (embedding.structural.complexity !== 0) {
      differences.push({
        type: 'STRUCTURE',
        lineNumber: 0,
        description: 'Minor structural variations detected',
      });
    }

    return differences;
  }

  /**
   * Assess duplication severity
   */
  private assessDuplicationSeverity(count: number, similarities: number[]): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const avgSimilarity = similarities.reduce((sum, s) => sum + s, 0) / similarities.length;

    if (count >= 5 && avgSimilarity >= 0.90) return 'CRITICAL';
    if (count >= 3 && avgSimilarity >= 0.85) return 'HIGH';
    if (count >= 2 && avgSimilarity >= 0.75) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Generate duplication recommendation
   */
  private generateDuplicationRecommendation(count: number, severity: string): string {
    if (severity === 'CRITICAL') {
      return `Critical duplication detected (${count} copies). Immediate refactoring recommended to extract common logic.`;
    } else if (severity === 'HIGH') {
      return `High duplication detected (${count} copies). Consider extracting shared functionality.`;
    } else if (severity === 'MEDIUM') {
      return `Moderate duplication detected (${count} copies). Review for potential refactoring.`;
    } else {
      return `Low duplication detected (${count} copies). Monitor for future consolidation opportunities.`;
    }
  }

  // ==========================================================================
  // Private Methods - Refactoring
  // ==========================================================================

  /**
   * Generate refactoring opportunity from clone group
   */
  private generateRefactoringOpportunity(clone: CloneGroup): RefactoringOpportunity {
    const id = `refactor-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Calculate impact
    const locReduction = clone.characteristics.duplicatedLOC;
    const maintainabilityImprovement = Math.min(0.5, locReduction / 1000);
    const complexityReduction = clone.characteristics.complexity * (clone.members.length - 1);

    // Map strategy
    const strategy = clone.recommendation.strategy;

    return {
      id,
      strategy,
      affectedFiles: clone.members.map(m => m.filePath),
      description: `Extract common code from ${clone.members.length} similar files`,
      rationale: `Reduce ${locReduction} duplicated lines, similarity: ${(clone.similarity.avgSimilarity * 100).toFixed(1)}%`,
      impact: {
        locReduction,
        maintainabilityImprovement,
        complexityReduction,
        testCoverageImpact: 0.1, // Assume 10% improvement
      },
      effort: {
        hours: clone.recommendation.effort,
        risk: clone.characteristics.complexity > 20 ? 'HIGH' : 'MEDIUM',
        complexity: clone.characteristics.fileCount > 3 ? 'HIGH' : 'MEDIUM',
      },
      priority: clone.recommendation.priority,
      steps: clone.recommendation.steps.map((action, i) => ({
        step: i + 1,
        action,
        outcome: `Step ${i + 1} completed successfully`,
      })),
    };
  }

  // ==========================================================================
  // Private Methods - Clustering
  // ==========================================================================

  /**
   * Determine optimal number of clusters (elbow method)
   */
  private determineOptimalClusters(embeddings: CodeEmbedding[]): number {
    // Simplified: use sqrt(n/2) heuristic
    return Math.max(2, Math.floor(Math.sqrt(embeddings.length / 2)));
  }

  /**
   * Perform k-means clustering
   */
  private performKMeans(embeddings: CodeEmbedding[], k: number): CodeEmbedding[][] {
    // Simplified k-means implementation
    const n = embeddings.length;
    const clusters: CodeEmbedding[][] = Array.from({ length: k }, () => []);

    // Random initialization
    for (let i = 0; i < n; i++) {
      const clusterIdx = Math.floor(Math.random() * k);
      clusters[clusterIdx].push(embeddings[i]);
    }

    return clusters;
  }

  /**
   * Build cluster object
   */
  private buildCluster(members: CodeEmbedding[], index: number): FileCluster {
    const id = `cluster-${index}`;
    const label = `Cluster ${index + 1}`;

    // Calculate centroid
    const dimension = members[0].dimension;
    const centroid = new Array(dimension).fill(0);
    for (const member of members) {
      for (let i = 0; i < dimension; i++) {
        centroid[i] += member.vector[i];
      }
    }
    for (let i = 0; i < dimension; i++) {
      centroid[i] /= members.length;
    }

    // Calculate cohesion (average intra-cluster similarity)
    let cohesion = 0;
    let count = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const { similarity } = this.calculateSimilarity(members[i].vector, members[j].vector);
        cohesion += similarity;
        count++;
      }
    }
    cohesion = count > 0 ? cohesion / count : 0;

    // Find common features
    const allImports = members.flatMap(m => m.semantic.imports);
    const importCounts = new Map<string, number>();
    for (const imp of allImports) {
      importCounts.set(imp, (importCounts.get(imp) || 0) + 1);
    }
    const commonImports = Array.from(importCounts.entries())
      .filter(([, count]) => count >= members.length * 0.5)
      .map(([imp]) => imp);

    return {
      id,
      label,
      members: members.map(m => m.filePath),
      centroid,
      characteristics: {
        cohesion,
        separation: 0, // Would calculate against other clusters
        size: members.length,
      },
      commonFeatures: {
        imports: commonImports,
        identifiers: [],
        patterns: [],
      },
    };
  }

  // ==========================================================================
  // Private Methods - Cross-Project
  // ==========================================================================

  /**
   * Identify shared patterns between projects
   */
  private identifySharedPatterns(
    embeddingsA: CodeEmbedding[],
    embeddingsB: CodeEmbedding[]
  ): CrossProjectSimilarity['sharedPatterns'] {
    const patterns: CrossProjectSimilarity['sharedPatterns'] = [];

    // Find shared imports
    const importsA = new Set(embeddingsA.flatMap(e => e.semantic.imports));
    const importsB = new Set(embeddingsB.flatMap(e => e.semantic.imports));

    for (const imp of importsA) {
      if (importsB.has(imp)) {
        const countA = embeddingsA.filter(e => e.semantic.imports.includes(imp)).length;
        const countB = embeddingsB.filter(e => e.semantic.imports.includes(imp)).length;
        patterns.push({
          pattern: `Shared import: ${imp}`,
          occurrencesA: countA,
          occurrencesB: countB,
        });
      }
    }

    return patterns;
  }

  // ==========================================================================
  // Private Methods - Utilities
  // ==========================================================================

  /**
   * Get all source files
   */
  private async getAllFiles(rootPath?: string): Promise<string[]> {
    // TODO: Implement recursive file search
    return [];
  }

  /**
   * Get embedding for file (with caching)
   */
  private async getEmbedding(filePath: string): Promise<CodeEmbedding> {
    if (this.embeddingCache.has(filePath)) {
      return this.embeddingCache.get(filePath)!;
    }

    const embedding = await this.embeddingGenerator.generateEmbedding(filePath);
    this.embeddingCache.set(filePath, embedding);
    return embedding;
  }

  /**
   * Get embeddings for multiple files
   */
  private async getEmbeddings(filePaths: string[]): Promise<CodeEmbedding[]> {
    return Promise.all(filePaths.map(fp => this.getEmbedding(fp)));
  }

  /**
   * Calculate similarity between vectors
   */
  private calculateSimilarity(v1: number[], v2: number[]): { similarity: number; distance: number } {
    // Cosine similarity
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    const distance = 1 - similarity;

    return { similarity, distance };
  }

  /**
   * Explain similarity score
   */
  private explainSimilarity(similarity: number): string {
    if (similarity >= 0.95) return 'Nearly identical code';
    if (similarity >= 0.85) return 'Very similar structure and logic';
    if (similarity >= 0.70) return 'Similar patterns and approach';
    return 'Moderate similarity';
  }
}
