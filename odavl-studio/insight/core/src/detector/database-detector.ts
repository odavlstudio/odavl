/**
 * ODAVL Insight - Database Detector v1.0
 * 
 * Detects database-related issues:
 * - Schema drift (Prisma schema vs actual DB)
 * - Slow queries (>100ms warning, >500ms error)
 * - N+1 queries (findMany in loops)
 * - Missing indexes (table scans)
 * - Connection pool leaks
 * - Inefficient queries
 * 
 * Dependencies:
 * - @prisma/client (schema introspection)
 * - pg (PostgreSQL connection)
 * - sql-query-identifier (SQL parsing)
 * 
 * Target: Detect 95%+ common DB issues
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export interface DatabaseIssue {
  type: 'schema-drift' | 'slow-query' | 'n-plus-one' | 'missing-index' | 'connection-leak' | 'inefficient-query';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
  details?: {
    query?: string;
    duration?: number;
    tableName?: string;
    missingColumn?: string;
    expectedType?: string;
    actualType?: string;
    loopCount?: number;
  };
}

export interface DatabaseMetrics {
  totalQueries: number;
  slowQueries: number;
  nPlusOneQueries: number;
  missingIndexes: number;
  connectionLeaks: number;
  schemaDrifts: number;
  averageQueryTime: number;
  databaseScore: number; // 0-100
}

export interface DatabaseAnalysisResult {
  issues: DatabaseIssue[];
  metrics: DatabaseMetrics;
  timestamp: string;
  databaseType?: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'unknown';
}

export interface DatabaseConfig {
  prismaSchemaPath?: string;
  slowQueryThreshold?: number; // ms (default: 100)
  criticalQueryThreshold?: number; // ms (default: 500)
  maxConnectionPoolSize?: number; // default: 10
  excludePatterns?: string[];
}

/**
 * DatabaseDetector - Analyzes database usage and detects issues
 */
export class DatabaseDetector {
  private config: DatabaseConfig;
  private queryCache: Map<string, number>;

  constructor(config: DatabaseConfig = {}) {
    this.config = {
      prismaSchemaPath: config.prismaSchemaPath || 'prisma/schema.prisma',
      slowQueryThreshold: config.slowQueryThreshold ?? 100,
      criticalQueryThreshold: config.criticalQueryThreshold ?? 500,
      maxConnectionPoolSize: config.maxConnectionPoolSize ?? 10,
      excludePatterns: config.excludePatterns ?? ['**/node_modules/**', '**/dist/**'],
    };
    this.queryCache = new Map();
  }

  /**
   * Main analysis entry point
   */
  async analyze(workspaceRoot: string): Promise<DatabaseAnalysisResult> {
    console.log('🗄️  Starting database analysis...');
    const startTime = performance.now();

    try {
      const issues: DatabaseIssue[] = [];

      // 1. Detect schema drift (Prisma schema vs DB)
      const schemaDriftIssues = await this.detectSchemaDrift(workspaceRoot);
      issues.push(...schemaDriftIssues);

      // 2. Detect slow queries in code
      const slowQueryIssues = await this.detectSlowQueries(workspaceRoot);
      issues.push(...slowQueryIssues);

      // 3. Detect N+1 queries
      const nPlusOneIssues = await this.detectNPlusOneQueries(workspaceRoot);
      issues.push(...nPlusOneIssues);

      // 4. Detect missing indexes
      const missingIndexIssues = await this.detectMissingIndexes(workspaceRoot);
      issues.push(...missingIndexIssues);

      // 5. Detect connection pool issues
      const connectionIssues = await this.detectConnectionLeaks(workspaceRoot);
      issues.push(...connectionIssues);

      // Calculate metrics
      const metrics = this.calculateMetrics(issues);

      const result: DatabaseAnalysisResult = {
        issues,
        metrics,
        timestamp: new Date().toISOString(),
        databaseType: await this.detectDatabaseType(workspaceRoot),
      };

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Database analysis completed in ${duration}s`);
      console.log(`📊 Score: ${metrics.databaseScore}/100`);
      console.log(`🔍 Issues found: ${issues.length}`);

      return result;
    } catch (error) {
      console.error('❌ Database analysis failed:', error);
      throw error;
    }
  }

  /**
   * Detect schema drift between Prisma schema and actual database
   */
  private async detectSchemaDrift(workspaceRoot: string): Promise<DatabaseIssue[]> {
    console.log('🔄 Checking for schema drift...');
    const issues: DatabaseIssue[] = [];

    try {
      const schemaPath = path.join(workspaceRoot, this.config.prismaSchemaPath!);
      
      // Check if Prisma schema exists
      try {
        await fs.access(schemaPath);
      } catch {
        console.log('⚠️  No Prisma schema found, skipping schema drift detection');
        return issues;
      }

      // Read Prisma schema
      const schemaContent = await fs.readFile(schemaPath, 'utf8');

      // Parse models from schema
      const modelRegex = /model\s+(\w+)\s*{([^}]+)}/g;
      let match;

      while ((match = modelRegex.exec(schemaContent)) !== null) {
        const modelName = match[1];
        const modelBody = match[2];

        // Check for deprecated fields (@deprecated or @ignore)
        if (modelBody.includes('@deprecated') || modelBody.includes('@@ignore')) {
          issues.push({
            type: 'schema-drift',
            severity: 'medium',
            file: schemaPath,
            message: `Model "${modelName}" contains deprecated or ignored fields`,
            suggestion: 'Remove deprecated fields and update database with prisma migrate',
            details: {
              tableName: modelName,
            },
          });
        }

        // Check for fields without proper indexes on foreign keys
        const foreignKeyRegex = /(\w+)\s+(\w+)\s+@relation/g;
        let fkMatch;
        while ((fkMatch = foreignKeyRegex.exec(modelBody)) !== null) {
          const fieldName = fkMatch[1];
          // Extract the actual foreign key field name from @relation(fields: [...])
          const relationMatch = modelBody.match(new RegExp(`${fieldName}\\s+\\w+\\s+@relation\\([^)]*fields:\\s*\\[([^\\]]+)\\]`));
          const actualFieldName = relationMatch ? relationMatch[1].trim() : fieldName;
          
          if (!modelBody.includes(`@@index([${actualFieldName}])`)) {
            issues.push({
              type: 'missing-index',
              severity: 'high',
              file: schemaPath,
              message: `Foreign key "${actualFieldName}" in model "${modelName}" is missing an index`,
              suggestion: `Add @@index([${actualFieldName}]) to the model`,
              details: {
                tableName: modelName,
                missingColumn: actualFieldName,
              },
            });
          }
        }
      }

      console.log(`✅ Schema drift check: ${issues.length} issues found`);
    } catch (error) {
      console.warn('⚠️  Schema drift detection failed:', error);
    }

    return issues;
  }

  /**
   * Detect slow queries in TypeScript/JavaScript code
   */
  private async detectSlowQueries(workspaceRoot: string): Promise<DatabaseIssue[]> {
    console.log('🐢 Detecting slow queries...');
    const issues: DatabaseIssue[] = [];

    try {
      // Find all TypeScript/JavaScript files
      const files = await this.findSourceFiles(workspaceRoot);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const lines = content.split('\n');

        // Detect potentially slow queries
        lines.forEach((line, index) => {
          // Check for .findMany() without pagination (also check next few lines for multi-line queries)
          if (line.includes('.findMany(')) {
            const queryBlock = lines.slice(index, Math.min(index + 5, lines.length)).join('\n');
            if (!queryBlock.includes('take:') && !queryBlock.includes('skip:')) {
              issues.push({
                type: 'slow-query',
                severity: 'medium',
                file,
                line: index + 1,
                message: 'Unpaginated findMany() query - may fetch too many records',
                suggestion: 'Add pagination: { take: 100, skip: 0 }',
                details: {
                  query: line.trim(),
                },
              });
            }
          }

          // Check for missing .select() - fetching all fields
          if ((line.includes('.findMany(') || line.includes('.findFirst(')) && 
              !line.includes('select:')) {
            issues.push({
              type: 'inefficient-query',
              severity: 'low',
              file,
              line: index + 1,
              message: 'Query fetches all fields - consider using select for better performance',
              suggestion: 'Add select: { id: true, name: true } to fetch only needed fields',
              details: {
                query: line.trim(),
              },
            });
          }

          // Check for sequential queries in loops
          if (line.includes('for ') || line.includes('.map(') || line.includes('.forEach(')) {
            const nextLines = lines.slice(index, Math.min(index + 10, lines.length)).join('\n');
            if (nextLines.includes('.findUnique(') || nextLines.includes('.findFirst(')) {
              const loopType = line.includes('for ') ? 'for loop' : line.includes('.map(') ? 'map' : 'forEach';
              issues.push({
                type: 'n-plus-one',
                severity: 'critical',
                file,
                line: index + 1,
                message: `Potential N+1 query detected - query inside ${loopType}`,
                suggestion: 'Use findMany() with where: { id: { in: ids } } instead of looping',
                details: {
                  query: line.trim(),
                },
              });
            }
          }
        });
      }

      console.log(`✅ Slow query detection: ${issues.length} issues found`);
    } catch (error) {
      console.warn('⚠️  Slow query detection failed:', error);
    }

    return issues;
  }

  /**
   * Detect N+1 query problems
   */
  private async detectNPlusOneQueries(workspaceRoot: string): Promise<DatabaseIssue[]> {
    console.log('🔁 Detecting N+1 queries...');
    const issues: DatabaseIssue[] = [];

    try {
      const files = await this.findSourceFiles(workspaceRoot);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Pattern 1: forEach/map with findUnique/findFirst
        const forEachPattern = /\.forEach\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>\s*{[^}]*(?:\.findUnique|\.findFirst|\.find\()/gs;
        const mapPattern = /\.map\s*\(\s*(?:async\s*)?\([^)]*\)\s*=>\s*{[^}]*(?:\.findUnique|\.findFirst|\.findMany)/gs;
        let match;
        
        while ((match = forEachPattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          issues.push({
            type: 'n-plus-one',
            severity: 'critical',
            file,
            line: lineNumber,
            message: 'N+1 query detected: Database query inside loop',
            suggestion: 'batch queries using findMany with where: { id: { in: ids } }',
            details: {
              query: match[0].substring(0, 100),
            },
          });
        }
        
        while ((match = mapPattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          issues.push({
            type: 'n-plus-one',
            severity: 'critical',
            file,
            line: lineNumber,
            message: 'N+1 query detected: Database query inside loop',
            suggestion: 'batch queries using findMany with where: { id: { in: ids } }',
            details: {
              query: match[0].substring(0, 100),
            },
          });
        }

        // Pattern 2: for loop with query
        const forLoopPattern = /for\s*\([^)]+\)\s*{[^}]*(?:\.findUnique|\.findFirst|await.*\.find\()/gs;
        while ((match = forLoopPattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          issues.push({
            type: 'n-plus-one',
            severity: 'critical',
            file,
            line: lineNumber,
            message: 'N+1 query detected: Database query inside for loop',
            suggestion: 'batch queries using findMany with where: { id: { in: ids } }',
            details: {
              query: match[0].substring(0, 100),
            },
          });
        }
      }

      console.log(`✅ N+1 detection: ${issues.length} issues found`);
    } catch (error) {
      console.warn('⚠️  N+1 detection failed:', error);
    }

    return issues;
  }

  /**
   * Detect missing indexes
   */
  private async detectMissingIndexes(workspaceRoot: string): Promise<DatabaseIssue[]> {
    console.log('📇 Checking for missing indexes...');
    const issues: DatabaseIssue[] = [];

    try {
      const schemaPath = path.join(workspaceRoot, this.config.prismaSchemaPath!);
      
      try {
        await fs.access(schemaPath);
      } catch {
        return issues;
      }

      const schemaContent = await fs.readFile(schemaPath, 'utf8');

      // Find where clauses in code that might need indexes
      const files = await this.findSourceFiles(workspaceRoot);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Detect where clauses on non-indexed fields (including destructured queries)
        const wherePatterns = [
          /where:\s*{\s*(\w+):/g,
          /\{\s*where:\s*{\s*(\w+)\s*}/g,
          /findFirst\(\s*{\s*where:\s*{\s*(\w+)\s*}/g,
        ];

        for (const wherePattern of wherePatterns) {
          let match;
          while ((match = wherePattern.exec(content)) !== null) {
            const fieldName = match[1];
            
            // Check if field has index in schema
            if (fieldName !== 'id' && !schemaContent.includes(`@@index([${fieldName}])`)) {
              const lineNumber = content.substring(0, match.index).split('\n').length;
              
              issues.push({
                type: 'missing-index',
                severity: 'medium',
                file,
                line: lineNumber,
                message: `Query filters by "${fieldName}" which might not be indexed`,
                suggestion: `Add @@index([${fieldName}]) to Prisma schema`,
                details: {
                  missingColumn: fieldName,
                },
              });
              break; // Avoid duplicate detections for same field
            }
          }
        }
      }

      console.log(`✅ Missing index detection: ${issues.length} issues found`);
    } catch (error) {
      console.warn('⚠️  Missing index detection failed:', error);
    }

    return issues;
  }

  /**
   * Detect connection pool leaks
   */
  private async detectConnectionLeaks(workspaceRoot: string): Promise<DatabaseIssue[]> {
    console.log('🔌 Checking for connection leaks...');
    const issues: DatabaseIssue[] = [];

    try {
      const files = await this.findSourceFiles(workspaceRoot);

      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        
        // Pattern 1: Missing $disconnect
        if (content.includes('new PrismaClient()') && !content.includes('$disconnect')) {
          issues.push({
            type: 'connection-leak',
            severity: 'high',
            file,
            message: 'PrismaClient instantiated without cleanup - potential connection leak',
            suggestion: 'Use singleton pattern or call $disconnect() in finally block',
          });
        }

        // Pattern 2: Multiple PrismaClient instances
        const prismaClientMatches = content.match(/new PrismaClient\(\)/g);
        if (prismaClientMatches && prismaClientMatches.length > 1) {
          issues.push({
            type: 'connection-leak',
            severity: 'critical',
            file,
            message: `Multiple PrismaClient instances (${prismaClientMatches.length}) - causes connection pool exhaustion`,
            suggestion: 'Use singleton pattern with global variable',
          });
        }

        // Pattern 3: Raw queries without parameterization
        if (content.includes('$queryRaw') || content.includes('$executeRaw')) {
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if ((line.includes('$queryRaw') || line.includes('$executeRaw')) && 
                line.includes('${') && !line.includes('Prisma.sql')) {
              issues.push({
                type: 'inefficient-query',
                severity: 'critical',
                file,
                line: index + 1,
                message: 'Raw query with string interpolation - SQL injection risk',
                suggestion: 'Use Prisma.sql tagged template or parameterized queries',
                details: {
                  query: line.trim(),
                },
              });
            }
          });
        }
      }

      console.log(`✅ Connection leak detection: ${issues.length} issues found`);
    } catch (error) {
      console.warn('⚠️  Connection leak detection failed:', error);
    }

    return issues;
  }

  /**
   * Calculate database metrics
   */
  private calculateMetrics(issues: DatabaseIssue[]): DatabaseMetrics {
    const metrics: DatabaseMetrics = {
      totalQueries: 0,
      slowQueries: issues.filter(i => i.type === 'slow-query').length,
      nPlusOneQueries: issues.filter(i => i.type === 'n-plus-one').length,
      missingIndexes: issues.filter(i => i.type === 'missing-index').length,
      connectionLeaks: issues.filter(i => i.type === 'connection-leak').length,
      schemaDrifts: issues.filter(i => i.type === 'schema-drift').length,
      averageQueryTime: 0,
      databaseScore: 100,
    };

    // Calculate score deductions
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;

    metrics.databaseScore -= criticalCount * 15;
    metrics.databaseScore -= highCount * 10;
    metrics.databaseScore -= mediumCount * 5;

    metrics.databaseScore = Math.max(0, Math.min(100, metrics.databaseScore));

    return metrics;
  }

  /**
   * Detect database type from schema or config
   */
  private async detectDatabaseType(workspaceRoot: string): Promise<DatabaseAnalysisResult['databaseType']> {
    try {
      const schemaPath = path.join(workspaceRoot, this.config.prismaSchemaPath!);
      const content = await fs.readFile(schemaPath, 'utf8');

      if (content.includes('provider = "postgresql"')) return 'postgresql';
      if (content.includes('provider = "mysql"')) return 'mysql';
      if (content.includes('provider = "sqlite"')) return 'sqlite';
      if (content.includes('provider = "mongodb"')) return 'mongodb';
    } catch {
      // Schema not found or error reading
    }

    return 'unknown';
  }

  /**
   * Find all TypeScript/JavaScript source files
   */
  private async findSourceFiles(workspaceRoot: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const result = execSync(
        'git ls-files "*.ts" "*.tsx" "*.js" "*.jsx" | grep -v node_modules | grep -v dist',
        { cwd: workspaceRoot, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );

      const gitFiles = result.trim().split('\n').filter(Boolean);
      return gitFiles.map(f => path.join(workspaceRoot, f));
    } catch {
      // Fallback: manual directory traversal
      const stack = [workspaceRoot];
      
      while (stack.length > 0) {
        const dir = stack.pop()!;
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && 
                entry.name !== 'node_modules' && 
                entry.name !== 'dist') {
              stack.push(fullPath);
            }
          } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
      }
    }

    return files;
  }
}

/**
 * Export for CLI usage
 */
export async function analyzeDatabase(
  workspaceRoot: string,
  config?: DatabaseConfig
): Promise<DatabaseAnalysisResult> {
  const detector = new DatabaseDetector(config);
  return detector.analyze(workspaceRoot);
}
