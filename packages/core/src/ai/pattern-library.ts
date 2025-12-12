/**
 * Pattern Library Builder - Learn and manage code patterns
 * 
 * Purpose: Discover, catalog, and evolve code patterns from codebase analysis
 * Week 32: Pattern Recognition (File 1/3)
 * 
 * Features:
 * - Pattern discovery (extract common patterns from code)
 * - Pattern cataloging (organize patterns by category/language)
 * - Pattern evolution tracking (how patterns change over time)
 * - Pattern quality scoring (effectiveness, popularity, success rate)
 * - Pattern relationships (similar, opposite, complementary)
 * - Pattern recommendation (suggest patterns for situations)
 * - Pattern validation (verify pattern correctness)
 * - Pattern templates (reusable pattern definitions)
 * 
 * Pattern Types:
 * - Design patterns (Singleton, Factory, Observer, etc.)
 * - Anti-patterns (God class, Long method, etc.)
 * - Architectural patterns (MVC, Microservices, etc.)
 * - Security patterns (Input validation, Authentication, etc.)
 * - Performance patterns (Caching, Lazy loading, etc.)
 * - Testing patterns (AAA, Given-When-Then, etc.)
 * 
 * @module @odavl-studio/core/ai/pattern-library
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { CodePattern } from './code-analyzer';

/**
 * Pattern category
 */
export enum PatternCategory {
  DESIGN = 'DESIGN',
  ARCHITECTURAL = 'ARCHITECTURAL',
  ANTI_PATTERN = 'ANTI_PATTERN',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  TESTING = 'TESTING',
  IDIOM = 'IDIOM',
  REFACTORING = 'REFACTORING'
}

/**
 * Pattern maturity level
 */
export enum PatternMaturity {
  EXPERIMENTAL = 'EXPERIMENTAL', // New, unproven pattern
  EMERGING = 'EMERGING', // Showing promise, limited adoption
  ESTABLISHED = 'ESTABLISHED', // Well-proven, widely used
  MATURE = 'MATURE', // Industry standard, best practice
  DEPRECATED = 'DEPRECATED' // No longer recommended
}

/**
 * Pattern library entry
 */
export interface PatternLibraryEntry {
  id: string;
  name: string;
  category: PatternCategory;
  description: string;
  maturity: PatternMaturity;
  
  // Pattern definition
  definition: {
    intent: string; // What problem does it solve?
    motivation: string; // Why use this pattern?
    structure: string; // How is it structured?
    participants: string[]; // Key components
    collaborations: string; // How components interact
    consequences: string[]; // Benefits and tradeoffs
  };
  
  // Code signature
  signature: {
    language: string[];
    syntaxPattern: RegExp | string;
    semanticFeatures: string[]; // Abstract features (e.g., "creates objects", "manages state")
    codeExample: string;
    antiExample?: string; // What NOT to do
  };
  
  // Quality metrics
  quality: {
    effectiveness: number; // 0-1, how well does it solve the problem?
    popularity: number; // 0-1, how often is it used?
    successRate: number; // 0-1, % of times it improves code
    complexity: number; // 0-100, how complex is it?
    learningCurve: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  
  // Relationships
  relationships: {
    relatedPatterns: string[]; // Pattern IDs
    alternatives: string[]; // Alternative solutions
    complementaryPatterns: string[]; // Patterns that work well together
    conflictsWith: string[]; // Patterns that shouldn't be combined
  };
  
  // Usage context
  context: {
    applicableScenarios: string[];
    notApplicableScenarios: string[];
    prerequisites: string[];
    commonMistakes: string[];
  };
  
  // Evolution tracking
  evolution: {
    firstSeen: Date;
    lastSeen: Date;
    occurrences: number;
    versions: Array<{
      date: Date;
      changes: string;
      reason: string;
    }>;
  };
  
  // Metadata
  tags: string[];
  references: string[]; // Books, articles, URLs
  examples: Array<{
    project: string;
    file: string;
    line: number;
    code: string;
  }>;
}

/**
 * Pattern discovery result
 */
export interface PatternDiscoveryResult {
  pattern: PatternLibraryEntry;
  confidence: number; // 0-1
  occurrences: Array<{
    file: string;
    line: number;
    code: string;
    context: string;
  }>;
  quality: {
    consistency: number; // How consistent are occurrences?
    clarity: number; // How clear is the pattern?
    generalizability: number; // Can it be generalized?
  };
}

/**
 * Pattern recommendation
 */
export interface PatternRecommendation {
  pattern: PatternLibraryEntry;
  confidence: number;
  relevance: number; // 0-1, how relevant to current situation?
  reasoning: string[];
  benefits: string[];
  tradeoffs: string[];
  implementation: {
    estimatedEffort: string;
    steps: string[];
    codeExample: string;
  };
}

/**
 * Pattern Library Builder configuration
 */
export interface PatternLibraryConfig {
  libraryPath?: string; // Path to pattern library
  enableDiscovery?: boolean; // Auto-discover patterns
  minOccurrences?: number; // Minimum occurrences to consider pattern
  minConfidence?: number; // Minimum confidence for discovery
  languageFilters?: string[]; // Only discover patterns for these languages
}

/**
 * Pattern Library Builder
 */
export class PatternLibraryBuilder {
  private config: Required<PatternLibraryConfig>;
  private patterns: Map<string, PatternLibraryEntry> = new Map();
  private discoveredPatterns: PatternDiscoveryResult[] = [];

  constructor(config: PatternLibraryConfig = {}) {
    this.config = {
      libraryPath: config.libraryPath ?? '.odavl/patterns',
      enableDiscovery: config.enableDiscovery ?? true,
      minOccurrences: config.minOccurrences ?? 3,
      minConfidence: config.minConfidence ?? 0.7,
      languageFilters: config.languageFilters ?? ['typescript', 'javascript', 'python', 'java']
    };
  }

  /**
   * Initialize pattern library
   */
  async initialize(): Promise<void> {
    console.log('📚 Initializing Pattern Library...');
    
    // Load built-in patterns
    this.loadBuiltInPatterns();
    
    // Load custom patterns from file system
    await this.loadCustomPatterns();
    
    console.log(`✅ Loaded ${this.patterns.size} patterns`);
  }

  /**
   * Discover patterns in code
   */
  async discoverPatterns(
    codeFiles: Array<{ path: string; content: string; language: string }>
  ): Promise<PatternDiscoveryResult[]> {
    if (!this.config.enableDiscovery) {
      console.log('⚠️  Pattern discovery disabled');
      return [];
    }
    
    console.log(`🔍 Discovering patterns in ${codeFiles.length} files...`);
    
    const discoveries: PatternDiscoveryResult[] = [];
    
    // Extract code structures (classes, functions, imports, etc.)
    const structures = this.extractCodeStructures(codeFiles);
    
    // Find recurring patterns
    const recurringPatterns = this.findRecurringPatterns(structures);
    
    // Analyze and catalog each pattern
    for (const pattern of recurringPatterns) {
      if (pattern.occurrences.length >= this.config.minOccurrences) {
        const discovery = await this.analyzePattern(pattern);
        if (discovery.confidence >= this.config.minConfidence) {
          discoveries.push(discovery);
        }
      }
    }
    
    this.discoveredPatterns = discoveries;
    console.log(`✅ Discovered ${discoveries.length} patterns`);
    
    return discoveries;
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): PatternLibraryEntry | undefined {
    return this.patterns.get(id);
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): PatternLibraryEntry[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category: PatternCategory): PatternLibraryEntry[] {
    return Array.from(this.patterns.values())
      .filter(p => p.category === category);
  }

  /**
   * Get patterns by maturity
   */
  getPatternsByMaturity(maturity: PatternMaturity): PatternLibraryEntry[] {
    return Array.from(this.patterns.values())
      .filter(p => p.maturity === maturity);
  }

  /**
   * Search patterns
   */
  searchPatterns(query: string): PatternLibraryEntry[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.patterns.values())
      .filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.tags.some(t => t.toLowerCase().includes(lowerQuery))
      );
  }

  /**
   * Recommend patterns for a situation
   */
  async recommendPatterns(
    situation: {
      problem: string;
      context: string;
      language: string;
      currentPatterns?: string[]; // Patterns already in use
    }
  ): Promise<PatternRecommendation[]> {
    console.log(`🎯 Recommending patterns for: ${situation.problem}`);
    
    const recommendations: PatternRecommendation[] = [];
    
    for (const pattern of this.patterns.values()) {
      // Filter by language
      if (!pattern.signature.language.includes(situation.language)) {
        continue;
      }
      
      // Calculate relevance
      const relevance = this.calculateRelevance(pattern, situation);
      if (relevance < 0.5) continue;
      
      // Calculate confidence based on quality metrics
      const confidence = (
        pattern.quality.effectiveness * 0.4 +
        pattern.quality.successRate * 0.3 +
        pattern.quality.popularity * 0.2 +
        (1 - pattern.quality.complexity / 100) * 0.1
      );
      
      // Check for conflicts
      if (situation.currentPatterns?.some(cp => 
        pattern.relationships.conflictsWith.includes(cp)
      )) {
        continue;
      }
      
      recommendations.push({
        pattern,
        confidence,
        relevance,
        reasoning: this.generateRecommendationReasoning(pattern, situation),
        benefits: pattern.definition.consequences.filter(c => !c.startsWith('-')),
        tradeoffs: pattern.definition.consequences.filter(c => c.startsWith('-')),
        implementation: {
          estimatedEffort: this.estimateImplementationEffort(pattern),
          steps: this.generateImplementationSteps(pattern),
          codeExample: pattern.signature.codeExample
        }
      });
    }
    
    // Sort by confidence and relevance
    recommendations.sort((a, b) => {
      const scoreA = a.confidence * 0.6 + a.relevance * 0.4;
      const scoreB = b.confidence * 0.6 + b.relevance * 0.4;
      return scoreB - scoreA;
    });
    
    console.log(`✅ Generated ${recommendations.length} recommendations`);
    return recommendations.slice(0, 5); // Top 5
  }

  /**
   * Add custom pattern
   */
  async addPattern(pattern: PatternLibraryEntry): Promise<void> {
    console.log(`➕ Adding pattern: ${pattern.name}`);
    
    // Validate pattern
    this.validatePattern(pattern);
    
    // Add to library
    this.patterns.set(pattern.id, pattern);
    
    // Save to disk
    await this.savePattern(pattern);
    
    console.log('✅ Pattern added successfully');
  }

  /**
   * Update pattern
   */
  async updatePattern(
    patternId: string,
    updates: Partial<PatternLibraryEntry>,
    reason: string
  ): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }
    
    console.log(`🔄 Updating pattern: ${pattern.name}`);
    
    // Record version
    const version = {
      date: new Date(),
      changes: JSON.stringify(updates),
      reason
    };
    
    // Apply updates
    const updated = {
      ...pattern,
      ...updates,
      evolution: {
        ...pattern.evolution,
        versions: [...pattern.evolution.versions, version]
      }
    };
    
    this.patterns.set(patternId, updated);
    await this.savePattern(updated);
    
    console.log('✅ Pattern updated successfully');
  }

  /**
   * Record pattern usage
   */
  async recordUsage(patternId: string, location: { file: string; line: number }): Promise<void> {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;
    
    // Update evolution tracking
    pattern.evolution.occurrences++;
    pattern.evolution.lastSeen = new Date();
    
    // Update quality metrics (increase popularity)
    pattern.quality.popularity = Math.min(1, pattern.quality.popularity + 0.01);
    
    await this.savePattern(pattern);
  }

  /**
   * Extract code structures
   */
  private extractCodeStructures(
    codeFiles: Array<{ path: string; content: string; language: string }>
  ): Array<{
    type: string;
    name: string;
    code: string;
    file: string;
    line: number;
  }> {
    const structures: Array<{
      type: string;
      name: string;
      code: string;
      file: string;
      line: number;
    }> = [];
    
    for (const file of codeFiles) {
      // Extract classes
      const classMatches = file.content.matchAll(/class\s+(\w+)[\s\S]*?\{[\s\S]*?\}/g);
      for (const match of classMatches) {
        structures.push({
          type: 'class',
          name: match[1],
          code: match[0],
          file: file.path,
          line: this.getLineNumber(file.content, match.index!)
        });
      }
      
      // Extract functions
      const functionMatches = file.content.matchAll(/(?:function|const|let|var)\s+(\w+)\s*=?\s*(?:async\s*)?\([\s\S]*?\)[\s\S]*?\{[\s\S]*?\}/g);
      for (const match of functionMatches) {
        structures.push({
          type: 'function',
          name: match[1],
          code: match[0],
          file: file.path,
          line: this.getLineNumber(file.content, match.index!)
        });
      }
      
      // Extract interfaces/types
      const typeMatches = file.content.matchAll(/(?:interface|type)\s+(\w+)[\s\S]*?\{[\s\S]*?\}/g);
      for (const match of typeMatches) {
        structures.push({
          type: 'type',
          name: match[1],
          code: match[0],
          file: file.path,
          line: this.getLineNumber(file.content, match.index!)
        });
      }
    }
    
    return structures;
  }

  /**
   * Find recurring patterns
   */
  private findRecurringPatterns(structures: Array<{
    type: string;
    name: string;
    code: string;
    file: string;
    line: number;
  }>): Array<{
    signature: string;
    occurrences: Array<{ file: string; line: number; code: string; context: string }>;
  }> {
    const patternMap = new Map<string, Array<{ file: string; line: number; code: string; context: string }>>();
    
    for (const structure of structures) {
      // Create normalized signature (remove variable names, keep structure)
      const signature = this.normalizeCode(structure.code);
      
      if (!patternMap.has(signature)) {
        patternMap.set(signature, []);
      }
      
      patternMap.get(signature)!.push({
        file: structure.file,
        line: structure.line,
        code: structure.code,
        context: structure.type
      });
    }
    
    // Filter patterns that occur multiple times
    const recurring: Array<{
      signature: string;
      occurrences: Array<{ file: string; line: number; code: string; context: string }>;
    }> = [];
    
    for (const [signature, occurrences] of patternMap.entries()) {
      if (occurrences.length >= this.config.minOccurrences) {
        recurring.push({ signature, occurrences });
      }
    }
    
    return recurring;
  }

  /**
   * Analyze pattern
   */
  private async analyzePattern(pattern: {
    signature: string;
    occurrences: Array<{ file: string; line: number; code: string; context: string }>;
  }): Promise<PatternDiscoveryResult> {
    // Extract common features
    const commonFeatures = this.extractCommonFeatures(pattern.occurrences);
    
    // Determine pattern type
    const category = this.inferPatternCategory(commonFeatures);
    
    // Calculate quality metrics
    const consistency = this.calculateConsistency(pattern.occurrences);
    const clarity = this.calculateClarity(commonFeatures);
    const generalizability = this.calculateGeneralizability(pattern.occurrences);
    
    // Calculate confidence
    const confidence = (consistency + clarity + generalizability) / 3;
    
    // Create pattern entry
    const entry: PatternLibraryEntry = {
      id: `discovered-${Date.now()}`,
      name: `Discovered Pattern ${pattern.occurrences.length}x`,
      category,
      description: `Pattern discovered from ${pattern.occurrences.length} occurrences`,
      maturity: PatternMaturity.EXPERIMENTAL,
      definition: {
        intent: 'Auto-discovered pattern',
        motivation: 'Recurring code structure in codebase',
        structure: pattern.signature,
        participants: commonFeatures.participants,
        collaborations: 'To be determined',
        consequences: []
      },
      signature: {
        language: ['typescript', 'javascript'],
        syntaxPattern: pattern.signature,
        semanticFeatures: commonFeatures.semantic,
        codeExample: pattern.occurrences[0].code
      },
      quality: {
        effectiveness: 0.5, // Unknown initially
        popularity: pattern.occurrences.length / 100,
        successRate: 0.5, // Unknown initially
        complexity: this.calculateComplexity(pattern.signature),
        learningCurve: 'MEDIUM'
      },
      relationships: {
        relatedPatterns: [],
        alternatives: [],
        complementaryPatterns: [],
        conflictsWith: []
      },
      context: {
        applicableScenarios: [],
        notApplicableScenarios: [],
        prerequisites: [],
        commonMistakes: []
      },
      evolution: {
        firstSeen: new Date(),
        lastSeen: new Date(),
        occurrences: pattern.occurrences.length,
        versions: []
      },
      tags: ['discovered', 'experimental'],
      references: [],
      examples: pattern.occurrences.slice(0, 3).map(o => ({
        project: 'current',
        file: o.file,
        line: o.line,
        code: o.code
      }))
    };
    
    return {
      pattern: entry,
      confidence,
      occurrences: pattern.occurrences,
      quality: { consistency, clarity, generalizability }
    };
  }

  /**
   * Normalize code for pattern matching
   */
  private normalizeCode(code: string): string {
    return code
      .replace(/\b[a-z_][a-zA-Z0-9_]*\b/g, 'VAR') // Replace identifiers
      .replace(/["'].*?["']/g, 'STR') // Replace strings
      .replace(/\d+/g, 'NUM') // Replace numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract common features
   */
  private extractCommonFeatures(occurrences: Array<{ code: string }>): {
    participants: string[];
    semantic: string[];
  } {
    // Simple feature extraction (can be enhanced with AST analysis)
    const participants: Set<string> = new Set();
    const semantic: Set<string> = new Set();
    
    for (const occ of occurrences) {
      // Extract class/function names
      const classMatch = occ.code.match(/class\s+(\w+)/);
      if (classMatch) participants.add(classMatch[1]);
      
      // Detect semantic features
      if (occ.code.includes('new ')) semantic.add('object-creation');
      if (occ.code.includes('async ')) semantic.add('async-operation');
      if (occ.code.includes('return ')) semantic.add('returns-value');
      if (occ.code.includes('throw ')) semantic.add('error-handling');
    }
    
    return {
      participants: Array.from(participants),
      semantic: Array.from(semantic)
    };
  }

  /**
   * Infer pattern category
   */
  private inferPatternCategory(features: { semantic: string[] }): PatternCategory {
    if (features.semantic.includes('object-creation')) return PatternCategory.DESIGN;
    if (features.semantic.includes('async-operation')) return PatternCategory.PERFORMANCE;
    if (features.semantic.includes('error-handling')) return PatternCategory.SECURITY;
    return PatternCategory.IDIOM;
  }

  /**
   * Calculate consistency
   */
  private calculateConsistency(occurrences: Array<{ code: string }>): number {
    // Measure how similar occurrences are
    const normalized = occurrences.map(o => this.normalizeCode(o.code));
    const uniqueNormalized = new Set(normalized);
    return 1 - (uniqueNormalized.size / occurrences.length);
  }

  /**
   * Calculate clarity
   */
  private calculateClarity(features: { participants: string[]; semantic: string[] }): number {
    // Patterns with more identifiable features are clearer
    const featureCount = features.participants.length + features.semantic.length;
    return Math.min(1, featureCount / 5);
  }

  /**
   * Calculate generalizability
   */
  private calculateGeneralizability(occurrences: Array<{ file: string }>): number {
    // Patterns in more files are more generalizable
    const uniqueFiles = new Set(occurrences.map(o => o.file));
    return Math.min(1, uniqueFiles.size / 3);
  }

  /**
   * Calculate complexity
   */
  private calculateComplexity(code: string): number {
    // Simple complexity measure (LOC + nesting + operators)
    const lines = code.split('\n').length;
    const nesting = (code.match(/\{/g) || []).length;
    const operators = (code.match(/[+\-*/%<>=!&|]/g) || []).length;
    return Math.min(100, lines + nesting * 2 + operators);
  }

  /**
   * Calculate relevance
   */
  private calculateRelevance(
    pattern: PatternLibraryEntry,
    situation: { problem: string; context: string }
  ): number {
    // Simple keyword matching (can be enhanced with NLP)
    const problemWords = situation.problem.toLowerCase().split(/\s+/);
    const contextWords = situation.context.toLowerCase().split(/\s+/);
    
    let relevance = 0;
    
    // Check intent
    const intentWords = pattern.definition.intent.toLowerCase().split(/\s+/);
    relevance += problemWords.filter(w => intentWords.includes(w)).length * 0.2;
    
    // Check tags
    relevance += pattern.tags.filter(t => 
      problemWords.includes(t.toLowerCase()) || contextWords.includes(t.toLowerCase())
    ).length * 0.1;
    
    return Math.min(1, relevance);
  }

  /**
   * Generate recommendation reasoning
   */
  private generateRecommendationReasoning(
    pattern: PatternLibraryEntry,
    situation: { problem: string }
  ): string[] {
    return [
      `Pattern addresses: ${pattern.definition.intent}`,
      `Maturity: ${pattern.maturity}`,
      `Success rate: ${(pattern.quality.successRate * 100).toFixed(0)}%`,
      `Popularity: ${(pattern.quality.popularity * 100).toFixed(0)}%`
    ];
  }

  /**
   * Estimate implementation effort
   */
  private estimateImplementationEffort(pattern: PatternLibraryEntry): string {
    const complexity = pattern.quality.complexity;
    if (complexity < 20) return '1-2 hours';
    if (complexity < 50) return '1 day';
    if (complexity < 75) return '2-3 days';
    return '1 week';
  }

  /**
   * Generate implementation steps
   */
  private generateImplementationSteps(pattern: PatternLibraryEntry): string[] {
    return [
      `1. Review pattern definition: ${pattern.definition.intent}`,
      `2. Identify participants: ${pattern.definition.participants.join(', ')}`,
      `3. Implement pattern structure`,
      `4. Test pattern integration`,
      `5. Validate pattern effectiveness`
    ];
  }

  /**
   * Validate pattern
   */
  private validatePattern(pattern: PatternLibraryEntry): void {
    if (!pattern.id || !pattern.name) {
      throw new Error('Pattern must have id and name');
    }
    
    if (!pattern.signature.codeExample) {
      throw new Error('Pattern must have code example');
    }
  }

  /**
   * Get line number from index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Load built-in patterns
   */
  private loadBuiltInPatterns(): void {
    // Singleton pattern
    this.patterns.set('singleton', {
      id: 'singleton',
      name: 'Singleton',
      category: PatternCategory.DESIGN,
      description: 'Ensure a class has only one instance and provide global access to it',
      maturity: PatternMaturity.MATURE,
      definition: {
        intent: 'Ensure a class has only one instance',
        motivation: 'Control access to shared resource, reduce memory usage',
        structure: 'Class with private constructor and static instance',
        participants: ['Singleton class', 'Static getInstance method'],
        collaborations: 'Clients access instance through getInstance()',
        consequences: [
          '✅ Controlled access to sole instance',
          '✅ Reduced namespace pollution',
          '❌ Difficult to test',
          '❌ Violates Single Responsibility Principle'
        ]
      },
      signature: {
        language: ['typescript', 'javascript', 'java', 'python'],
        syntaxPattern: /class\s+\w+\s*\{[\s\S]*?private\s+static\s+instance[\s\S]*?public\s+static\s+getInstance\(\)/,
        semanticFeatures: ['single-instance', 'global-access', 'lazy-initialization'],
        codeExample: `class Singleton {
  private static instance: Singleton;
  private constructor() {}
  
  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}`
      },
      quality: {
        effectiveness: 0.85,
        popularity: 0.90,
        successRate: 0.80,
        complexity: 30,
        learningCurve: 'LOW'
      },
      relationships: {
        relatedPatterns: ['factory', 'builder'],
        alternatives: ['dependency-injection'],
        complementaryPatterns: ['factory'],
        conflictsWith: []
      },
      context: {
        applicableScenarios: ['Database connections', 'Configuration managers', 'Logging'],
        notApplicableScenarios: ['Multiple instances needed', 'Parallel execution'],
        prerequisites: ['Private constructor support'],
        commonMistakes: ['Not thread-safe', 'Overuse for global state']
      },
      evolution: {
        firstSeen: new Date('2020-01-01'),
        lastSeen: new Date(),
        occurrences: 0,
        versions: []
      },
      tags: ['creational', 'classic', 'gof'],
      references: [
        'Design Patterns: Elements of Reusable Object-Oriented Software (GoF)',
        'https://refactoring.guru/design-patterns/singleton'
      ],
      examples: []
    });
    
    // Factory pattern
    this.patterns.set('factory', {
      id: 'factory',
      name: 'Factory Method',
      category: PatternCategory.DESIGN,
      description: 'Define interface for creating objects, let subclasses decide which class to instantiate',
      maturity: PatternMaturity.MATURE,
      definition: {
        intent: 'Define interface for creating objects',
        motivation: 'Delegate instantiation to subclasses',
        structure: 'Creator class with factory method, Concrete creators, Products',
        participants: ['Creator', 'ConcreteCreator', 'Product', 'ConcreteProduct'],
        collaborations: 'Creator calls factory method to create Product',
        consequences: [
          '✅ Eliminates tight coupling',
          '✅ Single Responsibility Principle',
          '✅ Open/Closed Principle',
          '❌ Code becomes more complicated'
        ]
      },
      signature: {
        language: ['typescript', 'javascript', 'java', 'python'],
        syntaxPattern: /(?:function|method)\s+create\w*\([\s\S]*?\)[\s\S]*?\{[\s\S]*?return\s+new\s+/,
        semanticFeatures: ['object-creation', 'abstraction', 'delegation'],
        codeExample: `interface Product {
  operation(): string;
}

class ConcreteProductA implements Product {
  operation(): string { return 'ProductA'; }
}

abstract class Creator {
  abstract factoryMethod(): Product;
  
  someOperation(): string {
    const product = this.factoryMethod();
    return product.operation();
  }
}

class ConcreteCreatorA extends Creator {
  factoryMethod(): Product {
    return new ConcreteProductA();
  }
}`
      },
      quality: {
        effectiveness: 0.90,
        popularity: 0.95,
        successRate: 0.85,
        complexity: 50,
        learningCurve: 'MEDIUM'
      },
      relationships: {
        relatedPatterns: ['abstract-factory', 'prototype'],
        alternatives: ['builder'],
        complementaryPatterns: ['singleton'],
        conflictsWith: []
      },
      context: {
        applicableScenarios: ['Product families', 'Complex object creation', 'Plugin systems'],
        notApplicableScenarios: ['Simple object creation', 'Single product type'],
        prerequisites: ['Inheritance support', 'Interface/abstract class'],
        commonMistakes: ['Overengineering simple creation', 'Too many factory methods']
      },
      evolution: {
        firstSeen: new Date('2020-01-01'),
        lastSeen: new Date(),
        occurrences: 0,
        versions: []
      },
      tags: ['creational', 'classic', 'gof'],
      references: [
        'Design Patterns: Elements of Reusable Object-Oriented Software (GoF)',
        'https://refactoring.guru/design-patterns/factory-method'
      ],
      examples: []
    });
    
    // Add more built-in patterns...
  }

  /**
   * Load custom patterns from file system
   */
  private async loadCustomPatterns(): Promise<void> {
    try {
      const patternsPath = path.join(this.config.libraryPath, 'patterns.json');
      const content = await fs.readFile(patternsPath, 'utf-8');
      const customPatterns: PatternLibraryEntry[] = JSON.parse(content);
      
      for (const pattern of customPatterns) {
        this.patterns.set(pattern.id, pattern);
      }
      
      console.log(`✅ Loaded ${customPatterns.length} custom patterns`);
    } catch {
      console.log('⚠️  No custom patterns found');
    }
  }

  /**
   * Save pattern to file system
   */
  private async savePattern(pattern: PatternLibraryEntry): Promise<void> {
    const patternsPath = path.join(this.config.libraryPath, 'patterns.json');
    
    // Read existing patterns
    let patterns: PatternLibraryEntry[] = [];
    try {
      const content = await fs.readFile(patternsPath, 'utf-8');
      patterns = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }
    
    // Update or add pattern
    const index = patterns.findIndex(p => p.id === pattern.id);
    if (index >= 0) {
      patterns[index] = pattern;
    } else {
      patterns.push(pattern);
    }
    
    // Save
    await fs.mkdir(this.config.libraryPath, { recursive: true });
    await fs.writeFile(patternsPath, JSON.stringify(patterns, null, 2));
  }
}

/**
 * Convenience function to discover patterns
 */
export async function discoverPatterns(
  codeFiles: Array<{ path: string; content: string; language: string }>
): Promise<PatternDiscoveryResult[]> {
  const builder = new PatternLibraryBuilder();
  await builder.initialize();
  return builder.discoverPatterns(codeFiles);
}
