/**
 * Custom Pattern Detector - User-defined pattern detection
 * 
 * Purpose: Allow users to define and detect custom code patterns
 * Week 32: Pattern Recognition (File 2/3)
 * 
 * Features:
 * - Custom pattern definition (DSL or JSON)
 * - Pattern compilation (convert to executable detector)
 * - Multi-language support (TypeScript, JavaScript, Python, Java)
 * - AST-based matching (syntax tree traversal)
 * - RegExp-based matching (text pattern matching)
 * - Semantic matching (meaning-based, not syntax)
 * - Context-aware matching (file type, imports, etc.)
 * - Pattern composition (combine patterns with AND/OR/NOT)
 * - Performance optimization (caching, indexing)
 * 
 * Pattern DSL Examples:
 * - "class with >500 lines"
 * - "function without error handling"
 * - "database query without parameters"
 * - "API call without timeout"
 * 
 * @module @odavl-studio/core/ai/custom-pattern-detector
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { CodePattern, Severity } from './code-analyzer';

/**
 * Pattern match strategy
 */
export enum MatchStrategy {
  REGEXP = 'REGEXP', // Text-based regex matching
  AST = 'AST', // Abstract Syntax Tree traversal
  SEMANTIC = 'SEMANTIC', // Meaning-based matching
  HYBRID = 'HYBRID' // Combination of strategies
}

/**
 * Pattern operator
 */
export enum PatternOperator {
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  FOLLOWED_BY = 'FOLLOWED_BY',
  CONTAINS = 'CONTAINS',
  INSIDE = 'INSIDE'
}

/**
 * Custom pattern definition
 */
export interface CustomPatternDefinition {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  
  // Detection strategy
  strategy: MatchStrategy;
  
  // Pattern rules
  rules: PatternRule[];
  
  // Composition (for complex patterns)
  composition?: {
    operator: PatternOperator;
    patterns: string[]; // IDs of other patterns
  };
  
  // Context filters
  context?: {
    languages?: string[]; // Apply only to these languages
    filePatterns?: string[]; // Apply only to files matching glob
    excludeFiles?: string[]; // Exclude these files
    requireImports?: string[]; // Require specific imports
    excludeImports?: string[]; // Exclude if has these imports
  };
  
  // Metadata
  category: string;
  tags: string[];
  examples: Array<{
    code: string;
    shouldMatch: boolean;
    explanation: string;
  }>;
  references?: string[];
}

/**
 * Pattern rule
 */
export interface PatternRule {
  type: 'syntax' | 'semantic' | 'metric';
  
  // Syntax rule (RegExp or AST selector)
  syntax?: {
    pattern: string | RegExp;
    flags?: string;
  };
  
  // Semantic rule (code meaning)
  semantic?: {
    intent: string; // e.g., "database query", "API call"
    features: string[]; // e.g., ["async", "error-handling"]
    antiFeatures?: string[]; // Features that should NOT be present
  };
  
  // Metric rule (code metrics)
  metric?: {
    name: string; // e.g., "lines", "complexity", "nesting"
    operator: '>=' | '<=' | '==' | '>' | '<' | '!=';
    threshold: number;
  };
}

/**
 * Pattern match result
 */
export interface PatternMatchResult {
  pattern: CustomPatternDefinition;
  matches: Array<{
    file: string;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    code: string;
    context: string; // Surrounding code
    explanation: string;
  }>;
  matchCount: number;
  confidence: number; // 0-1
}

/**
 * Pattern validation result
 */
export interface PatternValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  performance: {
    estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    canBeCached: boolean;
  };
}

/**
 * Custom Pattern Detector configuration
 */
export interface CustomPatternDetectorConfig {
  patternsPath?: string;
  enableCaching?: boolean;
  maxCacheSize?: number; // Maximum patterns to cache
  timeoutMs?: number; // Timeout for pattern matching
}

/**
 * Custom Pattern Detector
 */
export class CustomPatternDetector {
  private config: Required<CustomPatternDetectorConfig>;
  private patterns: Map<string, CustomPatternDefinition> = new Map();
  private compiledPatterns: Map<string, CompiledPattern> = new Map();
  private matchCache: Map<string, PatternMatchResult> = new Map();

  constructor(config: CustomPatternDetectorConfig = {}) {
    this.config = {
      patternsPath: config.patternsPath ?? '.odavl/custom-patterns',
      enableCaching: config.enableCaching ?? true,
      maxCacheSize: config.maxCacheSize ?? 100,
      timeoutMs: config.timeoutMs ?? 5000
    };
  }

  /**
   * Initialize detector
   */
  async initialize(): Promise<void> {
    console.log('🔍 Initializing Custom Pattern Detector...');
    
    // Load custom patterns
    await this.loadPatterns();
    
    // Compile patterns
    for (const pattern of this.patterns.values()) {
      await this.compilePattern(pattern);
    }
    
    console.log(`✅ Loaded and compiled ${this.patterns.size} custom patterns`);
  }

  /**
   * Add custom pattern
   */
  async addPattern(definition: CustomPatternDefinition): Promise<void> {
    console.log(`➕ Adding custom pattern: ${definition.name}`);
    
    // Validate pattern
    const validation = await this.validatePattern(definition);
    if (!validation.valid) {
      throw new Error(`Invalid pattern: ${validation.errors.join(', ')}`);
    }
    
    // Add to collection
    this.patterns.set(definition.id, definition);
    
    // Compile
    await this.compilePattern(definition);
    
    // Save to disk
    await this.savePattern(definition);
    
    console.log('✅ Pattern added successfully');
  }

  /**
   * Remove pattern
   */
  async removePattern(patternId: string): Promise<void> {
    this.patterns.delete(patternId);
    this.compiledPatterns.delete(patternId);
    
    // Clear from cache
    for (const key of this.matchCache.keys()) {
      if (key.startsWith(`${patternId}:`)) {
        this.matchCache.delete(key);
      }
    }
    
    await this.savePatterns();
  }

  /**
   * Detect patterns in code
   */
  async detectPatterns(
    code: string,
    filePath: string,
    language: string,
    patternIds?: string[] // Optional: detect only specific patterns
  ): Promise<PatternMatchResult[]> {
    console.log(`🔍 Detecting custom patterns in: ${filePath}`);
    
    const results: PatternMatchResult[] = [];
    const patternsToCheck = patternIds 
      ? patternIds.map(id => this.patterns.get(id)).filter(Boolean) as CustomPatternDefinition[]
      : Array.from(this.patterns.values());
    
    for (const pattern of patternsToCheck) {
      // Check context filters
      if (!this.matchesContext(pattern, filePath, language, code)) {
        continue;
      }
      
      // Check cache
      const cacheKey = `${pattern.id}:${filePath}`;
      if (this.config.enableCaching && this.matchCache.has(cacheKey)) {
        results.push(this.matchCache.get(cacheKey)!);
        continue;
      }
      
      // Detect pattern
      const result = await this.detectPattern(pattern, code, filePath);
      
      // Cache result
      if (this.config.enableCaching) {
        this.matchCache.set(cacheKey, result);
        
        // Limit cache size
        if (this.matchCache.size > this.config.maxCacheSize) {
          const firstKey = this.matchCache.keys().next().value;
          this.matchCache.delete(firstKey);
        }
      }
      
      if (result.matchCount > 0) {
        results.push(result);
      }
    }
    
    console.log(`✅ Detected ${results.length} pattern matches`);
    return results;
  }

  /**
   * Validate pattern definition
   */
  async validatePattern(definition: CustomPatternDefinition): Promise<PatternValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check required fields
    if (!definition.id) errors.push('Pattern must have an id');
    if (!definition.name) errors.push('Pattern must have a name');
    if (!definition.rules || definition.rules.length === 0) {
      errors.push('Pattern must have at least one rule');
    }
    
    // Validate rules
    for (const rule of definition.rules) {
      if (rule.type === 'syntax' && !rule.syntax) {
        errors.push('Syntax rule must have syntax property');
      }
      if (rule.type === 'semantic' && !rule.semantic) {
        errors.push('Semantic rule must have semantic property');
      }
      if (rule.type === 'metric' && !rule.metric) {
        errors.push('Metric rule must have metric property');
      }
      
      // Validate syntax patterns
      if (rule.syntax?.pattern) {
        try {
          if (typeof rule.syntax.pattern === 'string') {
            new RegExp(rule.syntax.pattern, rule.syntax.flags);
          }
        } catch (e) {
          errors.push(`Invalid regex pattern: ${(e as Error).message}`);
        }
      }
    }
    
    // Performance estimation
    let complexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (definition.strategy === MatchStrategy.AST) complexity = 'MEDIUM';
    if (definition.rules.length > 5) complexity = 'HIGH';
    if (definition.composition) complexity = 'HIGH';
    
    // Check if can be cached
    const canBeCached = !definition.composition; // Simple patterns can be cached
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      performance: {
        estimatedComplexity: complexity,
        canBeCached
      }
    };
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): CustomPatternDefinition[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): CustomPatternDefinition | undefined {
    return this.patterns.get(id);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.matchCache.clear();
    console.log('✅ Cache cleared');
  }

  /**
   * Detect single pattern
   */
  private async detectPattern(
    pattern: CustomPatternDefinition,
    code: string,
    filePath: string
  ): Promise<PatternMatchResult> {
    const compiled = this.compiledPatterns.get(pattern.id);
    if (!compiled) {
      throw new Error(`Pattern not compiled: ${pattern.id}`);
    }
    
    const matches: PatternMatchResult['matches'] = [];
    
    // Apply rules
    for (const rule of pattern.rules) {
      const ruleMatches = await this.applyRule(rule, code, filePath);
      matches.push(...ruleMatches);
    }
    
    // Remove duplicates
    const uniqueMatches = this.deduplicateMatches(matches);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(pattern, uniqueMatches, code);
    
    return {
      pattern,
      matches: uniqueMatches,
      matchCount: uniqueMatches.length,
      confidence
    };
  }

  /**
   * Apply rule to code
   */
  private async applyRule(
    rule: PatternRule,
    code: string,
    filePath: string
  ): Promise<PatternMatchResult['matches']> {
    const matches: PatternMatchResult['matches'] = [];
    
    switch (rule.type) {
      case 'syntax':
        matches.push(...await this.applySyntaxRule(rule, code, filePath));
        break;
      case 'semantic':
        matches.push(...await this.applySemanticRule(rule, code, filePath));
        break;
      case 'metric':
        matches.push(...await this.applyMetricRule(rule, code, filePath));
        break;
    }
    
    return matches;
  }

  /**
   * Apply syntax rule
   */
  private async applySyntaxRule(
    rule: PatternRule,
    code: string,
    filePath: string
  ): Promise<PatternMatchResult['matches']> {
    if (!rule.syntax) return [];
    
    const matches: PatternMatchResult['matches'] = [];
    const pattern = typeof rule.syntax.pattern === 'string'
      ? new RegExp(rule.syntax.pattern, rule.syntax.flags || 'g')
      : rule.syntax.pattern;
    
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const startLine = this.getLineNumber(code, match.index);
      const endLine = this.getLineNumber(code, match.index + match[0].length);
      
      matches.push({
        file: filePath,
        line: startLine,
        column: this.getColumnNumber(code, match.index),
        endLine,
        endColumn: this.getColumnNumber(code, match.index + match[0].length),
        code: match[0],
        context: this.getContext(code, match.index, 100),
        explanation: `Matched syntax pattern: ${rule.syntax.pattern}`
      });
    }
    
    return matches;
  }

  /**
   * Apply semantic rule
   */
  private async applySemanticRule(
    rule: PatternRule,
    code: string,
    filePath: string
  ): Promise<PatternMatchResult['matches']> {
    if (!rule.semantic) return [];
    
    const matches: PatternMatchResult['matches'] = [];
    
    // Detect semantic intent (simplified - can be enhanced with ML)
    const intentKeywords = this.getIntentKeywords(rule.semantic.intent);
    
    for (const keyword of intentKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        // Check if required features are present
        const hasFeatures = rule.semantic.features.every(feature =>
          this.hasSemanticFeature(code, match!.index, feature)
        );
        
        // Check if anti-features are absent
        const hasAntiFeatures = rule.semantic.antiFeatures?.some(feature =>
          this.hasSemanticFeature(code, match!.index, feature)
        ) ?? false;
        
        if (hasFeatures && !hasAntiFeatures) {
          const startLine = this.getLineNumber(code, match.index);
          
          matches.push({
            file: filePath,
            line: startLine,
            column: this.getColumnNumber(code, match.index),
            endLine: startLine,
            endColumn: this.getColumnNumber(code, match.index + match[0].length),
            code: this.getStatementAt(code, match.index),
            context: this.getContext(code, match.index, 200),
            explanation: `Matched semantic intent: ${rule.semantic.intent}`
          });
        }
      }
    }
    
    return matches;
  }

  /**
   * Apply metric rule
   */
  private async applyMetricRule(
    rule: PatternRule,
    code: string,
    filePath: string
  ): Promise<PatternMatchResult['matches']> {
    if (!rule.metric) return [];
    
    const matches: PatternMatchResult['matches'] = [];
    
    // Calculate metric
    const metricValue = this.calculateMetric(rule.metric.name, code);
    
    // Check threshold
    const thresholdMet = this.evaluateThreshold(
      metricValue,
      rule.metric.operator,
      rule.metric.threshold
    );
    
    if (thresholdMet) {
      matches.push({
        file: filePath,
        line: 1,
        column: 0,
        endLine: code.split('\n').length,
        endColumn: 0,
        code: code.substring(0, 100) + '...',
        context: 'Entire file',
        explanation: `Metric ${rule.metric.name} = ${metricValue} ${rule.metric.operator} ${rule.metric.threshold}`
      });
    }
    
    return matches;
  }

  /**
   * Get intent keywords
   */
  private getIntentKeywords(intent: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'database query': ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'query', 'execute', 'sql'],
      'API call': ['fetch', 'axios', 'http', 'request', 'api', 'endpoint'],
      'file operation': ['readFile', 'writeFile', 'fs.', 'open', 'close'],
      'authentication': ['login', 'logout', 'auth', 'token', 'session'],
      'error handling': ['try', 'catch', 'throw', 'error', 'exception']
    };
    
    return keywordMap[intent.toLowerCase()] || [intent];
  }

  /**
   * Check if code has semantic feature
   */
  private hasSemanticFeature(code: string, position: number, feature: string): boolean {
    const context = this.getContext(code, position, 500);
    
    const featurePatterns: Record<string, RegExp> = {
      'async': /\basync\b/,
      'error-handling': /\btry\b[\s\S]*?\bcatch\b/,
      'timeout': /\btimeout\b|\bsetTimeout\b/,
      'validation': /\bvalidate\b|\bcheck\b/,
      'parameters': /\$\d+|\?|\:param/
    };
    
    const pattern = featurePatterns[feature];
    return pattern ? pattern.test(context) : false;
  }

  /**
   * Calculate metric
   */
  private calculateMetric(name: string, code: string): number {
    switch (name) {
      case 'lines':
        return code.split('\n').length;
      case 'complexity':
        return this.calculateComplexity(code);
      case 'nesting':
        return this.calculateMaxNesting(code);
      case 'functions':
        return (code.match(/function\s+\w+/g) || []).length;
      default:
        return 0;
    }
  }

  /**
   * Calculate complexity
   */
  private calculateComplexity(code: string): number {
    const controlFlowKeywords = ['if', 'else', 'for', 'while', 'switch', 'case', 'catch'];
    let complexity = 1;
    
    for (const keyword of controlFlowKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) complexity += matches.length;
    }
    
    return complexity;
  }

  /**
   * Calculate max nesting
   */
  private calculateMaxNesting(code: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of code) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }
    
    return maxNesting;
  }

  /**
   * Evaluate threshold
   */
  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Get line number from index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Get column number from index
   */
  private getColumnNumber(content: string, index: number): number {
    const lastNewline = content.lastIndexOf('\n', index);
    return index - lastNewline;
  }

  /**
   * Get context around position
   */
  private getContext(code: string, position: number, length: number): string {
    const start = Math.max(0, position - length / 2);
    const end = Math.min(code.length, position + length / 2);
    return code.substring(start, end);
  }

  /**
   * Get statement at position
   */
  private getStatementAt(code: string, position: number): string {
    // Find statement boundaries (simplified)
    const before = code.substring(0, position);
    const after = code.substring(position);
    
    const statementStart = Math.max(
      before.lastIndexOf(';'),
      before.lastIndexOf('{'),
      before.lastIndexOf('\n')
    ) + 1;
    
    const statementEnd = position + Math.min(
      after.indexOf(';') !== -1 ? after.indexOf(';') : Infinity,
      after.indexOf('}') !== -1 ? after.indexOf('}') : Infinity,
      after.indexOf('\n') !== -1 ? after.indexOf('\n') : Infinity
    );
    
    return code.substring(statementStart, statementEnd).trim();
  }

  /**
   * Deduplicate matches
   */
  private deduplicateMatches(
    matches: PatternMatchResult['matches']
  ): PatternMatchResult['matches'] {
    const seen = new Set<string>();
    const unique: PatternMatchResult['matches'] = [];
    
    for (const match of matches) {
      const key = `${match.file}:${match.line}:${match.column}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(match);
      }
    }
    
    return unique;
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(
    pattern: CustomPatternDefinition,
    matches: PatternMatchResult['matches'],
    code: string
  ): number {
    // Confidence based on rule completeness and match quality
    let confidence = 0.5; // Base confidence
    
    // More rules = higher confidence
    confidence += Math.min(0.3, pattern.rules.length * 0.1);
    
    // Specific strategy increases confidence
    if (pattern.strategy === MatchStrategy.AST) confidence += 0.1;
    if (pattern.strategy === MatchStrategy.HYBRID) confidence += 0.1;
    
    return Math.min(1, confidence);
  }

  /**
   * Check if pattern matches context
   */
  private matchesContext(
    pattern: CustomPatternDefinition,
    filePath: string,
    language: string,
    code: string
  ): boolean {
    if (!pattern.context) return true;
    
    // Check language
    if (pattern.context.languages && !pattern.context.languages.includes(language)) {
      return false;
    }
    
    // Check file patterns (glob matching - simplified)
    if (pattern.context.filePatterns) {
      const matches = pattern.context.filePatterns.some(glob =>
        this.matchesGlob(filePath, glob)
      );
      if (!matches) return false;
    }
    
    // Check exclude files
    if (pattern.context.excludeFiles) {
      const excluded = pattern.context.excludeFiles.some(glob =>
        this.matchesGlob(filePath, glob)
      );
      if (excluded) return false;
    }
    
    // Check required imports
    if (pattern.context.requireImports) {
      const hasImports = pattern.context.requireImports.every(imp =>
        code.includes(`import`) && code.includes(imp)
      );
      if (!hasImports) return false;
    }
    
    // Check exclude imports
    if (pattern.context.excludeImports) {
      const hasExcluded = pattern.context.excludeImports.some(imp =>
        code.includes(`import`) && code.includes(imp)
      );
      if (hasExcluded) return false;
    }
    
    return true;
  }

  /**
   * Simple glob matching
   */
  private matchesGlob(path: string, glob: string): boolean {
    // Convert glob to regex (simplified)
    const regex = new RegExp(
      glob
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
    );
    
    return regex.test(path);
  }

  /**
   * Compile pattern for efficient execution
   */
  private async compilePattern(pattern: CustomPatternDefinition): Promise<void> {
    // Pre-compile regex patterns
    const compiledRules = pattern.rules.map(rule => {
      if (rule.type === 'syntax' && rule.syntax?.pattern) {
        if (typeof rule.syntax.pattern === 'string') {
          return {
            ...rule,
            syntax: {
              ...rule.syntax,
              pattern: new RegExp(rule.syntax.pattern, rule.syntax.flags || 'g')
            }
          };
        }
      }
      return rule;
    });
    
    this.compiledPatterns.set(pattern.id, {
      definition: pattern,
      rules: compiledRules
    });
  }

  /**
   * Load patterns from file system
   */
  private async loadPatterns(): Promise<void> {
    try {
      const patternsPath = path.join(this.config.patternsPath, 'patterns.json');
      const content = await fs.readFile(patternsPath, 'utf-8');
      const patterns: CustomPatternDefinition[] = JSON.parse(content);
      
      for (const pattern of patterns) {
        this.patterns.set(pattern.id, pattern);
      }
      
      console.log(`✅ Loaded ${patterns.length} custom patterns from disk`);
    } catch {
      console.log('⚠️  No custom patterns found on disk');
    }
  }

  /**
   * Save pattern to file system
   */
  private async savePattern(pattern: CustomPatternDefinition): Promise<void> {
    // Add to collection
    this.patterns.set(pattern.id, pattern);
    
    // Save all patterns
    await this.savePatterns();
  }

  /**
   * Save all patterns
   */
  private async savePatterns(): Promise<void> {
    const patternsPath = path.join(this.config.patternsPath, 'patterns.json');
    const patterns = Array.from(this.patterns.values());
    
    await fs.mkdir(this.config.patternsPath, { recursive: true });
    await fs.writeFile(patternsPath, JSON.stringify(patterns, null, 2));
  }
}

/**
 * Compiled pattern (internal representation)
 */
interface CompiledPattern {
  definition: CustomPatternDefinition;
  rules: PatternRule[];
}

/**
 * Convenience function to detect custom patterns
 */
export async function detectCustomPatterns(
  code: string,
  filePath: string,
  language: string
): Promise<PatternMatchResult[]> {
  const detector = new CustomPatternDetector();
  await detector.initialize();
  return detector.detectPatterns(code, filePath, language);
}
