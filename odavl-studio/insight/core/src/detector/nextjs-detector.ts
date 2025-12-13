/**
 * ODAVL Insight - Next.js Detector v1.0
 * 
 * Detects Next.js 13/14 App Router-specific issues:
 * - Hydration mismatches (Date.now, Math.random in components)
 * - Server Actions issues ('use server' validation)
 * - Suspense boundary problems (missing Suspense, nested boundaries)
 * - Client/Server boundary violations ('use client' misuse)
 * - Data fetching anti-patterns
 * 
 * Implementation: Regex-based pattern matching (fast, zero dependencies)
 * Status: Experimental - Enable with ODAVL_NEXTJS_DETECTOR=1
 * 
 * Target: Detect 95%+ Next.js App Router issues
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface NextJSIssue {
  type: 'hydration-mismatch' | 'server-action' | 'suspense-boundary' | 'client-server-boundary' | 'data-fetching';
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
  category?: string;
  details?: {
    pattern?: string;
    component?: string;
    directive?: string;
    expectedLocation?: string;
    actualUsage?: string;
    displayName?: string;
  };
}

export interface NextJSMetrics {
  totalFiles: number;
  componentsAnalyzed: number;
  hydrationIssues: number;
  serverActionIssues: number;
  suspenseIssues: number;
  boundaryViolations: number;
  dataFetchingIssues: number;
  nextjsScore: number; // 0-100
}

export interface NextJSAnalysisResult {
  issues: NextJSIssue[];
  metrics: NextJSMetrics;
  timestamp: string;
  nextVersion?: string;
  appDirectory?: boolean; // App Router vs Pages Router
}

export interface NextJSConfig {
  appDir?: string; // Path to app directory (default: 'app')
  pagesDir?: string; // Path to pages directory (default: 'pages')
  excludePatterns?: string[];
  checkHydration?: boolean;
  checkServerActions?: boolean;
  checkSuspense?: boolean;
  checkBoundaries?: boolean;
}

/**
 * NextJSDetector - Analyzes Next.js/React code for common issues
 */
export class NextJSDetector {
  private config: NextJSConfig;
  private issuesCache: Map<string, NextJSIssue[]>;

  constructor(config: NextJSConfig = {}) {
    this.config = {
      appDir: config.appDir || 'app',
      pagesDir: config.pagesDir || 'pages',
      excludePatterns: config.excludePatterns ?? ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      checkHydration: config.checkHydration ?? true,
      checkServerActions: config.checkServerActions ?? true,
      checkSuspense: config.checkSuspense ?? true,
      checkBoundaries: config.checkBoundaries ?? true,
    };
    this.issuesCache = new Map();
  }

  /**
   * Main analysis entry point
   */
  async analyze(workspaceRoot: string): Promise<NextJSAnalysisResult> {
    console.log('⚛️  Starting Next.js analysis...');
    const startTime = performance.now();

    try {
      const issues: NextJSIssue[] = [];

      // Detect Next.js version and architecture
      const nextVersion = await this.detectNextVersion(workspaceRoot);
      const appDirectory = await this.hasAppDirectory(workspaceRoot);

      console.log(`🔍 Detected Next.js ${nextVersion || 'unknown'}, App Router: ${appDirectory}`);

      // Find all relevant files
      const files = await this.findNextJSFiles(workspaceRoot);
      console.log(`📁 Found ${files.length} Next.js files to analyze`);

      // 1. Detect hydration mismatches
      if (this.config.checkHydration) {
        console.log('💧 Checking for hydration mismatches...');
        const hydrationIssues = await this.detectHydrationMismatches(files);
        issues.push(...hydrationIssues);
        console.log(`✅ Hydration check: ${hydrationIssues.length} issues found`);
      }

      // 2. Detect Server Actions issues
      if (this.config.checkServerActions && appDirectory) {
        console.log('🔧 Checking Server Actions...');
        const serverActionIssues = await this.detectServerActionIssues(files);
        issues.push(...serverActionIssues);
        console.log(`✅ Server Actions check: ${serverActionIssues.length} issues found`);
      }

      // 3. Detect Suspense boundary issues
      if (this.config.checkSuspense && appDirectory) {
        console.log('⏳ Checking Suspense boundaries...');
        const suspenseIssues = await this.detectSuspenseIssues(files, workspaceRoot);
        issues.push(...suspenseIssues);
        console.log(`✅ Suspense check: ${suspenseIssues.length} issues found`);
      }

      // 4. Detect Client/Server boundary violations
      if (this.config.checkBoundaries) {
        console.log('🔀 Checking Client/Server boundaries...');
        const boundaryIssues = await this.detectBoundaryViolations(files);
        issues.push(...boundaryIssues);
        console.log(`✅ Boundary check: ${boundaryIssues.length} issues found`);
      }

      // Calculate metrics
      const metrics = this.calculateMetrics(issues, files.length);

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Next.js analysis completed in ${duration}s`);
      console.log(`📊 Score: ${metrics.nextjsScore}/100`);
      console.log(`🔍 Issues found: ${issues.length}`);

      return {
        issues,
        metrics,
        timestamp: new Date().toISOString(),
        nextVersion,
        appDirectory,
      };
    } catch (error) {
      console.error('❌ Next.js analysis failed:', error);
      throw error;
    }
  }

  /**
   * Detect Next.js version from package.json
   */
  private async detectNextVersion(workspaceRoot: string): Promise<string | undefined> {
    try {
      const packageJsonPath = path.join(workspaceRoot, 'package.json');
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;
      return nextVersion?.replace(/[\^~]/, ''); // Remove ^ or ~
    } catch {
      return undefined;
    }
  }

  /**
   * Check if project uses App Router
   */
  private async hasAppDirectory(workspaceRoot: string): Promise<boolean> {
    try {
      const appDirPath = path.join(workspaceRoot, this.config.appDir!);
      await fs.access(appDirPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find all Next.js files (components, pages, app routes)
   */
  private async findNextJSFiles(workspaceRoot: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];

    const scanDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(workspaceRoot, fullPath).replace(/\\/g, '/');

          // Check exclude patterns
          if (this.config.excludePatterns!.some(pattern => this.matchPattern(relativePath, pattern))) {
            continue;
          }

          // Also skip node_modules directories explicitly
          if (entry.isDirectory() && entry.name === 'node_modules') {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    };

    await scanDir(workspaceRoot);
    return files;
  }

  /**
   * Simple glob pattern matcher
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    // Normalize path to forward slashes for consistent matching
    const normalizedPath = filePath.replace(/\\/g, '/');
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(regexPattern).test(normalizedPath);
  }

  /**
   * Detect hydration mismatches
   * 
   * Patterns:
   * - Date.now() in component body
   * - Math.random() in component body
   * - new Date() without ISO string
   * - useEffect without deps causing re-render
   * - window, document, localStorage in render
   */
  private async detectHydrationMismatches(files: string[]): Promise<NextJSIssue[]> {
    const issues: NextJSIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        // Pattern 1: Date.now() in component
        const dateNowPattern = /Date\.now\(\)/g;
        let match;
        while ((match = dateNowPattern.exec(content)) !== null) {
          const line = this.getLineNumber(content, match.index);
          issues.push({
            type: 'hydration-mismatch',
            severity: 'high',
            file,
            line,
            message: 'Date.now() causes hydration mismatch between server and client',
            suggestion: 'Use useState(() => Date.now()) or useEffect to set the date on client',
            details: {
              pattern: 'Date.now()',
              component: this.extractComponentName(content, match.index),
            },
          });
        }

        // Pattern 2: Math.random() in component
        const randomPattern = /Math\.random\(\)/g;
        while ((match = randomPattern.exec(content)) !== null) {
          const line = this.getLineNumber(content, match.index);
          issues.push({
            type: 'hydration-mismatch',
            severity: 'high',
            file,
            line,
            message: 'Math.random() causes hydration mismatch between server and client',
            suggestion: 'Use useState(() => Math.random()) or generate ID on client-side only',
            details: {
              pattern: 'Math.random()',
              component: this.extractComponentName(content, match.index),
            },
          });
        }

        // Pattern 3: window, document, localStorage access in render
        const browserAPIs = ['window\\.', 'document\\.', 'localStorage', 'sessionStorage', 'navigator\\.'];
        for (const api of browserAPIs) {
          const apiPattern = new RegExp(api, 'g');
          while ((match = apiPattern.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            
            // Skip if it's inside useEffect, componentDidMount, or typeof check
            const context = content.slice(Math.max(0, match.index - 200), match.index + 100);
            if (context.includes('useEffect') || 
                context.includes('componentDidMount') ||
                context.includes('typeof window') ||
                context.includes('typeof document')) {
              continue;
            }

            issues.push({
              type: 'hydration-mismatch',
              severity: 'medium',
              file,
              line,
              message: `Browser API ${api.replace(/\\/g, '')} access may cause hydration issues`,
              suggestion: 'Use useEffect or check "typeof window !== \'undefined\'" before accessing',
              details: {
                pattern: api.replace(/\\/g, ''),
                component: this.extractComponentName(content, match.index),
              },
            });
          }
        }

        // Pattern 4: suppressHydrationWarning without good reason
        const suppressPattern = /suppressHydrationWarning/g;
        while ((match = suppressPattern.exec(content)) !== null) {
          const line = this.getLineNumber(content, match.index);
          issues.push({
            type: 'hydration-mismatch',
            severity: 'low',
            file,
            line,
            message: 'suppressHydrationWarning should only be used for intentional mismatches (e.g., dates)',
            suggestion: 'Fix the actual hydration issue instead of suppressing the warning',
            details: {
              pattern: 'suppressHydrationWarning',
            },
          });
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return issues;
  }

  /**
   * Detect Server Actions issues
   * 
   * Patterns:
   * - 'use server' directive validation
   * - Functions with non-serializable params/returns
   * - Missing CSRF protection
   * - Async functions without 'use server' in actions file
   */
  private async detectServerActionIssues(files: string[]): Promise<NextJSIssue[]> {
    const issues: NextJSIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Check if file has 'use server' directive (must be at start of line, not in comment)
        const useServerPattern = /^\s*['"]use server['"]/m;
        const hasUseServer = useServerPattern.test(content);

        if (hasUseServer) {
          // Pattern 1: Validate it's at the top of file or function
          const useServerPattern = /['"]use server['"]/g;
          let match;
          while ((match = useServerPattern.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            const beforeDirective = content.slice(0, match.index).trim();
            
            // Should be at top of file or inside function
            if (beforeDirective && !beforeDirective.endsWith('{') && !beforeDirective.startsWith('export')) {
              issues.push({
                type: 'server-action',
                severity: 'high',
                file,
                line,
                message: "'use server' must be at the top of file or top of function body",
                suggestion: "Move 'use server' directive to the correct location",
                details: {
                  directive: 'use server',
                  expectedLocation: 'Top of file or function body',
                },
              });
            }
          }

          // Pattern 2: Check for functions with Function type params
          const functionParamPattern = /function\s+\w+\s*\([^)]*Function[^)]*\)/g;
          const tsParamPattern = /:\s*Function\b/g;
          while ((match = functionParamPattern.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            issues.push({
              type: 'server-action',
              severity: 'critical',
              file,
              line,
              message: 'Server Actions cannot accept functions as parameters (not serializable)',
              suggestion: 'Use primitive types or plain objects only',
              details: {
                pattern: 'Function parameter in Server Action',
              },
            });
          }

          // Check for TypeScript Function type parameters
          while ((match = tsParamPattern.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            issues.push({
              type: 'server-action',
              severity: 'critical',
              file,
              line,
              message: 'Server Actions cannot accept Function type parameters (not serializable)',
              suggestion: 'Use specific function signatures or accept primitive types only',
              details: {
                pattern: match[0],
                expectedLocation: 'Server Action',
              },
            });
          }

          // Pattern 3: Check for class instances as params
          const classInstancePattern = /new\s+\w+\(/g;
          while ((match = classInstancePattern.exec(content)) !== null) {
            const line = this.getLineNumber(content, match.index);
            // Check context BEFORE the match for return statement
            const startContext = Math.max(0, match.index - 200);
            const context = content.substring(startContext, match.index + 200);
            
            // Check if it's being returned from a function
            if (context.includes('return ')) {
              issues.push({
                type: 'server-action',
                severity: 'high',
                file,
                line,
                message: 'Server Actions cannot return class instances (not serializable)',
                suggestion: 'Return plain objects or primitives only',
                details: {
                  pattern: 'Class instance in Server Action',
                },
              });
            }
          }
        }

        // Pattern 4: Check for async functions without 'use server' in actions files
        const normalizedPath = file.replace(/\\/g, '/');
        // Check if path contains '/actions/' anywhere or file ends with 'actions.ts/tsx'
        const isActionsFile = normalizedPath.includes('/actions/') || 
                             file.endsWith('actions.ts') || file.endsWith('actions.tsx');
        
        if (isActionsFile && !hasUseServer) {
            const asyncFunctionPattern = /export\s+async\s+function\s+\w+/g;
            const hasAsyncFunction = asyncFunctionPattern.test(content);
            
            if (hasAsyncFunction) {
              issues.push({
                type: 'server-action',
                severity: 'medium',
                file,
                line: 1,
                message: "File in 'actions' directory should have 'use server' directive",
                suggestion: "Add 'use server' at the top of the file",
                details: {
                  directive: 'use server',
                  expectedLocation: 'Top of file',
                },
              });
            }
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return issues;
  }

  /**
   * Detect Suspense boundary issues
   * 
   * Patterns:
   * - Async components without <Suspense>
   * - Nested Suspense boundaries (anti-pattern)
   * - Missing loading.tsx in app directory
   */
  private async detectSuspenseIssues(files: string[], workspaceRoot: string): Promise<NextJSIssue[]> {
    const issues: NextJSIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Pattern 1: Async component without Suspense wrapper
        const asyncComponentPattern = /export\s+default\s+async\s+function\s+\w+/g;
        let match;
        while ((match = asyncComponentPattern.exec(content)) !== null) {
          const line = this.getLineNumber(content, match.index);
          
          // Check if file has corresponding loading.tsx
          const dir = path.dirname(file);
          const loadingFile = path.join(dir, 'loading.tsx');
          const hasLoadingFile = await this.fileExists(loadingFile);

          if (!hasLoadingFile && !content.includes('<Suspense')) {
            issues.push({
              type: 'suspense-boundary',
              severity: 'high',
              file,
              line,
              message: 'Async component should have loading.tsx or be wrapped in <Suspense>',
              suggestion: `Create ${path.relative(workspaceRoot, loadingFile)} or wrap with <Suspense>`,
              details: {
                component: this.extractComponentName(content, match.index),
                expectedLocation: path.relative(workspaceRoot, loadingFile),
              },
            });
          }
        }

        // Pattern 2: Nested Suspense boundaries (performance anti-pattern)
        const suspensePattern = /<Suspense/g;
        const suspenseMatches = [...content.matchAll(suspensePattern)];
        
        if (suspenseMatches.length > 2) {
          issues.push({
            type: 'suspense-boundary',
            severity: 'medium',
            file,
            line: this.getLineNumber(content, suspenseMatches[2].index!),
            message: 'Too many nested Suspense boundaries may hurt performance',
            suggestion: 'Consider combining Suspense boundaries or using a single parent Suspense',
            details: {
              pattern: `${suspenseMatches.length} Suspense boundaries detected`,
            },
          });
        }

        // Pattern 3: Suspense with no fallback
        const suspenseNoFallbackPattern = /<Suspense\s*>/g;
        while ((match = suspenseNoFallbackPattern.exec(content)) !== null) {
          const line = this.getLineNumber(content, match.index);
          issues.push({
            type: 'suspense-boundary',
            severity: 'low',
            file,
            line,
            message: 'Suspense without fallback will show blank screen while loading',
            suggestion: 'Add fallback prop: <Suspense fallback={<Loading />}>',
            details: {
              pattern: '<Suspense> without fallback',
            },
          });
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return issues;
  }

  /**
   * Detect Client/Server boundary violations
   * 
   * Patterns:
   * - 'use client' directive validation
   * - Server-only imports in client components
   * - Client-only APIs in server components
   * - Data fetching in wrong location
   */
  private async detectBoundaryViolations(files: string[]): Promise<NextJSIssue[]> {
    const issues: NextJSIssue[] = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
        const hasUseServer = content.includes("'use server'") || content.includes('"use server"');

        // Pattern 1: Both 'use client' and 'use server' in same file
        if (hasUseClient && hasUseServer) {
          issues.push({
            type: 'client-server-boundary',
            severity: 'critical',
            file,
            line: 1,
            message: "File cannot have both 'use client' and 'use server' directives",
            suggestion: "Split into separate files for client and server code",
            details: {
              directive: 'use client + use server',
            },
          });
        }

        // Pattern 2: Client component importing server-only modules
        if (hasUseClient) {
          const serverOnlyImports = ['fs', 'path', 'crypto', 'child_process', '@prisma/client', 'prisma'];
          for (const module of serverOnlyImports) {
            // Escape special regex characters in module name
            const escapedModule = module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const importPattern = new RegExp(`import.*from\\s+['"]${escapedModule}['"]`, 'g');
            let match;
            while ((match = importPattern.exec(content)) !== null) {
              const line = this.getLineNumber(content, match.index);
              // Use shorter name for @prisma/client for better readability
              const displayName = module === '@prisma/client' ? 'prisma' : module;
              issues.push({
                type: 'client-server-boundary',
                severity: 'critical',
                file,
                line,
                message: `Client component cannot import '${displayName}' (server-only module)`,
                suggestion: `Move server logic to Server Action or API route`,
                details: {
                  pattern: `import from '${module}'`,
                  directive: 'use client',
                  // Also output 'prisma' for @prisma/client for test compatibility
                  displayName: module === '@prisma/client' ? 'prisma' : module,
                },
              });
            }
          }

          // Pattern 3: Client component using server-only APIs
          const serverAPIs = ['prisma\\.', 'execSync', 'readFileSync'];
          for (const api of serverAPIs) {
            const apiPattern = new RegExp(api, 'g');
            let match;
            while ((match = apiPattern.exec(content)) !== null) {
              const line = this.getLineNumber(content, match.index);
              issues.push({
                type: 'client-server-boundary',
                severity: 'high',
                file,
                line,
                message: `Client component cannot use '${api.replace(/\\/g, '')}' (server-only API)`,
                suggestion: 'Use Server Action or API route instead',
                details: {
                  pattern: api.replace(/\\/g, ''),
                  directive: 'use client',
                },
              });
            }
          }
        }

        // Pattern 4: Server component (no 'use client') using client-only hooks
        if (!hasUseClient && !hasUseServer) {
          const clientHooks = ['useState', 'useEffect', 'useLayoutEffect', 'useContext', 'useReducer'];
          for (const hook of clientHooks) {
            const hookPattern = new RegExp(`\\b${hook}\\s*\\(`, 'g');
            let match;
            while ((match = hookPattern.exec(content)) !== null) {
              const line = this.getLineNumber(content, match.index);
              
              // Check if component is exported (likely a component file)
              if (content.includes('export default') || content.includes('export function')) {
                issues.push({
                  type: 'client-server-boundary',
                  severity: 'high',
                  file,
                  line,
                  message: `Server Component cannot use '${hook}' (client-only hook)`,
                  suggestion: "Add 'use client' directive at the top of the file",
                  details: {
                    pattern: hook,
                    expectedLocation: 'Client Component',
                  },
                });
              }
            }
          }
        }

        // Pattern 5: 'use client' in server-only locations
        if (hasUseClient) {
          const serverOnlyLocations = ['/api/', '/middleware', 'layout.ts', 'layout.tsx'];
          const isMiddleware = file.endsWith('middleware.ts') || file.endsWith('middleware.tsx');
          const isServerOnly = serverOnlyLocations.some(loc => file.includes(loc)) || isMiddleware;
          
          if (isServerOnly) {
            issues.push({
              type: 'client-server-boundary',
              severity: 'high',
              file,
              line: 1,
              message: `File in server-only location should not have 'use client'`,
              suggestion: 'Remove \'use client\' or move component to appropriate location',
              details: {
                directive: 'use client',
                actualUsage: 'Server-only location',
              },
            });
          }
        }

      } catch (error) {
        // Skip files that can't be read
      }
    }

    return issues;
  }

  /**
   * Calculate metrics from issues
   */
  private calculateMetrics(issues: NextJSIssue[], totalFiles: number): NextJSMetrics {
    const hydrationIssues = issues.filter(i => i.type === 'hydration-mismatch').length;
    const serverActionIssues = issues.filter(i => i.type === 'server-action').length;
    const suspenseIssues = issues.filter(i => i.type === 'suspense-boundary').length;
    const boundaryViolations = issues.filter(i => i.type === 'client-server-boundary').length;
    const dataFetchingIssues = issues.filter(i => i.type === 'data-fetching').length;

    // Score calculation (base 100, deduct points)
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;

    let score = 100;
    score -= criticalIssues * 15;
    score -= highIssues * 10;
    score -= mediumIssues * 5;
    score = Math.max(0, score); // Don't go below 0

    return {
      totalFiles,
      componentsAnalyzed: totalFiles,
      hydrationIssues,
      serverActionIssues,
      suspenseIssues,
      boundaryViolations,
      dataFetchingIssues,
      nextjsScore: score,
    };
  }

  /**
   * Helper: Get line number from string index
   */
  private getLineNumber(content: string, index: number): number {
    return content.slice(0, index).split('\n').length;
  }

  /**
   * Helper: Extract component name from context
   */
  private extractComponentName(content: string, index: number): string {
    const before = content.slice(Math.max(0, index - 300), index);
    const componentMatch = before.match(/(?:function|const)\s+(\w+)/);
    return componentMatch ? componentMatch[1] : 'Unknown';
  }

  /**
   * Helper: Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Helper function for quick analysis
 */
export async function analyzeNextJS(
  workspaceRoot: string,
  config?: NextJSConfig
): Promise<NextJSAnalysisResult> {
  const detector = new NextJSDetector(config);
  return detector.analyze(workspaceRoot);
}
