/**
 * ODAVL Insight - Plugin SDK v1.0
 * 
 * Official SDK for building ODAVL Insight plugins
 * 
 * Plugin Types:
 * - Detector: Custom detection rules
 * - Analyzer: Advanced analysis methods
 * - Reporter: Custom report formats
 * - Integration: IDE/CI/CD integrations
 * 
 * @example
 * ```typescript
 * import { DetectorPlugin, Issue } from '@odavl-studio/sdk/plugin';
 * 
 * export class MyDetectorPlugin extends DetectorPlugin {
 *   async detect(code: string): Promise<Issue[]> {
 *     return [{ type: 'quality', severity: 'medium', message: 'Issue found' }];
 *   }
 * }
 * ```
 */

// ============================================================
// Core Plugin Types
// ============================================================

// AST types
export type ASTNode = {
  type: string;
  [key: string]: any;
};

export type AST = ASTNode;

export type PluginType = 'detector' | 'analyzer' | 'reporter' | 'integration';

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    url?: string;
  };
  homepage?: string;
  repository?: string;
  license: string;
  type: PluginType;
  keywords: string[];
  
  // Requirements
  engines: {
    odavl: string; // e.g., ">=4.0.0"
    node?: string; // e.g., ">=18.0.0"
  };
  
  // Optional metadata
  icon?: string; // URL or base64
  screenshots?: string[];
  changelog?: string;
  documentation?: string;
}

// ============================================================
// Plugin Context (Provided by ODAVL)
// ============================================================

export interface PluginContext {
  // File information
  file: {
    path: string;
    content: string;
    language: string;
    encoding: string;
    size: number;
  };
  
  // Workspace information
  workspace: {
    root: string;
    name: string;
    type: 'web' | 'mobile' | 'backend' | 'library' | 'cli';
  };
  
  // Configuration
  config: {
    // User's plugin configuration
    get<T = any>(key: string, defaultValue?: T): T;
    set(key: string, value: any): Promise<void>;
    has(key: string): boolean;
  };
  
  // AST access
  ast: {
    parse(code: string, language: string): Promise<AST>;
    traverse(ast: AST, visitor: ASTVisitor): void;
  };
  
  // Utilities
  logger: {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
  };
  
  // Cache
  cache: {
    get<T = any>(key: string): Promise<T | undefined>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
  };
  
  // HTTP client (for API integrations)
  http: {
    get<T = any>(url: string, options?: RequestInit): Promise<T>;
    post<T = any>(url: string, data: any, options?: RequestInit): Promise<T>;
  };
}

// ============================================================
// Issue Type (Detection Result)
// ============================================================

export interface Issue {
  // Core fields (required)
  type: 'security' | 'performance' | 'quality' | 'complexity' | 'style' | 'best-practice';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  
  // Location (required)
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  
  // Details (optional)
  source?: string; // Plugin name
  code?: string; // Issue code (e.g., "SEC001")
  suggestion?: string; // How to fix
  documentation?: string; // URL to docs
  confidence?: number; // 0-100
  fixable?: boolean; // Can Autopilot fix this?
  codeSnippet?: string; // Relevant code
  tags?: string[]; // ["security", "injection"]
  
  // Metadata
  metadata?: Record<string, any>;
}

// ============================================================
// AST Visitor Pattern
// ============================================================

export interface ASTVisitor {
  [nodeType: string]: (node: any) => void | boolean;
  // Examples:
  // FunctionDeclaration?: (node: FunctionNode) => void;
  // CallExpression?: (node: CallNode) => void;
}

// ============================================================
// Base Plugin Class
// ============================================================

export abstract class BasePlugin {
  public metadata: PluginMetadata;
  protected context!: PluginContext;
  
  constructor(metadata: PluginMetadata) {
    this.metadata = metadata;
  }
  
  /**
   * Initialize plugin (called once at startup)
   */
  async onInit(context: PluginContext): Promise<void> {
    this.context = context;
    this.context.logger.info(`Plugin ${this.metadata.name} initialized`);
  }
  
  /**
   * Cleanup plugin (called on shutdown)
   */
  async onDestroy(): Promise<void> {
    this.context.logger.info(`Plugin ${this.metadata.name} destroyed`);
  }
  
  /**
   * Validate plugin configuration
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check required fields
    if (!this.metadata.id) errors.push('Plugin ID is required');
    if (!this.metadata.name) errors.push('Plugin name is required');
    if (!this.metadata.version) errors.push('Plugin version is required');
    if (!this.metadata.type) errors.push('Plugin type is required');
    
    return { valid: errors.length === 0, errors };
  }
}

// ============================================================
// Detector Plugin (Custom Detection Rules)
// ============================================================

export abstract class DetectorPlugin extends BasePlugin {
  constructor(metadata: Omit<PluginMetadata, 'type'>) {
    super({ ...metadata, type: 'detector' });
  }
  
  /**
   * Detect issues in code
   * @param code - Source code to analyze
   * @param filePath - Path to file
   * @returns Array of detected issues
   */
  abstract detect(code: string, filePath: string): Promise<Issue[]>;
  
  /**
   * Optional: Supports file type?
   */
  supports(language: string): boolean {
    return true; // Default: support all languages
  }
  
  /**
   * Optional: Should skip file?
   */
  shouldSkip(filePath: string): boolean {
    // Default: skip test files
    return filePath.includes('.test.') || filePath.includes('.spec.');
  }
}

// ============================================================
// Analyzer Plugin (Advanced Analysis)
// ============================================================

export abstract class AnalyzerPlugin extends BasePlugin {
  constructor(metadata: Omit<PluginMetadata, 'type'>) {
    super({ ...metadata, type: 'analyzer' });
  }
  
  /**
   * Analyze code and return metrics/insights
   */
  abstract analyze(code: string, filePath: string): Promise<AnalysisResult>;
}

export interface AnalysisResult {
  metrics: Record<string, number>; // e.g., { complexity: 15, maintainability: 75 }
  insights: string[]; // Human-readable insights
  recommendations: string[]; // Actionable recommendations
  metadata?: Record<string, any>;
}

// ============================================================
// Reporter Plugin (Custom Report Formats)
// ============================================================

export abstract class ReporterPlugin extends BasePlugin {
  constructor(metadata: Omit<PluginMetadata, 'type'>) {
    super({ ...metadata, type: 'reporter' });
  }
  
  /**
   * Generate report from issues
   */
  abstract generate(issues: Issue[], options?: ReportOptions): Promise<string | Buffer>;
  
  /**
   * Get report file extension (e.g., ".html", ".pdf")
   */
  abstract getExtension(): string;
}

export interface ReportOptions {
  format?: 'json' | 'html' | 'pdf' | 'markdown' | 'sarif';
  title?: string;
  includeMetrics?: boolean;
  includeCharts?: boolean;
  theme?: 'light' | 'dark';
  outputPath?: string;
}

// ============================================================
// Integration Plugin (IDE/CI/CD Integrations)
// ============================================================

export abstract class IntegrationPlugin extends BasePlugin {
  constructor(metadata: Omit<PluginMetadata, 'type'>) {
    super({ ...metadata, type: 'integration' });
  }
  
  /**
   * Connect to external service
   */
  abstract connect(credentials: Record<string, string>): Promise<void>;
  
  /**
   * Send issues to external service
   */
  abstract send(issues: Issue[]): Promise<SendResult>;
  
  /**
   * Disconnect from external service
   */
  async disconnect(): Promise<void> {
    // Optional: cleanup connections
  }
}

export interface SendResult {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
  url?: string; // Link to external service
}

// ============================================================
// Plugin Manager (Used by ODAVL internally)
// ============================================================

export class PluginManager {
  private plugins: Map<string, BasePlugin> = new Map();
  private context: PluginContext;
  
  constructor(context: PluginContext) {
    this.context = context;
  }
  
  /**
   * Register a plugin
   */
  async register(plugin: BasePlugin): Promise<void> {
    // Validate plugin
    const validation = await plugin.validate();
    if (!validation.valid) {
      throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Check if plugin already registered
    if (this.plugins.has(plugin.metadata.id)) {
      throw new Error(`Plugin ${plugin.metadata.id} is already registered`);
    }
    
    // Initialize plugin
    await plugin.onInit(this.context);
    
    // Register
    this.plugins.set(plugin.metadata.id, plugin);
    
    this.context.logger.info(`Registered plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
  }
  
  /**
   * Unregister a plugin
   */
  async unregister(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    
    // Cleanup
    await plugin.onDestroy();
    
    // Unregister
    this.plugins.delete(pluginId);
    
    this.context.logger.info(`Unregistered plugin: ${plugin.metadata.name}`);
  }
  
  /**
   * Get plugin by ID
   */
  get(pluginId: string): BasePlugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Get all plugins of a specific type
   */
  getByType<T extends BasePlugin>(type: PluginType): T[] {
    return Array.from(this.plugins.values())
      .filter(p => p.metadata.type === type) as T[];
  }
  
  /**
   * List all registered plugins
   */
  list(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(p => p.metadata);
  }
  
  /**
   * Run all detector plugins
   */
  async runDetectors(code: string, filePath: string, language: string): Promise<Issue[]> {
    const detectors = this.getByType<DetectorPlugin>('detector');
    const allIssues: Issue[] = [];
    
    for (const detector of detectors) {
      // Skip if detector doesn't support this language
      if (!detector.supports(language)) {
        continue;
      }
      
      // Skip if detector wants to skip this file
      if (detector.shouldSkip(filePath)) {
        continue;
      }
      
      try {
        const issues = await detector.detect(code, filePath);
        
        // Add plugin source to each issue
        for (const issue of issues) {
          if (!issue.source) {
            issue.source = detector.metadata.name;
          }
        }
        
        allIssues.push(...issues);
      } catch (error) {
        this.context.logger.error(`Detector ${detector.metadata.name} failed:`, error);
      }
    }
    
    return allIssues;
  }
  
  /**
   * Cleanup all plugins
   */
  async cleanup(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      await plugin.onDestroy();
    }
    this.plugins.clear();
  }
}

// ============================================================
// Plugin Helper Utilities
// ============================================================

export class PluginHelpers {
  /**
   * Create a basic issue
   */
  static createIssue(
    type: Issue['type'],
    severity: Issue['severity'],
    message: string,
    line: number,
    column: number = 0
  ): Issue {
    return {
      type,
      severity,
      message,
      line,
      column,
    };
  }
  
  /**
   * Check if code matches regex pattern
   */
  static matchPattern(code: string, pattern: RegExp): Array<{ match: string; line: number; column: number }> {
    const matches: Array<{ match: string; line: number; column: number }> = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const regex = new RegExp(pattern, 'g');
      let match;
      
      while ((match = regex.exec(line)) !== null) {
        matches.push({
          match: match[0],
          line: i + 1,
          column: match.index,
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Calculate cyclomatic complexity (simplified)
   */
  static calculateComplexity(code: string): number {
    const keywords = ['if', 'for', 'while', 'case', 'catch', '&&', '||', '?'];
    let complexity = 1; // Base complexity
    
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }
    
    return complexity;
  }
  
  /**
   * Count lines of code (excluding comments and blank lines)
   */
  static countLOC(code: string): { total: number; code: number; comments: number; blank: number } {
    const lines = code.split('\n');
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed === '') {
        blankLines++;
      } else if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }
    
    return {
      total: lines.length,
      code: codeLines,
      comments: commentLines,
      blank: blankLines,
    };
  }
}

// All types and classes are already exported via their declarations
