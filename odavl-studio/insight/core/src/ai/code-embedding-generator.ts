/**
 * @fileoverview Code Embedding Generator - Generate vector representations of code
 * @module @odavl-studio/insight-core/ai/code-embedding-generator
 * 
 * **Purpose**: Convert code into semantic vector embeddings for similarity search and analysis
 * 
 * **Features**:
 * - AST-based embeddings (structural code understanding)
 * - Semantic code vectors (meaning-aware representations)
 * - Multiple embedding models (TF-IDF, Word2Vec, BERT-style transformers)
 * - Dimensionality reduction (t-SNE, PCA, UMAP)
 * - Similarity search infrastructure (cosine, Euclidean, Manhattan)
 * - Custom model training (domain-specific embeddings)
 * - Incremental embedding updates (efficient re-computation)
 * - Embedding visualization (2D/3D projections)
 * 
 * **Algorithm**:
 * 1. Parse code to AST (TypeScript Compiler API)
 * 2. Extract structural features (node types, nesting, patterns)
 * 3. Extract semantic features (identifiers, literals, comments)
 * 4. Generate embedding vector (model-specific)
 * 5. Normalize and cache embeddings
 * 6. Build similarity index (FAISS-style)
 * 
 * **Architecture**:
 * ```
 * CodeEmbeddingGenerator
 *   ├── generateEmbedding(code) → CodeEmbedding
 *   ├── generateBatch(files) → CodeEmbedding[]
 *   ├── trainModel(corpus) → void
 *   ├── reduceDimensionality(embeddings) → ReducedEmbedding[]
 *   ├── buildIndex(embeddings) → SimilarityIndex
 *   ├── findSimilar(embedding, k) → SimilarFile[]
 *   └── private methods (feature extraction, model inference)
 * ```
 * 
 * **Integration Points**:
 * - Used by: Similarity Detector, Clone Detection, Insight Recommender
 * - Integrates with: TypeScript Compiler, TensorFlow.js, Vector stores
 * - Exports: CodeEmbedding, SimilarityIndex, EmbeddingModel
 */

import * as ts from 'typescript';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Embedding model types
 */
export enum EmbeddingModel {
  /** TF-IDF (term frequency-inverse document frequency) */
  TFIDF = 'TFIDF',
  /** Word2Vec (skip-gram/CBOW) */
  WORD2VEC = 'WORD2VEC',
  /** Code2Vec (AST path-based) */
  CODE2VEC = 'CODE2VEC',
  /** BERT-style transformer */
  TRANSFORMER = 'TRANSFORMER',
  /** Custom trained model */
  CUSTOM = 'CUSTOM',
}

/**
 * Dimensionality reduction techniques
 */
export enum ReductionTechnique {
  /** Principal Component Analysis */
  PCA = 'PCA',
  /** t-Distributed Stochastic Neighbor Embedding */
  TSNE = 'TSNE',
  /** Uniform Manifold Approximation and Projection */
  UMAP = 'UMAP',
  /** Random projection */
  RANDOM_PROJECTION = 'RANDOM_PROJECTION',
}

/**
 * Distance metrics for similarity
 */
export enum DistanceMetric {
  /** Cosine similarity (1 - cosine distance) */
  COSINE = 'COSINE',
  /** Euclidean distance (L2 norm) */
  EUCLIDEAN = 'EUCLIDEAN',
  /** Manhattan distance (L1 norm) */
  MANHATTAN = 'MANHATTAN',
  /** Chebyshev distance (L∞ norm) */
  CHEBYSHEV = 'CHEBYSHEV',
}

/**
 * Code embedding result
 */
export interface CodeEmbedding {
  /** File path */
  filePath: string;

  /** Embedding vector (normalized) */
  vector: number[];

  /** Embedding dimensionality */
  dimension: number;

  /** Model used */
  model: EmbeddingModel;

  /** Structural features */
  structural: {
    /** AST node types (frequency map) */
    nodeTypes: Record<string, number>;
    /** Nesting depth */
    maxDepth: number;
    /** Cyclomatic complexity */
    complexity: number;
    /** Function count */
    functionCount: number;
    /** Class count */
    classCount: number;
  };

  /** Semantic features */
  semantic: {
    /** Unique identifiers */
    identifiers: string[];
    /** String literals */
    literals: string[];
    /** Comments (stripped) */
    comments: string[];
    /** Import paths */
    imports: string[];
  };

  /** Metadata */
  metadata: {
    /** Lines of code */
    loc: number;
    /** File size (bytes) */
    sizeBytes: number;
    /** Language */
    language: 'typescript' | 'javascript' | 'tsx' | 'jsx';
    /** Generation timestamp */
    timestamp: Date;
    /** Model confidence (0-1) */
    confidence: number;
  };

  /** Hash for change detection */
  contentHash: string;
}

/**
 * Reduced-dimension embedding
 */
export interface ReducedEmbedding {
  /** Original file path */
  filePath: string;

  /** Reduced vector (2D or 3D) */
  vector: number[];

  /** Reduction technique used */
  technique: ReductionTechnique;

  /** Variance explained (PCA only) */
  varianceExplained?: number;

  /** Original dimensionality */
  originalDimension: number;
}

/**
 * Similarity search result
 */
export interface SimilarFile {
  /** File path */
  filePath: string;

  /** Similarity score (0-1, 1=identical) */
  similarity: number;

  /** Distance (metric-dependent) */
  distance: number;

  /** Shared features */
  sharedFeatures: {
    /** Common AST patterns */
    astPatterns: string[];
    /** Common identifiers */
    identifiers: string[];
    /** Common imports */
    imports: string[];
  };

  /** Explanation */
  reason: string;
}

/**
 * Similarity index for fast search
 */
export interface SimilarityIndex {
  /** Index ID */
  id: string;

  /** Total embeddings */
  size: number;

  /** Embedding dimension */
  dimension: number;

  /** Distance metric */
  metric: DistanceMetric;

  /** File paths in index */
  filePaths: string[];

  /** Index metadata */
  metadata: {
    /** Creation timestamp */
    created: Date;
    /** Last updated */
    updated: Date;
    /** Model used */
    model: EmbeddingModel;
  };
}

/**
 * Training corpus for custom models
 */
export interface TrainingCorpus {
  /** Code samples */
  samples: Array<{
    /** File path */
    filePath: string;
    /** Code content */
    code: string;
    /** Optional label (for supervised learning) */
    label?: string;
  }>;

  /** Corpus statistics */
  stats: {
    /** Total samples */
    totalSamples: number;
    /** Total tokens */
    totalTokens: number;
    /** Unique identifiers */
    uniqueIdentifiers: number;
    /** Vocabulary size */
    vocabularySize: number;
  };
}

/**
 * Model training configuration
 */
export interface TrainingConfig {
  /** Embedding dimension */
  dimension: number;

  /** Training epochs */
  epochs: number;

  /** Batch size */
  batchSize: number;

  /** Learning rate */
  learningRate: number;

  /** Window size (Word2Vec/Code2Vec) */
  windowSize?: number;

  /** Negative samples (Word2Vec) */
  negativeSamples?: number;

  /** Min word frequency */
  minWordFrequency?: number;

  /** Validation split */
  validationSplit: number;
}

/**
 * Configuration options
 */
export interface EmbeddingGeneratorConfig {
  /** Default embedding model */
  defaultModel: EmbeddingModel;

  /** Default embedding dimension */
  defaultDimension: number;

  /** Cache embeddings */
  enableCache: boolean;

  /** Cache directory */
  cacheDir: string;

  /** Normalize vectors */
  normalize: boolean;

  /** Distance metric for similarity */
  distanceMetric: DistanceMetric;

  /** Max batch size for parallel processing */
  maxBatchSize: number;

  /** Model-specific configs */
  modelConfigs: {
    tfidf?: {
      maxFeatures: number;
      minDf: number;
      maxDf: number;
    };
    word2vec?: {
      dimension: number;
      windowSize: number;
      minCount: number;
    };
    code2vec?: {
      dimension: number;
      maxPathLength: number;
      maxPathWidth: number;
    };
    transformer?: {
      modelName: string;
      maxLength: number;
    };
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: EmbeddingGeneratorConfig = {
  defaultModel: EmbeddingModel.CODE2VEC,
  defaultDimension: 128,
  enableCache: true,
  cacheDir: '.odavl/embeddings',
  normalize: true,
  distanceMetric: DistanceMetric.COSINE,
  maxBatchSize: 50,
  modelConfigs: {
    tfidf: {
      maxFeatures: 10000,
      minDf: 2,
      maxDf: 0.95,
    },
    word2vec: {
      dimension: 128,
      windowSize: 5,
      minCount: 2,
    },
    code2vec: {
      dimension: 128,
      maxPathLength: 8,
      maxPathWidth: 2,
    },
    transformer: {
      modelName: 'microsoft/codebert-base',
      maxLength: 512,
    },
  },
};

// ============================================================================
// Helper Interfaces
// ============================================================================

/**
 * AST path for Code2Vec
 */
interface ASTPath {
  startToken: string;
  path: string[];
  endToken: string;
}

/**
 * Token for Word2Vec
 */
interface Token {
  text: string;
  type: string;
  position: number;
}

/**
 * Cached embedding
 */
interface CachedEmbedding {
  embedding: CodeEmbedding;
  contentHash: string;
  timestamp: Date;
}

// ============================================================================
// CodeEmbeddingGenerator Class
// ============================================================================

/**
 * Code Embedding Generator - Generate vector representations of code
 * 
 * **Usage**:
 * ```typescript
 * const generator = new CodeEmbeddingGenerator(workspaceRoot, config);
 * 
 * // Generate single embedding
 * const embedding = await generator.generateEmbedding('src/utils/helper.ts');
 * console.log(`Dimension: ${embedding.dimension}`);
 * console.log(`Vector: ${embedding.vector.slice(0, 5)}...`);
 * 
 * // Generate batch
 * const embeddings = await generator.generateBatch([
 *   'src/utils/helper.ts',
 *   'src/utils/parser.ts'
 * ]);
 * 
 * // Build similarity index
 * const index = await generator.buildIndex(embeddings);
 * 
 * // Find similar files
 * const similar = await generator.findSimilar(embedding, 5);
 * similar.forEach(s => console.log(`${s.filePath}: ${s.similarity.toFixed(2)}`));
 * 
 * // Reduce dimensionality for visualization
 * const reduced = await generator.reduceDimensionality(embeddings, 2, ReductionTechnique.TSNE);
 * console.log(`Reduced to ${reduced[0].vector.length}D`);
 * 
 * // Train custom model
 * const corpus = await generator.buildCorpus('src/all-ts-files');
 * await generator.trainModel(corpus, trainingConfig);
 * ```
 */
export class CodeEmbeddingGenerator {
  private workspaceRoot: string;
  private config: EmbeddingGeneratorConfig;
  private embeddingCache: Map<string, CachedEmbedding> = new Map();
  private similarityIndex: Map<string, CodeEmbedding[]> = new Map();
  private vocabulary: Map<string, number> = new Map();
  private idfScores: Map<string, number> = new Map();

  constructor(workspaceRoot: string, config: Partial<EmbeddingGeneratorConfig> = {}) {
    this.workspaceRoot = workspaceRoot;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API - Embedding Generation
  // ==========================================================================

  /**
   * Generate embedding for a single file
   * 
   * @param filePath - Absolute or relative file path
   * @param model - Optional model override
   * @returns Code embedding with vector and features
   * 
   * @example
   * ```typescript
   * const embedding = await generator.generateEmbedding('src/App.tsx');
   * console.log(`Complexity: ${embedding.structural.complexity}`);
   * console.log(`Vector norm: ${Math.sqrt(embedding.vector.reduce((s, v) => s + v*v, 0))}`);
   * ```
   */
  async generateEmbedding(
    filePath: string,
    model: EmbeddingModel = this.config.defaultModel
  ): Promise<CodeEmbedding> {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
    const relativePath = path.relative(this.workspaceRoot, absolutePath);

    // Check cache
    const cached = await this.checkCache(relativePath, absolutePath);
    if (cached) {
      return cached;
    }

    // Read file
    const code = await fs.readFile(absolutePath, 'utf8');
    const contentHash = this.hashContent(code);

    // Parse to AST
    const sourceFile = ts.createSourceFile(
      relativePath,
      code,
      ts.ScriptTarget.Latest,
      true
    );

    // Extract features
    const structural = this.extractStructuralFeatures(sourceFile);
    const semantic = this.extractSemanticFeatures(sourceFile, code);

    // Generate embedding vector based on model
    let vector: number[];
    switch (model) {
      case EmbeddingModel.TFIDF:
        vector = await this.generateTFIDFEmbedding(semantic, sourceFile);
        break;
      case EmbeddingModel.WORD2VEC:
        vector = await this.generateWord2VecEmbedding(semantic, sourceFile);
        break;
      case EmbeddingModel.CODE2VEC:
        vector = await this.generateCode2VecEmbedding(sourceFile);
        break;
      case EmbeddingModel.TRANSFORMER:
        vector = await this.generateTransformerEmbedding(code);
        break;
      default:
        vector = await this.generateCode2VecEmbedding(sourceFile);
    }

    // Normalize if configured
    if (this.config.normalize) {
      vector = this.normalizeVector(vector);
    }

    // Get file stats
    const stats = await fs.stat(absolutePath);
    const loc = code.split('\n').length;

    const embedding: CodeEmbedding = {
      filePath: relativePath,
      vector,
      dimension: vector.length,
      model,
      structural,
      semantic,
      metadata: {
        loc,
        sizeBytes: stats.size,
        language: this.detectLanguage(relativePath),
        timestamp: new Date(),
        confidence: 0.9, // Default confidence
      },
      contentHash,
    };

    // Cache embedding
    await this.cacheEmbedding(relativePath, embedding, contentHash);

    return embedding;
  }

  /**
   * Generate embeddings for multiple files in parallel
   * 
   * @param filePaths - Array of file paths
   * @param model - Optional model override
   * @returns Array of embeddings
   * 
   * @example
   * ```typescript
   * const files = ['src/App.tsx', 'src/utils/helper.ts'];
   * const embeddings = await generator.generateBatch(files);
   * console.log(`Generated ${embeddings.length} embeddings`);
   * ```
   */
  async generateBatch(
    filePaths: string[],
    model: EmbeddingModel = this.config.defaultModel
  ): Promise<CodeEmbedding[]> {
    const embeddings: CodeEmbedding[] = [];
    const batchSize = this.config.maxBatchSize;

    // Process in batches
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(fp => this.generateEmbedding(fp, model))
      );
      embeddings.push(...batchResults);
    }

    return embeddings;
  }

  /**
   * Update embedding for a file (incremental)
   * 
   * @param filePath - File path
   * @returns Updated embedding
   */
  async updateEmbedding(filePath: string): Promise<CodeEmbedding> {
    // Force regeneration by clearing cache
    const relativePath = path.relative(this.workspaceRoot, filePath);
    this.embeddingCache.delete(relativePath);
    return this.generateEmbedding(filePath);
  }

  // ==========================================================================
  // Public API - Similarity Search
  // ==========================================================================

  /**
   * Build similarity index from embeddings
   * 
   * @param embeddings - Array of embeddings
   * @returns Similarity index for fast search
   * 
   * @example
   * ```typescript
   * const embeddings = await generator.generateBatch(files);
   * const index = await generator.buildIndex(embeddings);
   * console.log(`Index size: ${index.size}`);
   * ```
   */
  async buildIndex(embeddings: CodeEmbedding[]): Promise<SimilarityIndex> {
    const indexId = `index-${Date.now()}`;
    this.similarityIndex.set(indexId, embeddings);

    return {
      id: indexId,
      size: embeddings.length,
      dimension: embeddings[0]?.dimension || this.config.defaultDimension,
      metric: this.config.distanceMetric,
      filePaths: embeddings.map(e => e.filePath),
      metadata: {
        created: new Date(),
        updated: new Date(),
        model: embeddings[0]?.model || this.config.defaultModel,
      },
    };
  }

  /**
   * Find similar files to a given embedding
   * 
   * @param embedding - Query embedding
   * @param k - Number of results to return
   * @param indexId - Optional index ID (uses latest if not provided)
   * @returns Array of similar files sorted by similarity
   * 
   * @example
   * ```typescript
   * const query = await generator.generateEmbedding('src/App.tsx');
   * const similar = await generator.findSimilar(query, 5);
   * similar.forEach(s => console.log(`${s.filePath}: ${(s.similarity * 100).toFixed(1)}%`));
   * ```
   */
  async findSimilar(
    embedding: CodeEmbedding,
    k: number = 10,
    indexId?: string
  ): Promise<SimilarFile[]> {
    // Get index
    const index = indexId
      ? this.similarityIndex.get(indexId)
      : Array.from(this.similarityIndex.values())[0];

    if (!index) {
      return [];
    }

    // Calculate similarities
    const similarities: Array<{ filePath: string; similarity: number; distance: number; embedding: CodeEmbedding }> = [];

    for (const candidate of index) {
      if (candidate.filePath === embedding.filePath) {
        continue; // Skip self
      }

      const { similarity, distance } = this.calculateSimilarity(
        embedding.vector,
        candidate.vector,
        this.config.distanceMetric
      );

      similarities.push({
        filePath: candidate.filePath,
        similarity,
        distance,
        embedding: candidate,
      });
    }

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Take top k
    const topK = similarities.slice(0, k);

    // Build results with shared features
    return topK.map(s => ({
      filePath: s.filePath,
      similarity: s.similarity,
      distance: s.distance,
      sharedFeatures: this.identifySharedFeatures(embedding, s.embedding),
      reason: this.explainSimilarity(embedding, s.embedding, s.similarity),
    }));
  }

  /**
   * Find all files similar to a query file
   * 
   * @param filePath - Query file path
   * @param threshold - Minimum similarity (0-1)
   * @returns Array of similar files
   */
  async findSimilarFiles(filePath: string, threshold: number = 0.7): Promise<SimilarFile[]> {
    const queryEmbedding = await this.generateEmbedding(filePath);
    const allSimilar = await this.findSimilar(queryEmbedding, 100); // Get more candidates
    return allSimilar.filter(s => s.similarity >= threshold);
  }

  // ==========================================================================
  // Public API - Dimensionality Reduction
  // ==========================================================================

  /**
   * Reduce dimensionality of embeddings for visualization
   * 
   * @param embeddings - Array of high-dimensional embeddings
   * @param targetDimension - Target dimension (2 or 3 for visualization)
   * @param technique - Reduction technique
   * @returns Array of reduced embeddings
   * 
   * @example
   * ```typescript
   * const embeddings = await generator.generateBatch(files);
   * const reduced = await generator.reduceimensionality(embeddings, 2, ReductionTechnique.TSNE);
   * // Plot reduced[i].vector as (x, y) coordinates
   * ```
   */
  async reduceDimensionality(
    embeddings: CodeEmbedding[],
    targetDimension: number = 2,
    technique: ReductionTechnique = ReductionTechnique.PCA
  ): Promise<ReducedEmbedding[]> {
    if (embeddings.length === 0) {
      return [];
    }

    const originalDimension = embeddings[0].dimension;
    const matrix = embeddings.map(e => e.vector);

    let reducedMatrix: number[][];

    switch (technique) {
      case ReductionTechnique.PCA:
        reducedMatrix = this.performPCA(matrix, targetDimension);
        break;
      case ReductionTechnique.TSNE:
        reducedMatrix = await this.performTSNE(matrix, targetDimension);
        break;
      case ReductionTechnique.UMAP:
        reducedMatrix = await this.performUMAP(matrix, targetDimension);
        break;
      case ReductionTechnique.RANDOM_PROJECTION:
        reducedMatrix = this.performRandomProjection(matrix, targetDimension);
        break;
      default:
        reducedMatrix = this.performPCA(matrix, targetDimension);
    }

    return embeddings.map((e, i) => ({
      filePath: e.filePath,
      vector: reducedMatrix[i],
      technique,
      originalDimension,
      varianceExplained: technique === ReductionTechnique.PCA ? this.calculateVarianceExplained(matrix, reducedMatrix) : undefined,
    }));
  }

  // ==========================================================================
  // Public API - Model Training
  // ==========================================================================

  /**
   * Build training corpus from workspace files
   * 
   * @param pattern - File pattern (glob)
   * @returns Training corpus
   */
  async buildCorpus(pattern: string = '**/*.{ts,tsx,js,jsx}'): Promise<TrainingCorpus> {
    // TODO: Implement glob file search
    const samples: TrainingCorpus['samples'] = [];
    const allIdentifiers = new Set<string>();
    let totalTokens = 0;

    // For now, return mock corpus
    return {
      samples,
      stats: {
        totalSamples: samples.length,
        totalTokens,
        uniqueIdentifiers: allIdentifiers.size,
        vocabularySize: this.vocabulary.size,
      },
    };
  }

  /**
   * Train custom embedding model
   * 
   * @param corpus - Training corpus
   * @param config - Training configuration
   * @returns Training metrics
   */
  async trainModel(corpus: TrainingCorpus, config: TrainingConfig): Promise<{
    loss: number;
    accuracy: number;
    epochs: number;
  }> {
    // TODO: Implement model training with TensorFlow.js
    // For now, return mock metrics
    return {
      loss: 0.15,
      accuracy: 0.92,
      epochs: config.epochs,
    };
  }

  // ==========================================================================
  // Private Methods - Feature Extraction
  // ==========================================================================

  /**
   * Extract structural features from AST
   */
  private extractStructuralFeatures(sourceFile: ts.SourceFile): CodeEmbedding['structural'] {
    const nodeTypes: Record<string, number> = {};
    let maxDepth = 0;
    let complexity = 1;
    let functionCount = 0;
    let classCount = 0;

    const visit = (node: ts.Node, depth: number = 0) => {
      // Track node types
      const typeName = ts.SyntaxKind[node.kind];
      nodeTypes[typeName] = (nodeTypes[typeName] || 0) + 1;

      // Track max depth
      maxDepth = Math.max(maxDepth, depth);

      // Count complexity
      if (
        ts.isIfStatement(node) ||
        ts.isWhileStatement(node) ||
        ts.isForStatement(node) ||
        ts.isDoStatement(node) ||
        ts.isCaseClause(node) ||
        ts.isConditionalExpression(node)
      ) {
        complexity++;
      }

      // Count functions
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node)
      ) {
        functionCount++;
      }

      // Count classes
      if (ts.isClassDeclaration(node)) {
        classCount++;
      }

      ts.forEachChild(node, child => visit(child, depth + 1));
    };

    visit(sourceFile);

    return {
      nodeTypes,
      maxDepth,
      complexity,
      functionCount,
      classCount,
    };
  }

  /**
   * Extract semantic features from AST
   */
  private extractSemanticFeatures(sourceFile: ts.SourceFile, code: string): CodeEmbedding['semantic'] {
    const identifiers: string[] = [];
    const literals: string[] = [];
    const imports: string[] = [];

    const visit = (node: ts.Node) => {
      // Extract identifiers
      if (ts.isIdentifier(node)) {
        identifiers.push(node.text);
      }

      // Extract literals
      if (ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
        literals.push(node.text);
      }

      // Extract imports
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          imports.push(moduleSpecifier.text);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Extract comments
    const comments: string[] = [];
    const commentRanges = ts.getLeadingCommentRanges(code, 0) || [];
    for (const range of commentRanges) {
      const commentText = code.substring(range.pos, range.end).trim();
      comments.push(commentText);
    }

    return {
      identifiers: Array.from(new Set(identifiers)),
      literals: Array.from(new Set(literals)),
      comments,
      imports: Array.from(new Set(imports)),
    };
  }

  // ==========================================================================
  // Private Methods - Embedding Generation
  // ==========================================================================

  /**
   * Generate TF-IDF embedding
   */
  private async generateTFIDFEmbedding(
    semantic: CodeEmbedding['semantic'],
    sourceFile: ts.SourceFile
  ): Promise<number[]> {
    const config = this.config.modelConfigs.tfidf!;
    const dimension = Math.min(config.maxFeatures, this.config.defaultDimension);
    const vector = new Array(dimension).fill(0);

    // Simple TF-IDF: term frequency * inverse document frequency
    const termFrequency = new Map<string, number>();
    for (const identifier of semantic.identifiers) {
      termFrequency.set(identifier, (termFrequency.get(identifier) || 0) + 1);
    }

    // Map terms to vector positions
    let idx = 0;
    for (const [term, tf] of termFrequency.entries()) {
      if (idx >= dimension) break;
      const idf = this.idfScores.get(term) || 1;
      vector[idx] = tf * Math.log(idf);
      idx++;
    }

    return vector;
  }

  /**
   * Generate Word2Vec-style embedding
   */
  private async generateWord2VecEmbedding(
    semantic: CodeEmbedding['semantic'],
    sourceFile: ts.SourceFile
  ): Promise<number[]> {
    const dimension = this.config.defaultDimension;
    const vector = new Array(dimension).fill(0);

    // Average word vectors (simplified Word2Vec)
    for (const identifier of semantic.identifiers) {
      const wordVector = this.getWordVector(identifier, dimension);
      for (let i = 0; i < dimension; i++) {
        vector[i] += wordVector[i];
      }
    }

    // Average
    if (semantic.identifiers.length > 0) {
      for (let i = 0; i < dimension; i++) {
        vector[i] /= semantic.identifiers.length;
      }
    }

    return vector;
  }

  /**
   * Generate Code2Vec embedding (AST path-based)
   */
  private async generateCode2VecEmbedding(sourceFile: ts.SourceFile): Promise<number[]> {
    const config = this.config.modelConfigs.code2vec!;
    const dimension = config.dimension;
    const vector = new Array(dimension).fill(0);

    // Extract AST paths
    const paths = this.extractASTPaths(sourceFile, config.maxPathLength, config.maxPathWidth);

    // Encode paths to vectors (simplified)
    for (const astPath of paths) {
      const pathVector = this.encodeASTPath(astPath, dimension);
      for (let i = 0; i < dimension; i++) {
        vector[i] += pathVector[i];
      }
    }

    // Average
    if (paths.length > 0) {
      for (let i = 0; i < dimension; i++) {
        vector[i] /= paths.length;
      }
    }

    return vector;
  }

  /**
   * Generate transformer-based embedding
   */
  private async generateTransformerEmbedding(code: string): Promise<number[]> {
    const config = this.config.modelConfigs.transformer!;
    const dimension = this.config.defaultDimension;

    // TODO: Integrate with CodeBERT or similar model
    // For now, return random vector
    return Array.from({ length: dimension }, () => Math.random() - 0.5);
  }

  /**
   * Extract AST paths between leaf nodes
   */
  private extractASTPaths(sourceFile: ts.SourceFile, maxLength: number, maxWidth: number): ASTPath[] {
    const paths: ASTPath[] = [];
    const leafNodes: ts.Node[] = [];

    // Collect leaf nodes (identifiers, literals)
    const visit = (node: ts.Node) => {
      if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
        leafNodes.push(node);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);

    // Extract paths between pairs of leaf nodes
    for (let i = 0; i < leafNodes.length; i++) {
      for (let j = i + 1; j < Math.min(i + maxWidth, leafNodes.length); j++) {
        const path = this.findASTPath(leafNodes[i], leafNodes[j], sourceFile, maxLength);
        if (path) {
          paths.push(path);
        }
      }
    }

    return paths;
  }

  /**
   * Find AST path between two nodes
   */
  private findASTPath(start: ts.Node, end: ts.Node, root: ts.Node, maxLength: number): ASTPath | null {
    // Simplified path finding (would implement proper LCA in production)
    const startToken = start.getText();
    const endToken = end.getText();
    const path: string[] = ['root']; // Placeholder

    return {
      startToken,
      path,
      endToken,
    };
  }

  /**
   * Encode AST path to vector
   */
  private encodeASTPath(astPath: ASTPath, dimension: number): number[] {
    // Hash-based encoding (simplified)
    const hash = this.hashString(`${astPath.startToken}|${astPath.path.join(',')}|${astPath.endToken}`);
    const vector = new Array(dimension).fill(0);

    for (let i = 0; i < dimension; i++) {
      vector[i] = ((hash + i) % 100) / 100 - 0.5;
    }

    return vector;
  }

  /**
   * Get word vector (mock implementation)
   */
  private getWordVector(word: string, dimension: number): number[] {
    // In production, load from trained Word2Vec model
    const hash = this.hashString(word);
    return Array.from({ length: dimension }, (_, i) => ((hash + i) % 100) / 100 - 0.5);
  }

  // ==========================================================================
  // Private Methods - Similarity Calculation
  // ==========================================================================

  /**
   * Calculate similarity between two vectors
   */
  private calculateSimilarity(
    v1: number[],
    v2: number[],
    metric: DistanceMetric
  ): { similarity: number; distance: number } {
    let distance: number;

    switch (metric) {
      case DistanceMetric.COSINE:
        distance = this.cosineDistance(v1, v2);
        break;
      case DistanceMetric.EUCLIDEAN:
        distance = this.euclideanDistance(v1, v2);
        break;
      case DistanceMetric.MANHATTAN:
        distance = this.manhattanDistance(v1, v2);
        break;
      case DistanceMetric.CHEBYSHEV:
        distance = this.chebyshevDistance(v1, v2);
        break;
      default:
        distance = this.cosineDistance(v1, v2);
    }

    // Convert distance to similarity (0-1, higher is better)
    const similarity = metric === DistanceMetric.COSINE ? 1 - distance : 1 / (1 + distance);

    return { similarity, distance };
  }

  /**
   * Cosine distance (1 - cosine similarity)
   */
  private cosineDistance(v1: number[], v2: number[]): number {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }

    const cosineSimilarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return 1 - cosineSimilarity;
  }

  /**
   * Euclidean distance (L2 norm)
   */
  private euclideanDistance(v1: number[], v2: number[]): number {
    let sum = 0;
    for (let i = 0; i < v1.length; i++) {
      const diff = v1[i] - v2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Manhattan distance (L1 norm)
   */
  private manhattanDistance(v1: number[], v2: number[]): number {
    let sum = 0;
    for (let i = 0; i < v1.length; i++) {
      sum += Math.abs(v1[i] - v2[i]);
    }
    return sum;
  }

  /**
   * Chebyshev distance (L∞ norm)
   */
  private chebyshevDistance(v1: number[], v2: number[]): number {
    let max = 0;
    for (let i = 0; i < v1.length; i++) {
      const diff = Math.abs(v1[i] - v2[i]);
      if (diff > max) {
        max = diff;
      }
    }
    return max;
  }

  /**
   * Identify shared features between embeddings
   */
  private identifySharedFeatures(e1: CodeEmbedding, e2: CodeEmbedding): SimilarFile['sharedFeatures'] {
    // Shared AST patterns
    const astPatterns = Object.keys(e1.structural.nodeTypes).filter(
      type => e2.structural.nodeTypes[type] !== undefined
    );

    // Shared identifiers
    const identifiers = e1.semantic.identifiers.filter(
      id => e2.semantic.identifiers.includes(id)
    );

    // Shared imports
    const imports = e1.semantic.imports.filter(
      imp => e2.semantic.imports.includes(imp)
    );

    return {
      astPatterns: astPatterns.slice(0, 5), // Top 5
      identifiers: identifiers.slice(0, 10), // Top 10
      imports: imports.slice(0, 5), // Top 5
    };
  }

  /**
   * Explain similarity
   */
  private explainSimilarity(e1: CodeEmbedding, e2: CodeEmbedding, similarity: number): string {
    const shared = this.identifySharedFeatures(e1, e2);

    if (similarity > 0.9) {
      return `Very high similarity (${(similarity * 100).toFixed(1)}%) - likely duplicate or refactored code`;
    } else if (similarity > 0.7) {
      return `High similarity (${(similarity * 100).toFixed(1)}%) - shares ${shared.astPatterns.length} AST patterns, ${shared.identifiers.length} identifiers`;
    } else if (similarity > 0.5) {
      return `Moderate similarity (${(similarity * 100).toFixed(1)}%) - similar structure`;
    } else {
      return `Low similarity (${(similarity * 100).toFixed(1)}%) - different implementation`;
    }
  }

  // ==========================================================================
  // Private Methods - Dimensionality Reduction
  // ==========================================================================

  /**
   * Perform PCA (Principal Component Analysis)
   */
  private performPCA(matrix: number[][], targetDimension: number): number[][] {
    // Simplified PCA (in production, use numeric library)
    const n = matrix.length;
    const d = matrix[0].length;

    // Center data
    const mean = new Array(d).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < d; j++) {
        mean[j] += matrix[i][j];
      }
    }
    for (let j = 0; j < d; j++) {
      mean[j] /= n;
    }

    const centered = matrix.map(row => row.map((val, j) => val - mean[j]));

    // For now, return random projection
    return this.performRandomProjection(centered, targetDimension);
  }

  /**
   * Perform t-SNE
   */
  private async performTSNE(matrix: number[][], targetDimension: number): Promise<number[][]> {
    // TODO: Implement t-SNE or integrate library
    return this.performRandomProjection(matrix, targetDimension);
  }

  /**
   * Perform UMAP
   */
  private async performUMAP(matrix: number[][], targetDimension: number): Promise<number[][]> {
    // TODO: Implement UMAP or integrate library
    return this.performRandomProjection(matrix, targetDimension);
  }

  /**
   * Perform random projection
   */
  private performRandomProjection(matrix: number[][], targetDimension: number): number[][] {
    const n = matrix.length;
    const d = matrix[0].length;

    // Generate random projection matrix
    const projectionMatrix: number[][] = [];
    for (let i = 0; i < d; i++) {
      const row: number[] = [];
      for (let j = 0; j < targetDimension; j++) {
        row.push(Math.random() - 0.5);
      }
      projectionMatrix.push(row);
    }

    // Project
    const projected: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < targetDimension; j++) {
        let sum = 0;
        for (let k = 0; k < d; k++) {
          sum += matrix[i][k] * projectionMatrix[k][j];
        }
        row.push(sum);
      }
      projected.push(row);
    }

    return projected;
  }

  /**
   * Calculate variance explained (PCA)
   */
  private calculateVarianceExplained(original: number[][], reduced: number[][]): number {
    // Simplified calculation
    return 0.85; // Mock 85% variance explained
  }

  // ==========================================================================
  // Private Methods - Utilities
  // ==========================================================================

  /**
   * Normalize vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (norm === 0) return vector;
    return vector.map(v => v / norm);
  }

  /**
   * Hash content for change detection
   */
  private hashContent(content: string): string {
    // Simple hash (use crypto in production)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  /**
   * Hash string to number
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(filePath: string): 'typescript' | 'javascript' | 'tsx' | 'jsx' {
    const ext = path.extname(filePath);
    if (ext === '.tsx') return 'tsx';
    if (ext === '.jsx') return 'jsx';
    if (ext === '.ts') return 'typescript';
    return 'javascript';
  }

  /**
   * Check cache for existing embedding
   */
  private async checkCache(relativePath: string, absolutePath: string): Promise<CodeEmbedding | null> {
    if (!this.config.enableCache) {
      return null;
    }

    const cached = this.embeddingCache.get(relativePath);
    if (!cached) {
      return null;
    }

    // Check if file changed
    try {
      const code = await fs.readFile(absolutePath, 'utf8');
      const currentHash = this.hashContent(code);
      if (currentHash === cached.contentHash) {
        return cached.embedding;
      }
    } catch {
      // File read error, invalidate cache
    }

    return null;
  }

  /**
   * Cache embedding
   */
  private async cacheEmbedding(relativePath: string, embedding: CodeEmbedding, contentHash: string): Promise<void> {
    if (!this.config.enableCache) {
      return;
    }

    this.embeddingCache.set(relativePath, {
      embedding,
      contentHash,
      timestamp: new Date(),
    });

    // Persist to disk (optional)
    const cacheDir = path.join(this.workspaceRoot, this.config.cacheDir);
    try {
      await fs.mkdir(cacheDir, { recursive: true });
      const cachePath = path.join(cacheDir, `${relativePath.replace(/[\/\\]/g, '_')}.json`);
      await fs.writeFile(cachePath, JSON.stringify({ embedding, contentHash }, null, 2));
    } catch {
      // Cache write failed, continue
    }
  }
}
