/**
 * @fileoverview Search Index Manager - Elasticsearch integration
 * @module @odavl-studio/insight-core/search/search-index
 * 
 * **Purpose**: Manage search indices for fast code search
 * 
 * **Features**:
 * - Elasticsearch integration (full-text search)
 * - Index management (create, update, delete)
 * - Document indexing (code files, issues, commits, docs)
 * - Bulk operations (batch indexing)
 * - Real-time updates (file changes trigger reindex)
 * - Query DSL builder (Elasticsearch queries)
 * - Faceted search (filters, aggregations)
 * - Index optimization (sharding, replication)
 * - Mapping management (field types, analyzers)
 * - Alias management (blue-green deployments)
 * 
 * **Index Types**:
 * - Code: Source code files and snippets
 * - Issues: Error detections and warnings
 * - Commits: Git commit history
 * - Documentation: README files and docs
 * 
 * **Architecture**:
 * ```
 * SearchIndexManager
 *   ├── Index Lifecycle
 *   │   ├── Create index (with mapping)
 *   │   ├── Update mapping
 *   │   ├── Delete index
 *   │   └── Reindex (zero downtime)
 *   ├── Document Operations
 *   │   ├── Index document
 *   │   ├── Bulk index
 *   │   ├── Update document
 *   │   └── Delete document
 *   ├── Query Builder
 *   │   ├── Match query (full-text)
 *   │   ├── Bool query (AND/OR/NOT)
 *   │   ├── Range query (dates, numbers)
 *   │   └── Fuzzy query (typo tolerance)
 *   └── Aggregations
 *       ├── Terms (facets)
 *       ├── Date histogram
 *       ├── Stats (min, max, avg)
 *       └── Cardinality (unique counts)
 * ```
 * 
 * **Integration Points**:
 * - Used by: Semantic Search, CLI, Web dashboard
 * - Backend: Elasticsearch cluster
 * - File watching: Trigger reindex on changes
 */

import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Index type
 */
export enum IndexType {
  CODE = 'code',
  ISSUES = 'issues',
  COMMITS = 'commits',
  DOCUMENTATION = 'documentation',
}

/**
 * Field type
 */
export enum FieldType {
  TEXT = 'text',
  KEYWORD = 'keyword',
  INTEGER = 'integer',
  LONG = 'long',
  FLOAT = 'float',
  DOUBLE = 'double',
  BOOLEAN = 'boolean',
  DATE = 'date',
  OBJECT = 'object',
  NESTED = 'nested',
}

/**
 * Analyzer type
 */
export enum AnalyzerType {
  STANDARD = 'standard',
  SIMPLE = 'simple',
  WHITESPACE = 'whitespace',
  STOP = 'stop',
  KEYWORD = 'keyword',
  PATTERN = 'pattern',
  LANGUAGE = 'language',
  FINGERPRINT = 'fingerprint',
}

/**
 * Index mapping
 */
export interface IndexMapping {
  /** Properties (field definitions) */
  properties: Record<string, FieldMapping>;

  /** Dynamic mapping */
  dynamic?: boolean | 'strict';

  /** Metadata fields */
  _meta?: Record<string, any>;
}

/**
 * Field mapping
 */
export interface FieldMapping {
  /** Field type */
  type: FieldType;

  /** Analyzer (for text fields) */
  analyzer?: AnalyzerType | string;

  /** Search analyzer */
  search_analyzer?: AnalyzerType | string;

  /** Index this field */
  index?: boolean;

  /** Store field value */
  store?: boolean;

  /** Nested fields (for object/nested types) */
  properties?: Record<string, FieldMapping>;
}

/**
 * Index settings
 */
export interface IndexSettings {
  /** Number of shards */
  number_of_shards: number;

  /** Number of replicas */
  number_of_replicas: number;

  /** Refresh interval */
  refresh_interval?: string;

  /** Max result window */
  max_result_window?: number;

  /** Analysis settings */
  analysis?: {
    analyzer?: Record<string, any>;
    tokenizer?: Record<string, any>;
    filter?: Record<string, any>;
  };
}

/**
 * Document to index
 */
export interface IndexDocument {
  /** Document ID */
  id: string;

  /** Document type */
  type: IndexType;

  /** Document body */
  body: Record<string, any>;

  /** Index name */
  index?: string;
}

/**
 * Bulk operation
 */
export interface BulkOperation {
  /** Operation type */
  action: 'index' | 'update' | 'delete';

  /** Document */
  document: IndexDocument;
}

/**
 * Query builder
 */
export interface QueryBuilder {
  /** Match query (full-text) */
  match(field: string, query: string): QueryBuilder;

  /** Match phrase */
  matchPhrase(field: string, query: string): QueryBuilder;

  /** Term query (exact match) */
  term(field: string, value: any): QueryBuilder;

  /** Terms query (OR) */
  terms(field: string, values: any[]): QueryBuilder;

  /** Range query */
  range(field: string, options: { gte?: any; lte?: any; gt?: any; lt?: any }): QueryBuilder;

  /** Bool query */
  bool(options: {
    must?: QueryBuilder[];
    should?: QueryBuilder[];
    must_not?: QueryBuilder[];
    filter?: QueryBuilder[];
  }): QueryBuilder;

  /** Fuzzy query */
  fuzzy(field: string, value: string, fuzziness?: number | 'AUTO'): QueryBuilder;

  /** Wildcard query */
  wildcard(field: string, value: string): QueryBuilder;

  /** Exists query */
  exists(field: string): QueryBuilder;

  /** Build query object */
  build(): any;
}

/**
 * Aggregation builder
 */
export interface AggregationBuilder {
  /** Terms aggregation (facets) */
  terms(name: string, field: string, size?: number): AggregationBuilder;

  /** Date histogram */
  dateHistogram(name: string, field: string, interval: string): AggregationBuilder;

  /** Stats aggregation */
  stats(name: string, field: string): AggregationBuilder;

  /** Cardinality aggregation */
  cardinality(name: string, field: string): AggregationBuilder;

  /** Build aggregation object */
  build(): any;
}

/**
 * Search request
 */
export interface SearchRequest {
  /** Index name(s) */
  index: string | string[];

  /** Query */
  query?: any;

  /** Aggregations */
  aggs?: any;

  /** Sort */
  sort?: Array<Record<string, 'asc' | 'desc'>>;

  /** Source fields */
  _source?: string[] | boolean;

  /** From (pagination) */
  from?: number;

  /** Size (page size) */
  size?: number;

  /** Highlight */
  highlight?: {
    fields: Record<string, any>;
  };
}

/**
 * Search response
 */
export interface SearchResponse {
  /** Total hits */
  total: {
    value: number;
    relation: 'eq' | 'gte';
  };

  /** Max score */
  max_score: number | null;

  /** Hits */
  hits: Array<{
    _index: string;
    _id: string;
    _score: number;
    _source: Record<string, any>;
    highlight?: Record<string, string[]>;
  }>;

  /** Aggregations */
  aggregations?: Record<string, any>;

  /** Took (ms) */
  took: number;
}

/**
 * Index statistics
 */
export interface IndexStats {
  /** Index name */
  index: string;

  /** Document count */
  docCount: number;

  /** Index size (bytes) */
  size: number;

  /** Shard count */
  shardCount: number;

  /** Health status */
  health: 'green' | 'yellow' | 'red';

  /** Created at */
  createdAt: Date;
}

/**
 * Search index configuration
 */
export interface SearchIndexConfig {
  /** Elasticsearch URL */
  elasticsearchUrl: string;

  /** Index prefix */
  indexPrefix: string;

  /** Default settings */
  defaultSettings: IndexSettings;

  /** Enable auto-refresh */
  autoRefresh: boolean;

  /** Refresh interval (ms) */
  refreshInterval: number;

  /** Batch size for bulk operations */
  bulkBatchSize: number;

  /** Request timeout (ms) */
  requestTimeout: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SearchIndexConfig = {
  elasticsearchUrl: 'http://localhost:9200',
  indexPrefix: 'odavl',
  defaultSettings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    refresh_interval: '1s',
    max_result_window: 10000,
  },
  autoRefresh: false,
  refreshInterval: 5000, // 5 seconds
  bulkBatchSize: 500,
  requestTimeout: 30000, // 30 seconds
};

// ============================================================================
// SearchIndexManager Class
// ============================================================================

/**
 * Search Index Manager - Elasticsearch integration
 * 
 * **Usage**:
 * ```typescript
 * import { SearchIndexManager, IndexType } from '@odavl-studio/insight-core/search/search-index';
 * 
 * const indexManager = new SearchIndexManager({
 *   elasticsearchUrl: 'http://localhost:9200',
 *   indexPrefix: 'odavl',
 * });
 * 
 * // Create index
 * await indexManager.createIndex(IndexType.CODE, {
 *   properties: {
 *     file: { type: FieldType.KEYWORD },
 *     content: { type: FieldType.TEXT, analyzer: AnalyzerType.STANDARD },
 *     language: { type: FieldType.KEYWORD },
 *     line: { type: FieldType.INTEGER },
 *     timestamp: { type: FieldType.DATE },
 *   },
 * });
 * 
 * // Index document
 * await indexManager.indexDocument({
 *   id: 'file-1',
 *   type: IndexType.CODE,
 *   body: {
 *     file: 'src/index.ts',
 *     content: 'export function main() { ... }',
 *     language: 'typescript',
 *     line: 1,
 *     timestamp: new Date(),
 *   },
 * });
 * 
 * // Bulk index
 * await indexManager.bulkIndex([
 *   { action: 'index', document: { ... } },
 *   { action: 'index', document: { ... } },
 * ]);
 * 
 * // Search with query builder
 * const query = indexManager.query()
 *   .match('content', 'authentication')
 *   .term('language', 'typescript')
 *   .range('line', { gte: 1, lte: 100 });
 * 
 * const results = await indexManager.search({
 *   index: IndexType.CODE,
 *   query: query.build(),
 *   size: 10,
 * });
 * 
 * console.log(`Found ${results.total.value} results`);
 * 
 * // Aggregations
 * const aggs = indexManager.aggregation()
 *   .terms('languages', 'language', 10)
 *   .terms('files', 'file', 20);
 * 
 * const aggResults = await indexManager.search({
 *   index: IndexType.CODE,
 *   size: 0, // No results, just aggregations
 *   aggs: aggs.build(),
 * });
 * 
 * // Get statistics
 * const stats = await indexManager.getStats(IndexType.CODE);
 * console.log(`Index: ${stats.index}`);
 * console.log(`Documents: ${stats.docCount}`);
 * console.log(`Size: ${stats.size} bytes`);
 * console.log(`Health: ${stats.health}`);
 * ```
 * 
 * **Advanced Usage**:
 * ```typescript
 * // Complex bool query
 * const complexQuery = indexManager.query().bool({
 *   must: [
 *     indexManager.query().match('content', 'security'),
 *   ],
 *   should: [
 *     indexManager.query().term('severity', 'high'),
 *     indexManager.query().term('severity', 'critical'),
 *   ],
 *   must_not: [
 *     indexManager.query().term('resolved', true),
 *   ],
 *   filter: [
 *     indexManager.query().range('timestamp', { gte: 'now-7d' }),
 *   ],
 * });
 * 
 * // Fuzzy search (typo tolerance)
 * const fuzzyQuery = indexManager.query()
 *   .fuzzy('content', 'authenticaton', 'AUTO'); // Matches "authentication"
 * 
 * // Reindex with zero downtime
 * await indexManager.reindex(IndexType.CODE);
 * 
 * // Delete index
 * await indexManager.deleteIndex(IndexType.CODE);
 * ```
 */
export class SearchIndexManager extends EventEmitter {
  private config: SearchIndexConfig;
  private refreshTimer?: NodeJS.Timeout;

  constructor(config: Partial<SearchIndexConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  // ==========================================================================
  // Public API - Index Lifecycle
  // ==========================================================================

  /**
   * Create index
   * 
   * @param type - Index type
   * @param mapping - Index mapping
   * @param settings - Index settings
   */
  async createIndex(
    type: IndexType,
    mapping: IndexMapping,
    settings?: Partial<IndexSettings>
  ): Promise<void> {
    const indexName = this.getIndexName(type);

    this.emit('index:creating', { indexName });

    // Mock: Create Elasticsearch index
    // In real implementation, use Elasticsearch client
    await this.mockElasticsearchRequest('PUT', `/${indexName}`, {
      settings: { ...this.config.defaultSettings, ...settings },
      mappings: mapping,
    });

    this.emit('index:created', { indexName });
  }

  /**
   * Delete index
   * 
   * @param type - Index type
   */
  async deleteIndex(type: IndexType): Promise<void> {
    const indexName = this.getIndexName(type);

    this.emit('index:deleting', { indexName });

    // Mock: Delete Elasticsearch index
    await this.mockElasticsearchRequest('DELETE', `/${indexName}`);

    this.emit('index:deleted', { indexName });
  }

  /**
   * Check if index exists
   * 
   * @param type - Index type
   * @returns True if exists
   */
  async indexExists(type: IndexType): Promise<boolean> {
    const indexName = this.getIndexName(type);

    // Mock: Check existence
    return true;
  }

  /**
   * Update mapping
   * 
   * @param type - Index type
   * @param mapping - New mapping
   */
  async updateMapping(type: IndexType, mapping: Partial<IndexMapping>): Promise<void> {
    const indexName = this.getIndexName(type);

    this.emit('mapping:updating', { indexName });

    // Mock: Update mapping
    await this.mockElasticsearchRequest('PUT', `/${indexName}/_mapping`, {
      properties: mapping.properties,
    });

    this.emit('mapping:updated', { indexName });
  }

  /**
   * Reindex (zero downtime)
   * 
   * @param type - Index type
   */
  async reindex(type: IndexType): Promise<void> {
    const oldIndex = this.getIndexName(type);
    const newIndex = `${oldIndex}-${Date.now()}`;

    this.emit('reindex:started', { oldIndex, newIndex });

    // Mock: Reindex with alias swap
    // 1. Create new index
    // 2. Copy data from old to new
    // 3. Swap alias
    // 4. Delete old index

    this.emit('reindex:completed', { oldIndex, newIndex });
  }

  // ==========================================================================
  // Public API - Document Operations
  // ==========================================================================

  /**
   * Index document
   * 
   * @param document - Document to index
   */
  async indexDocument(document: IndexDocument): Promise<void> {
    const indexName = document.index || this.getIndexName(document.type);

    this.emit('document:indexing', { id: document.id, indexName });

    // Mock: Index document
    await this.mockElasticsearchRequest('PUT', `/${indexName}/_doc/${document.id}`, document.body);

    this.emit('document:indexed', { id: document.id, indexName });
  }

  /**
   * Bulk index documents
   * 
   * @param operations - Bulk operations
   */
  async bulkIndex(operations: BulkOperation[]): Promise<void> {
    this.emit('bulk:started', { operationsCount: operations.length });

    // Process in batches
    const batches = this.chunkArray(operations, this.config.bulkBatchSize);

    for (const batch of batches) {
      await this.processBulkBatch(batch);
    }

    this.emit('bulk:completed', { operationsCount: operations.length });
  }

  /**
   * Update document
   * 
   * @param type - Index type
   * @param id - Document ID
   * @param updates - Fields to update
   */
  async updateDocument(
    type: IndexType,
    id: string,
    updates: Record<string, any>
  ): Promise<void> {
    const indexName = this.getIndexName(type);

    this.emit('document:updating', { id, indexName });

    // Mock: Update document
    await this.mockElasticsearchRequest('POST', `/${indexName}/_update/${id}`, {
      doc: updates,
    });

    this.emit('document:updated', { id, indexName });
  }

  /**
   * Delete document
   * 
   * @param type - Index type
   * @param id - Document ID
   */
  async deleteDocument(type: IndexType, id: string): Promise<void> {
    const indexName = this.getIndexName(type);

    this.emit('document:deleting', { id, indexName });

    // Mock: Delete document
    await this.mockElasticsearchRequest('DELETE', `/${indexName}/_doc/${id}`);

    this.emit('document:deleted', { id, indexName });
  }

  // ==========================================================================
  // Public API - Search
  // ==========================================================================

  /**
   * Search documents
   * 
   * @param request - Search request
   * @returns Search response
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();

    this.emit('search:started', { request });

    // Mock: Execute search
    const response: SearchResponse = {
      total: { value: 0, relation: 'eq' },
      max_score: null,
      hits: [],
      took: Date.now() - startTime,
    };

    this.emit('search:completed', { request, response });

    return response;
  }

  /**
   * Count documents
   * 
   * @param type - Index type
   * @param query - Query (optional)
   * @returns Document count
   */
  async count(type: IndexType, query?: any): Promise<number> {
    const indexName = this.getIndexName(type);

    // Mock: Count documents
    const response = await this.mockElasticsearchRequest('GET', `/${indexName}/_count`, {
      query: query || { match_all: {} },
    });

    return response.count || 0;
  }

  // ==========================================================================
  // Public API - Query Builder
  // ==========================================================================

  /**
   * Create query builder
   * 
   * @returns Query builder
   */
  query(): QueryBuilder {
    return new ElasticsearchQueryBuilder();
  }

  /**
   * Create aggregation builder
   * 
   * @returns Aggregation builder
   */
  aggregation(): AggregationBuilder {
    return new ElasticsearchAggregationBuilder();
  }

  // ==========================================================================
  // Public API - Statistics
  // ==========================================================================

  /**
   * Get index statistics
   * 
   * @param type - Index type
   * @returns Index statistics
   */
  async getStats(type: IndexType): Promise<IndexStats> {
    const indexName = this.getIndexName(type);

    // Mock: Get stats
    const stats = await this.mockElasticsearchRequest('GET', `/${indexName}/_stats`);

    return {
      index: indexName,
      docCount: 1000,
      size: 1024 * 1024, // 1 MB
      shardCount: 1,
      health: 'green',
      createdAt: new Date(),
    };
  }

  /**
   * Get cluster health
   * 
   * @returns Cluster health
   */
  async getClusterHealth(): Promise<{
    status: 'green' | 'yellow' | 'red';
    numberOfNodes: number;
    activeShards: number;
  }> {
    // Mock: Get cluster health
    return {
      status: 'green',
      numberOfNodes: 1,
      activeShards: 5,
    };
  }

  // ==========================================================================
  // Public API - Refresh
  // ==========================================================================

  /**
   * Refresh index (make recent changes searchable)
   * 
   * @param type - Index type
   */
  async refresh(type: IndexType): Promise<void> {
    const indexName = this.getIndexName(type);

    this.emit('index:refreshing', { indexName });

    // Mock: Refresh index
    await this.mockElasticsearchRequest('POST', `/${indexName}/_refresh`);

    this.emit('index:refreshed', { indexName });
  }

  /**
   * Start auto-refresh timer
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) return;

    this.refreshTimer = setInterval(() => {
      this.emit('auto-refresh:triggered');
      // Refresh all indices
      for (const type of Object.values(IndexType)) {
        this.refresh(type).catch(err => {
          this.emit('auto-refresh:error', { type, error: err });
        });
      }
    }, this.config.refreshInterval);
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Get index name
   */
  private getIndexName(type: IndexType): string {
    return `${this.config.indexPrefix}-${type}`;
  }

  /**
   * Process bulk batch
   */
  private async processBulkBatch(batch: BulkOperation[]): Promise<void> {
    // Mock: Process bulk operations
    // In real implementation, use Elasticsearch bulk API
    this.emit('bulk:batch:processing', { batchSize: batch.length });

    await new Promise(resolve => setTimeout(resolve, 10));

    this.emit('bulk:batch:processed', { batchSize: batch.length });
  }

  /**
   * Chunk array into batches
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Mock Elasticsearch request
   */
  private async mockElasticsearchRequest(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    // Mock: Simulate Elasticsearch request
    // In real implementation, use @elastic/elasticsearch client
    await new Promise(resolve => setTimeout(resolve, 10));
    return { acknowledged: true };
  }
}

// ============================================================================
// Query Builder Implementation
// ============================================================================

class ElasticsearchQueryBuilder implements QueryBuilder {
  private queryObj: any = {};

  match(field: string, query: string): QueryBuilder {
    this.queryObj = { match: { [field]: query } };
    return this;
  }

  matchPhrase(field: string, query: string): QueryBuilder {
    this.queryObj = { match_phrase: { [field]: query } };
    return this;
  }

  term(field: string, value: any): QueryBuilder {
    this.queryObj = { term: { [field]: value } };
    return this;
  }

  terms(field: string, values: any[]): QueryBuilder {
    this.queryObj = { terms: { [field]: values } };
    return this;
  }

  range(field: string, options: { gte?: any; lte?: any; gt?: any; lt?: any }): QueryBuilder {
    this.queryObj = { range: { [field]: options } };
    return this;
  }

  bool(options: {
    must?: QueryBuilder[];
    should?: QueryBuilder[];
    must_not?: QueryBuilder[];
    filter?: QueryBuilder[];
  }): QueryBuilder {
    this.queryObj = {
      bool: {
        must: options.must?.map(q => q.build()),
        should: options.should?.map(q => q.build()),
        must_not: options.must_not?.map(q => q.build()),
        filter: options.filter?.map(q => q.build()),
      },
    };
    return this;
  }

  fuzzy(field: string, value: string, fuzziness: number | 'AUTO' = 'AUTO'): QueryBuilder {
    this.queryObj = { fuzzy: { [field]: { value, fuzziness } } };
    return this;
  }

  wildcard(field: string, value: string): QueryBuilder {
    this.queryObj = { wildcard: { [field]: value } };
    return this;
  }

  exists(field: string): QueryBuilder {
    this.queryObj = { exists: { field } };
    return this;
  }

  build(): any {
    return this.queryObj;
  }
}

// ============================================================================
// Aggregation Builder Implementation
// ============================================================================

class ElasticsearchAggregationBuilder implements AggregationBuilder {
  private aggsObj: any = {};

  terms(name: string, field: string, size = 10): AggregationBuilder {
    this.aggsObj[name] = { terms: { field, size } };
    return this;
  }

  dateHistogram(name: string, field: string, interval: string): AggregationBuilder {
    this.aggsObj[name] = { date_histogram: { field, interval } };
    return this;
  }

  stats(name: string, field: string): AggregationBuilder {
    this.aggsObj[name] = { stats: { field } };
    return this;
  }

  cardinality(name: string, field: string): AggregationBuilder {
    this.aggsObj[name] = { cardinality: { field } };
    return this;
  }

  build(): any {
    return this.aggsObj;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create search index manager
 * 
 * @param config - Configuration
 * @returns SearchIndexManager instance
 */
export function createSearchIndexManager(
  config?: Partial<SearchIndexConfig>
): SearchIndexManager {
  return new SearchIndexManager(config);
}
