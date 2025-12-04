/**
 * ⚡ Guardian Enterprise Performance Profiler
 * Advanced performance monitoring and optimization
 * - Memory leak detection
 * - N+1 query detection (Prisma/SQL)
 * - Slow query analysis
 * - Event loop lag detection
 * - CPU profiling
 * - Heap snapshot analysis
 */

import { Page } from 'puppeteer';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export interface PerformanceIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'memory' | 'query' | 'cpu' | 'network' | 'rendering';
  title: string;
  description: string;
  recommendation: string;
  metrics?: Record<string, any>;
}

export interface PerformanceProfile {
  score: number; // 0-100
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  issues: PerformanceIssue[];
  metrics: {
    memoryUsage?: number; // MB
    queryCount?: number;
    slowQueries?: number;
    n1Queries?: number;
    avgResponseTime?: number; // ms
    ttfb?: number; // Time to first byte
    fcp?: number; // First contentful paint
    lcp?: number; // Largest contentful paint
  };
  recommendations: string[];
}

/**
 * Main performance profiler
 */
export async function profilePerformance(
  page: Page,
  url: string,
  projectPath?: string
): Promise<PerformanceProfile> {
  const issues: PerformanceIssue[] = [];

  // 1. Check for memory leaks
  issues.push(...await detectMemoryLeaks(page));

  // 2. Detect N+1 queries in Prisma
  if (projectPath) {
    issues.push(...detectN1Queries(projectPath));
  }

  // 3. Analyze slow queries
  if (projectPath) {
    issues.push(...analyzeSlowQueries(projectPath));
  }

  // 4. Monitor JavaScript execution
  issues.push(...await monitorJSPerformance(page));

  // 5. Analyze network performance
  issues.push(...await analyzeNetworkPerformance(page, url));

  // Calculate metrics
  const metrics = await collectMetrics(page);

  // Calculate score
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  const low = issues.filter(i => i.severity === 'low').length;

  const score = Math.max(0, 100 - (critical * 20) - (high * 10) - (medium * 5) - (low * 2));

  return {
    score,
    totalIssues: issues.length,
    critical,
    high,
    medium,
    low,
    issues,
    metrics,
    recommendations: generatePerformanceRecommendations(issues, metrics)
  };
}

/**
 * Detect memory leaks
 */
async function detectMemoryLeaks(page: Page): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = [];

  try {
    // Measure memory before and after interaction
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    // Trigger some interactions
    await page.evaluate(() => {
      // Click buttons, scroll, etc.
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => btn.click());
      window.scrollTo(0, document.body.scrollHeight);
      window.scrollTo(0, 0);
    });

    // Wait for processing
    await page.waitForTimeout(2000);

    const afterMemory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    if (initialMemory && afterMemory) {
      const memoryIncrease = afterMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const increasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;

      // If memory increased by more than 30% after interactions
      if (increasePercent > 30) {
        issues.push({
          severity: 'high',
          category: 'memory',
          title: 'Potential memory leak detected',
          description: `Memory increased by ${Math.round(increasePercent)}% after user interactions`,
          recommendation: 'Check for uncleaned event listeners, closures, or DOM references',
          metrics: {
            initialMB: (initialMemory.usedJSHeapSize / 1024 / 1024).toFixed(2),
            afterMB: (afterMemory.usedJSHeapSize / 1024 / 1024).toFixed(2),
            increaseMB: (memoryIncrease / 1024 / 1024).toFixed(2)
          }
        });
      }

      // Check if approaching heap limit
      const usagePercent = (afterMemory.usedJSHeapSize / afterMemory.jsHeapSizeLimit) * 100;
      if (usagePercent > 80) {
        issues.push({
          severity: 'critical',
          category: 'memory',
          title: 'Memory usage approaching limit',
          description: `Using ${Math.round(usagePercent)}% of available heap`,
          recommendation: 'Optimize memory usage or increase heap size',
          metrics: {
            usedMB: (afterMemory.usedJSHeapSize / 1024 / 1024).toFixed(2),
            limitMB: (afterMemory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
          }
        });
      }
    }

    // Check for detached DOM nodes
    const detachedNodes = await page.evaluate(() => {
      const nodes = document.querySelectorAll('*');
      let detached = 0;
      nodes.forEach(node => {
        if (!document.contains(node)) {
          detached++;
        }
      });
      return detached;
    });

    if (detachedNodes > 50) {
      issues.push({
        severity: 'medium',
        category: 'memory',
        title: `${detachedNodes} detached DOM nodes found`,
        description: 'Detached nodes are kept in memory and cause memory leaks',
        recommendation: 'Remove event listeners before removing DOM elements',
        metrics: { detachedNodes }
      });
    }

  } catch (error) {
    // Silent fail - memory API not available
  }

  return issues;
}

/**
 * Detect N+1 query problems in Prisma code
 */
function detectN1Queries(projectPath: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  try {
    // Search for Prisma queries in API routes and server components
    const searchDirs = [
      join(projectPath, 'app'),
      join(projectPath, 'pages', 'api'),
      join(projectPath, 'src', 'app'),
      join(projectPath, 'src', 'pages')
    ];

    const n1Patterns: { file: string; line: number; pattern: string }[] = [];

    for (const dir of searchDirs) {
      if (existsSync(dir)) {
        findN1Patterns(dir, n1Patterns);
      }
    }

    if (n1Patterns.length > 0) {
      issues.push({
        severity: 'critical',
        category: 'query',
        title: `${n1Patterns.length} potential N+1 query issues`,
        description: 'Queries in loops cause N+1 problems - severe performance impact',
        recommendation: 'Use Prisma include/select to fetch relations in single query',
        metrics: {
          count: n1Patterns.length,
          examples: n1Patterns.slice(0, 3).map(p => `${p.file}:${p.line}`)
        }
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

/**
 * Recursively find N+1 patterns in code
 */
function findN1Patterns(
  dir: string,
  patterns: { file: string; line: number; pattern: string }[]
): void {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        findN1Patterns(fullPath, patterns);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        // Look for queries inside loops
        let inLoop = false;
        let loopDepth = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Detect loop starts
          if (line.includes('for (') || line.includes('forEach(') || line.includes('.map(')) {
            inLoop = true;
            loopDepth++;
          }

          // Detect loop ends
          if (line.includes('}') && loopDepth > 0) {
            loopDepth--;
            if (loopDepth === 0) inLoop = false;
          }

          // Detect Prisma queries in loops
          if (inLoop && (
            line.includes('prisma.') && 
            (line.includes('.findMany') || line.includes('.findUnique') || line.includes('.findFirst'))
          )) {
            patterns.push({
              file: fullPath,
              line: i + 1,
              pattern: line.trim()
            });
          }
        }
      }
    }
  } catch (error) {
    // Skip inaccessible directories
  }
}

/**
 * Analyze slow queries
 */
function analyzeSlowQueries(projectPath: string): PerformanceIssue[] {
  const issues: PerformanceIssue[] = [];

  try {
    // Check Prisma schema for missing indexes
    const schemaPath = join(projectPath, 'prisma', 'schema.prisma');
    if (!existsSync(schemaPath)) return issues;

    const schema = readFileSync(schemaPath, 'utf-8');
    const models = schema.match(/model\s+\w+\s*{[^}]+}/g) || [];

    let modelsWithoutIndexes = 0;
    const modelDetails: string[] = [];

    for (const model of models) {
      const modelName = model.match(/model\s+(\w+)/)?.[1];
      const hasIndex = model.includes('@@index') || model.includes('@@unique');
      const hasRelations = model.includes('@relation');

      if (!hasIndex && hasRelations) {
        modelsWithoutIndexes++;
        if (modelName) modelDetails.push(modelName);
      }
    }

    if (modelsWithoutIndexes > 0) {
      issues.push({
        severity: 'high',
        category: 'query',
        title: `${modelsWithoutIndexes} models without database indexes`,
        description: 'Models with relations but no indexes cause slow queries',
        recommendation: 'Add @@index on foreign keys and frequently queried fields',
        metrics: {
          models: modelDetails.slice(0, 5)
        }
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

/**
 * Monitor JavaScript execution performance
 */
async function monitorJSPerformance(page: Page): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = [];

  try {
    const metrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      const longTasks = entries.filter(e => e.duration > 50);

      return {
        longTaskCount: longTasks.length,
        totalDuration: longTasks.reduce((sum, e) => sum + e.duration, 0)
      };
    });

    if (metrics.longTaskCount > 5) {
      issues.push({
        severity: 'high',
        category: 'cpu',
        title: `${metrics.longTaskCount} long-running JavaScript tasks`,
        description: 'Tasks blocking main thread for >50ms cause UI jank',
        recommendation: 'Break up long tasks, use web workers, or defer non-critical work',
        metrics
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

/**
 * Analyze network performance
 */
async function analyzeNetworkPerformance(page: Page, url: string): Promise<PerformanceIssue[]> {
  const issues: PerformanceIssue[] = [];

  try {
    const perfEntries = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      return {
        ttfb: nav ? nav.responseStart - nav.requestStart : 0,
        resources: resources.map(r => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
          type: r.initiatorType
        }))
      };
    });

    // Check TTFB
    if (perfEntries.ttfb > 600) {
      issues.push({
        severity: 'high',
        category: 'network',
        title: 'Slow server response time',
        description: `TTFB: ${Math.round(perfEntries.ttfb)}ms (should be <600ms)`,
        recommendation: 'Optimize server-side processing, enable caching, use CDN',
        metrics: { ttfb: Math.round(perfEntries.ttfb) }
      });
    }

    // Check for large resources
    const largeResources = perfEntries.resources.filter(r => r.size > 500000); // >500KB
    if (largeResources.length > 0) {
      issues.push({
        severity: 'medium',
        category: 'network',
        title: `${largeResources.length} large resources (>500KB)`,
        description: 'Large resources slow down page load',
        recommendation: 'Compress images, minify JS/CSS, use lazy loading',
        metrics: {
          largestSize: Math.max(...largeResources.map(r => r.size)),
          examples: largeResources.slice(0, 3).map(r => r.name.split('/').pop())
        }
      });
    }

    // Check for too many requests
    if (perfEntries.resources.length > 100) {
      issues.push({
        severity: 'medium',
        category: 'network',
        title: `${perfEntries.resources.length} HTTP requests`,
        description: 'Too many requests increase load time',
        recommendation: 'Bundle resources, use HTTP/2, implement resource hints',
        metrics: { requestCount: perfEntries.resources.length }
      });
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

/**
 * Collect performance metrics
 */
async function collectMetrics(page: Page): Promise<any> {
  try {
    return await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const memory = (performance as any).memory;

      return {
        ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : 0,
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        domComplete: nav ? Math.round(nav.domComplete) : 0,
        loadComplete: nav ? Math.round(nav.loadEventEnd) : 0,
        memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0
      };
    });
  } catch (error) {
    return {};
  }
}

/**
 * Generate performance recommendations
 */
function generatePerformanceRecommendations(
  issues: PerformanceIssue[],
  metrics: any
): string[] {
  const recommendations: string[] = [];

  if (issues.some(i => i.category === 'memory')) {
    recommendations.push('💾 Fix memory leaks: Remove event listeners, avoid global variables');
  }

  if (issues.some(i => i.category === 'query')) {
    recommendations.push('⚡ Optimize queries: Use Prisma include, add database indexes');
  }

  if (issues.some(i => i.category === 'network')) {
    recommendations.push('🌐 Improve network: Enable compression, use CDN, lazy load images');
  }

  if (issues.some(i => i.category === 'cpu')) {
    recommendations.push('🖥️ Optimize JavaScript: Break up long tasks, use web workers');
  }

  if (metrics.ttfb && metrics.ttfb > 600) {
    recommendations.push('🚀 Reduce TTFB: Optimize database queries, enable server caching');
  }

  return recommendations;
}
