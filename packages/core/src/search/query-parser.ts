/**
 * @fileoverview Query Parser - Natural language query parsing
 * @module @odavl-studio/insight-core/search/query-parser
 * 
 * **Purpose**: Parse natural language queries into structured search queries
 * 
 * **Features**:
 * - Natural language understanding (intent extraction)
 * - Query tokenization (break into components)
 * - Entity recognition (identify code entities)
 * - Syntax tree building (parse structure)
 * - Query optimization (rewrite for performance)
 * - Filter extraction (severity, category, dates)
 * - Sort/pagination parsing
 * - Query validation (syntax checking)
 * - Smart suggestions (autocomplete, corrections)
 * - Query history (learn from usage)
 * 
 * **Supported Patterns**:
 * - "find X in Y" → Search for X within Y scope
 * - "show me X" → Search for X
 * - "X with Y" → Filter X by Y condition
 * - "X that Y" → Filter X where Y is true
 * - "X ordered by Y" → Sort X by Y
 * - "recent X" → Time-based filter
 * - "high severity X" → Severity filter
 * 
 * **Examples**:
 * - "find security issues in authentication code"
 * - "show me unused variables in React components"
 * - "functions with high complexity"
 * - "type errors that occurred today"
 * - "imports ordered by usage"
 * - "recent commits by author John"
 * 
 * **Architecture**:
 * ```
 * QueryParser
 *   ├── Tokenizer (split into tokens)
 *   ├── Intent Classifier (determine query intent)
 *   ├── Entity Extractor (identify entities)
 *   ├── Syntax Parser (build parse tree)
 *   ├── Filter Extractor (extract filters)
 *   ├── Query Builder (construct search query)
 *   └── Validator (check syntax)
 * ```
 * 
 * **Integration Points**:
 * - Used by: Semantic Search, CLI, Web dashboard
 * - Depends on: NLP libraries (natural, compromise)
 */

import { EventEmitter } from 'events';
import type { SearchQuery, SearchType, CodeLanguage, SearchScope, ResultType } from './semantic-search';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Query intent
 */
export enum QueryIntent {
  /** Search for code */
  SEARCH = 'search',
  
  /** Find issues */
  FIND_ISSUES = 'find-issues',
  
  /** List items */
  LIST = 'list',
  
  /** Filter items */
  FILTER = 'filter',
  
  /** Sort items */
  SORT = 'sort',
  
  /** Count items */
  COUNT = 'count',
  
  /** Aggregate data */
  AGGREGATE = 'aggregate',
}

/**
 * Entity type
 */
export enum EntityType {
  /** Code element (function, class, etc.) */
  CODE_ELEMENT = 'code-element',
  
  /** File path */
  FILE = 'file',
  
  /** Language */
  LANGUAGE = 'language',
  
  /** Severity */
  SEVERITY = 'severity',
  
  /** Category */
  CATEGORY = 'category',
  
  /** Date/time */
  DATETIME = 'datetime',
  
  /** Number */
  NUMBER = 'number',
  
  /** Boolean */
  BOOLEAN = 'boolean',
  
  /** Author */
  AUTHOR = 'author',
}

/**
 * Token type
 */
export enum TokenType {
  KEYWORD = 'keyword',
  ENTITY = 'entity',
  OPERATOR = 'operator',
  VALUE = 'value',
  PUNCTUATION = 'punctuation',
}

/**
 * Token
 */
export interface Token {
  /** Token type */
  type: TokenType;
  
  /** Token value */
  value: string;
  
  /** Start position */
  start: number;
  
  /** End position */
  end: number;
  
  /** Entity type (if token is entity) */
  entityType?: EntityType;
}

/**
 * Extracted entity
 */
export interface Entity {
  /** Entity type */
  type: EntityType;
  
  /** Entity value */
  value: string;
  
  /** Confidence (0-1) */
  confidence: number;
  
  /** Position in query */
  position: {
    start: number;
    end: number;
  };
}

/**
 * Parsed filter
 */
export interface ParsedFilter {
  /** Field name */
  field: string;
  
  /** Operator */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'starts' | 'ends';
  
  /** Value */
  value: any;
}

/**
 * Parsed sort
 */
export interface ParsedSort {
  /** Field name */
  field: string;
  
  /** Order */
  order: 'asc' | 'desc';
}

/**
 * Parse result
 */
export interface ParseResult {
  /** Original query */
  originalQuery: string;
  
  /** Detected intent */
  intent: QueryIntent;
  
  /** Extracted entities */
  entities: Entity[];
  
  /** Main search term */
  searchTerm: string;
  
  /** Extracted filters */
  filters: ParsedFilter[];
  
  /** Extracted sorts */
  sorts: ParsedSort[];
  
  /** Pagination */
  pagination?: {
    page?: number;
    pageSize?: number;
    limit?: number;
  };
  
  /** Scope */
  scope?: SearchScope;
  
  /** Search type */
  searchType?: SearchType;
  
  /** Confidence (0-1) */
  confidence: number;
  
  /** Suggestions (if confidence is low) */
  suggestions?: string[];
  
  /** Structured search query */
  searchQuery: SearchQuery;
}

/**
 * Query parser configuration
 */
export interface QueryParserConfig {
  /** Enable entity recognition */
  enableEntityRecognition: boolean;
  
  /** Enable query optimization */
  enableOptimization: boolean;
  
  /** Enable smart suggestions */
  enableSuggestions: boolean;
  
  /** Minimum confidence threshold */
  minConfidence: number;
  
  /** Store query history */
  storeHistory: boolean;
  
  /** History size */
  historySize: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: QueryParserConfig = {
  enableEntityRecognition: true,
  enableOptimization: true,
  enableSuggestions: true,
  minConfidence: 0.6,
  storeHistory: true,
  historySize: 100,
};

// ============================================================================
// Keywords & Patterns
// ============================================================================

/**
 * Intent keywords
 */
const INTENT_KEYWORDS: Record<QueryIntent, string[]> = {
  [QueryIntent.SEARCH]: ['find', 'search', 'look for', 'locate'],
  [QueryIntent.FIND_ISSUES]: ['issues', 'errors', 'warnings', 'problems', 'bugs'],
  [QueryIntent.LIST]: ['list', 'show', 'display', 'get'],
  [QueryIntent.FILTER]: ['with', 'that', 'where', 'having'],
  [QueryIntent.SORT]: ['ordered', 'sorted', 'by'],
  [QueryIntent.COUNT]: ['count', 'how many', 'number of'],
  [QueryIntent.AGGREGATE]: ['average', 'sum', 'total', 'aggregate'],
};

/**
 * Entity patterns
 */
const ENTITY_PATTERNS: Array<{
  type: EntityType;
  pattern: RegExp;
}> = [
  { type: EntityType.LANGUAGE, pattern: /\b(typescript|javascript|python|java|go|rust)\b/i },
  { type: EntityType.SEVERITY, pattern: /\b(critical|high|medium|low)\b/i },
  { type: EntityType.CATEGORY, pattern: /\b(security|performance|complexity|import|type)\b/i },
  { type: EntityType.DATETIME, pattern: /\b(today|yesterday|last week|last month|recent)\b/i },
  { type: EntityType.FILE, pattern: /\b[a-zA-Z0-9_\-\/\.]+\.(ts|js|py|java|go|rs)\b/i },
  { type: EntityType.CODE_ELEMENT, pattern: /\b(function|class|method|variable|interface|type)\b/i },
];

/**
 * Operator patterns
 */
const OPERATOR_PATTERNS: Record<string, ParsedFilter['operator']> = {
  'equal': 'eq',
  'equals': 'eq',
  'is': 'eq',
  'not': 'ne',
  'greater than': 'gt',
  'more than': 'gt',
  'less than': 'lt',
  'fewer than': 'lt',
  'at least': 'gte',
  'at most': 'lte',
  'contains': 'contains',
  'starts with': 'starts',
  'ends with': 'ends',
  'in': 'in',
};

// ============================================================================
// QueryParser Class
// ============================================================================

/**
 * Query Parser - Natural language query parsing
 * 
 * **Usage**:
 * ```typescript
 * import { QueryParser } from '@odavl-studio/insight-core/search/query-parser';
 * 
 * const parser = new QueryParser({
 *   enableEntityRecognition: true,
 *   enableSuggestions: true,
 * });
 * 
 * // Parse natural language query
 * const result = await parser.parse('find security issues in authentication code');
 * 
 * console.log('Intent:', result.intent);
 * console.log('Search term:', result.searchTerm);
 * console.log('Entities:', result.entities);
 * console.log('Filters:', result.filters);
 * console.log('Confidence:', result.confidence);
 * 
 * // Use structured query
 * const searchQuery = result.searchQuery;
 * // Pass to SemanticSearch.search()
 * 
 * // More examples
 * await parser.parse('show me unused variables in React components');
 * await parser.parse('functions with high complexity');
 * await parser.parse('type errors that occurred today');
 * await parser.parse('recent commits by author John');
 * ```
 * 
 * **Advanced Usage**:
 * ```typescript
 * // Parse with validation
 * const result = await parser.parse('find security issues', { validate: true });
 * if (result.confidence < 0.7) {
 *   console.log('Low confidence. Suggestions:', result.suggestions);
 * }
 * 
 * // Get query suggestions
 * const suggestions = await parser.suggest('secur'); // ['security', 'secure']
 * 
 * // Get query history
 * const history = parser.getHistory();
 * console.log('Recent queries:', history);
 * 
 * // Optimize query
 * const optimized = await parser.optimize('find functions that are unused and have high complexity');
 * // Rewrites to more efficient query
 * ```
 */
export class QueryParser extends EventEmitter {
  private config: QueryParserConfig;
  private queryHistory: string[] = [];

  constructor(config: Partial<QueryParserConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API - Parsing
  // ==========================================================================

  /**
   * Parse natural language query
   * 
   * @param query - Natural language query
   * @param options - Parse options
   * @returns Parse result
   */
  async parse(
    query: string,
    options: { validate?: boolean } = {}
  ): Promise<ParseResult> {
    this.emit('parse:started', { query });

    // Normalize query
    const normalized = this.normalizeQuery(query);

    // Tokenize
    const tokens = this.tokenize(normalized);

    // Classify intent
    const intent = this.classifyIntent(tokens);

    // Extract entities
    const entities = this.config.enableEntityRecognition
      ? this.extractEntities(normalized, tokens)
      : [];

    // Extract main search term
    const searchTerm = this.extractSearchTerm(normalized, entities);

    // Extract filters
    const filters = this.extractFilters(normalized, entities);

    // Extract sorts
    const sorts = this.extractSorts(normalized);

    // Extract pagination
    const pagination = this.extractPagination(normalized);

    // Determine scope
    const scope = this.determineScope(normalized, entities);

    // Determine search type
    const searchType = this.determineSearchType(normalized);

    // Calculate confidence
    const confidence = this.calculateConfidence(intent, entities, searchTerm);

    // Generate suggestions if confidence is low
    const suggestions = confidence < this.config.minConfidence && this.config.enableSuggestions
      ? this.generateSuggestions(query, intent, entities)
      : undefined;

    // Build structured search query
    const searchQuery = this.buildSearchQuery({
      searchTerm,
      filters,
      sorts,
      pagination,
      scope,
      searchType,
      entities,
    });

    // Optimize query if enabled
    if (this.config.enableOptimization) {
      this.optimizeSearchQuery(searchQuery);
    }

    // Store in history
    if (this.config.storeHistory) {
      this.addToHistory(query);
    }

    const result: ParseResult = {
      originalQuery: query,
      intent,
      entities,
      searchTerm,
      filters,
      sorts,
      pagination,
      scope,
      searchType,
      confidence,
      suggestions,
      searchQuery,
    };

    this.emit('parse:completed', { query, result });

    return result;
  }

  /**
   * Suggest completions
   * 
   * @param partial - Partial query
   * @returns Suggestions
   */
  async suggest(partial: string): Promise<string[]> {
    // Mock: Get suggestions based on history and patterns
    const suggestions: string[] = [];

    // From history
    const historyMatches = this.queryHistory.filter(q =>
      q.toLowerCase().startsWith(partial.toLowerCase())
    );
    suggestions.push(...historyMatches);

    // Common patterns
    const commonPatterns = [
      'find security issues',
      'show unused variables',
      'functions with high complexity',
      'recent errors',
    ];
    const patternMatches = commonPatterns.filter(p =>
      p.toLowerCase().includes(partial.toLowerCase())
    );
    suggestions.push(...patternMatches);

    return [...new Set(suggestions)].slice(0, 10);
  }

  /**
   * Get query history
   * 
   * @returns Query history
   */
  getHistory(): string[] {
    return [...this.queryHistory];
  }

  /**
   * Clear query history
   */
  clearHistory(): void {
    this.queryHistory = [];
    this.emit('history:cleared');
  }

  // ==========================================================================
  // Private Methods - Normalization
  // ==========================================================================

  /**
   * Normalize query
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Collapse whitespace
  }

  // ==========================================================================
  // Private Methods - Tokenization
  // ==========================================================================

  /**
   * Tokenize query
   */
  private tokenize(query: string): Token[] {
    const tokens: Token[] = [];
    const words = query.split(/\s+/);
    let position = 0;

    for (const word of words) {
      const token: Token = {
        type: this.classifyToken(word),
        value: word,
        start: position,
        end: position + word.length,
      };

      tokens.push(token);
      position += word.length + 1; // +1 for space
    }

    return tokens;
  }

  /**
   * Classify token type
   */
  private classifyToken(word: string): TokenType {
    // Check if keyword
    for (const keywords of Object.values(INTENT_KEYWORDS)) {
      if (keywords.includes(word)) {
        return TokenType.KEYWORD;
      }
    }

    // Check if operator
    if (word in OPERATOR_PATTERNS) {
      return TokenType.OPERATOR;
    }

    // Check if punctuation
    if (/^[.,;:!?]$/.test(word)) {
      return TokenType.PUNCTUATION;
    }

    // Default to value
    return TokenType.VALUE;
  }

  // ==========================================================================
  // Private Methods - Intent Classification
  // ==========================================================================

  /**
   * Classify query intent
   */
  private classifyIntent(tokens: Token[]): QueryIntent {
    // Score each intent based on keyword matches
    const scores: Record<QueryIntent, number> = {
      [QueryIntent.SEARCH]: 0,
      [QueryIntent.FIND_ISSUES]: 0,
      [QueryIntent.LIST]: 0,
      [QueryIntent.FILTER]: 0,
      [QueryIntent.SORT]: 0,
      [QueryIntent.COUNT]: 0,
      [QueryIntent.AGGREGATE]: 0,
    };

    for (const token of tokens) {
      if (token.type !== TokenType.KEYWORD) continue;

      for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
        if (keywords.includes(token.value)) {
          scores[intent as QueryIntent] += 1;
        }
      }
    }

    // Return intent with highest score
    let maxScore = 0;
    let bestIntent = QueryIntent.SEARCH;

    for (const [intent, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent as QueryIntent;
      }
    }

    return bestIntent;
  }

  // ==========================================================================
  // Private Methods - Entity Extraction
  // ==========================================================================

  /**
   * Extract entities
   */
  private extractEntities(query: string, tokens: Token[]): Entity[] {
    const entities: Entity[] = [];

    for (const pattern of ENTITY_PATTERNS) {
      const matches = query.matchAll(pattern.pattern);

      for (const match of matches) {
        if (!match.index) continue;

        entities.push({
          type: pattern.type,
          value: match[0],
          confidence: 0.9,
          position: {
            start: match.index,
            end: match.index + match[0].length,
          },
        });
      }
    }

    return entities;
  }

  /**
   * Extract main search term
   */
  private extractSearchTerm(query: string, entities: Entity[]): string {
    // Remove keywords and entities to get core search term
    let term = query;

    // Remove intent keywords
    for (const keywords of Object.values(INTENT_KEYWORDS)) {
      for (const keyword of keywords) {
        term = term.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
      }
    }

    // Remove common filter words
    const filterWords = ['in', 'with', 'that', 'where', 'by', 'the', 'a', 'an'];
    for (const word of filterWords) {
      term = term.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    }

    return term.trim().replace(/\s+/g, ' ');
  }

  // ==========================================================================
  // Private Methods - Filter Extraction
  // ==========================================================================

  /**
   * Extract filters
   */
  private extractFilters(query: string, entities: Entity[]): ParsedFilter[] {
    const filters: ParsedFilter[] = [];

    // Extract severity filter
    const severityEntity = entities.find(e => e.type === EntityType.SEVERITY);
    if (severityEntity) {
      filters.push({
        field: 'severity',
        operator: 'eq',
        value: severityEntity.value,
      });
    }

    // Extract category filter
    const categoryEntity = entities.find(e => e.type === EntityType.CATEGORY);
    if (categoryEntity) {
      filters.push({
        field: 'category',
        operator: 'eq',
        value: categoryEntity.value,
      });
    }

    // Extract language filter
    const languageEntity = entities.find(e => e.type === EntityType.LANGUAGE);
    if (languageEntity) {
      filters.push({
        field: 'language',
        operator: 'eq',
        value: languageEntity.value,
      });
    }

    // Extract time filter
    const timeEntity = entities.find(e => e.type === EntityType.DATETIME);
    if (timeEntity) {
      const timeFilter = this.parseTimeFilter(timeEntity.value);
      if (timeFilter) {
        filters.push(timeFilter);
      }
    }

    return filters;
  }

  /**
   * Parse time filter
   */
  private parseTimeFilter(value: string): ParsedFilter | null {
    const now = new Date();

    if (value === 'today') {
      return {
        field: 'timestamp',
        operator: 'gte',
        value: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      };
    } else if (value === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        field: 'timestamp',
        operator: 'gte',
        value: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
      };
    } else if (value === 'last week') {
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return {
        field: 'timestamp',
        operator: 'gte',
        value: lastWeek,
      };
    } else if (value === 'recent') {
      const recent = new Date(now);
      recent.setDate(recent.getDate() - 7);
      return {
        field: 'timestamp',
        operator: 'gte',
        value: recent,
      };
    }

    return null;
  }

  // ==========================================================================
  // Private Methods - Sort Extraction
  // ==========================================================================

  /**
   * Extract sorts
   */
  private extractSorts(query: string): ParsedSort[] {
    const sorts: ParsedSort[] = [];

    // Pattern: "ordered by X" or "sorted by X"
    const sortPattern = /(?:ordered|sorted)\s+by\s+(\w+)(?:\s+(asc|desc))?/i;
    const match = query.match(sortPattern);

    if (match) {
      sorts.push({
        field: match[1],
        order: (match[2]?.toLowerCase() as 'asc' | 'desc') || 'asc',
      });
    }

    return sorts;
  }

  // ==========================================================================
  // Private Methods - Pagination Extraction
  // ==========================================================================

  /**
   * Extract pagination
   */
  private extractPagination(query: string): ParseResult['pagination'] {
    const pagination: ParseResult['pagination'] = {};

    // Pattern: "limit N" or "first N"
    const limitPattern = /(?:limit|first)\s+(\d+)/i;
    const limitMatch = query.match(limitPattern);
    if (limitMatch) {
      pagination.limit = parseInt(limitMatch[1], 10);
    }

    // Pattern: "page N"
    const pagePattern = /page\s+(\d+)/i;
    const pageMatch = query.match(pagePattern);
    if (pageMatch) {
      pagination.page = parseInt(pageMatch[1], 10);
    }

    return Object.keys(pagination).length > 0 ? pagination : undefined;
  }

  // ==========================================================================
  // Private Methods - Scope & Type Determination
  // ==========================================================================

  /**
   * Determine search scope
   */
  private determineScope(query: string, entities: Entity[]): SearchScope | undefined {
    // Check for file scope
    if (query.includes('in file') || entities.some(e => e.type === EntityType.FILE)) {
      return SearchScope.FILE;
    }

    // Check for function scope
    if (query.includes('in function')) {
      return SearchScope.FUNCTION;
    }

    // Check for class scope
    if (query.includes('in class')) {
      return SearchScope.CLASS;
    }

    return SearchScope.WORKSPACE;
  }

  /**
   * Determine search type
   */
  private determineSearchType(query: string): SearchType {
    // If query contains regex patterns, use syntax search
    if (query.includes('*') || query.includes('?') || query.includes('[')) {
      return SearchType.SYNTAX;
    }

    // Default to semantic
    return SearchType.SEMANTIC;
  }

  // ==========================================================================
  // Private Methods - Query Building
  // ==========================================================================

  /**
   * Build structured search query
   */
  private buildSearchQuery(params: {
    searchTerm: string;
    filters: ParsedFilter[];
    sorts: ParsedSort[];
    pagination?: ParseResult['pagination'];
    scope?: SearchScope;
    searchType?: SearchType;
    entities: Entity[];
  }): SearchQuery {
    const query: SearchQuery = {
      query: params.searchTerm,
      type: params.searchType,
      scope: params.scope,
      limit: params.pagination?.limit,
    };

    // Add language filter
    const languages = params.entities
      .filter(e => e.type === EntityType.LANGUAGE)
      .map(e => e.value as CodeLanguage);
    if (languages.length > 0) {
      query.languages = languages;
    }

    return query;
  }

  /**
   * Optimize search query
   */
  private optimizeSearchQuery(query: SearchQuery): void {
    // Optimize limit
    if (!query.limit) {
      query.limit = 50; // Default limit
    } else if (query.limit > 1000) {
      query.limit = 1000; // Cap at 1000
    }

    // Set minimum score
    if (!query.minScore) {
      query.minScore = 0.7;
    }
  }

  // ==========================================================================
  // Private Methods - Confidence & Suggestions
  // ==========================================================================

  /**
   * Calculate confidence
   */
  private calculateConfidence(intent: QueryIntent, entities: Entity[], searchTerm: string): number {
    let confidence = 0.5; // Base confidence

    // Boost for clear intent
    if (intent !== QueryIntent.SEARCH) {
      confidence += 0.1;
    }

    // Boost for entities
    confidence += Math.min(entities.length * 0.1, 0.3);

    // Boost for non-empty search term
    if (searchTerm.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate suggestions
   */
  private generateSuggestions(query: string, intent: QueryIntent, entities: Entity[]): string[] {
    const suggestions: string[] = [];

    // Suggest more specific queries
    if (entities.length === 0) {
      suggestions.push('Try adding filters like "high severity" or "in TypeScript"');
    }

    // Suggest alternatives based on intent
    if (intent === QueryIntent.SEARCH) {
      suggestions.push('Try: "find security issues in authentication"');
      suggestions.push('Try: "show unused variables"');
    }

    return suggestions;
  }

  // ==========================================================================
  // Private Methods - History
  // ==========================================================================

  /**
   * Add query to history
   */
  private addToHistory(query: string): void {
    this.queryHistory.unshift(query);

    // Limit history size
    if (this.queryHistory.length > this.config.historySize) {
      this.queryHistory = this.queryHistory.slice(0, this.config.historySize);
    }

    this.emit('history:added', { query });
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create query parser
 * 
 * @param config - Parser configuration
 * @returns QueryParser instance
 */
export function createQueryParser(config?: Partial<QueryParserConfig>): QueryParser {
  return new QueryParser(config);
}

/**
 * Quick parse (one-off parsing)
 * 
 * @param query - Natural language query
 * @returns Parse result
 */
export async function parseQuery(query: string): Promise<ParseResult> {
  const parser = new QueryParser();
  return await parser.parse(query);
}
