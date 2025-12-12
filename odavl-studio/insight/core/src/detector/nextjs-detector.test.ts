/**
 * Tests for NextJSDetector
 * 
 * Coverage:
 * - Hydration mismatch detection (Date.now, Math.random, browser APIs)
 * - Server Actions validation ('use server', params, returns)
 * - Suspense boundary issues (missing loading.tsx, nested Suspense)
 * - Client/Server boundary violations ('use client' misuse)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { NextJSDetector, type NextJSConfig, analyzeNextJS } from './nextjs-detector';

describe('NextJSDetector', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nextjs-detector-test-'));
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  /**
   * Helper: Create test file
   */
  async function createFile(relativePath: string, content: string): Promise<string> {
    const filePath = path.join(tempDir, relativePath);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  /**
   * Helper: Create package.json
   */
  async function createPackageJson(nextVersion: string = '14.0.0'): Promise<void> {
    await createFile('package.json', JSON.stringify({
      dependencies: {
        next: nextVersion,
        react: '18.2.0',
      },
    }));
  }

  describe('Hydration Mismatch Detection', () => {
    it('should detect Date.now() causing hydration issues', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        export default function Page() {
          const timestamp = Date.now();
          return <div>{timestamp}</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('hydration-mismatch');
      expect(result.issues[0].severity).toBe('high');
      expect(result.issues[0].message).toContain('Date.now()');
      expect(result.issues[0].suggestion).toContain('useState');
    });

    it('should detect Math.random() causing hydration issues', async () => {
      await createPackageJson();
      await createFile('app/components/RandomId.tsx', `
        export default function RandomId() {
          const id = Math.random();
          return <div id={id.toString()}></div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('hydration-mismatch');
      expect(result.issues[0].severity).toBe('high');
      expect(result.issues[0].message).toContain('Math.random()');
      expect(result.issues[0].suggestion).toContain('client-side');
    });

    it('should detect window access in render causing hydration issues', async () => {
      await createPackageJson();
      await createFile('app/components/WindowCheck.tsx', `
        export default function WindowCheck() {
          const width = window.innerWidth;
          return <div>{width}</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.issues.length).toBeGreaterThan(0);
      const windowIssue = result.issues.find(i => i.message.includes('window'));
      expect(windowIssue).toBeDefined();
      expect(windowIssue?.severity).toBe('medium');
      expect(windowIssue?.suggestion).toContain('useEffect');
    });

    it('should NOT flag window access inside useEffect', async () => {
      await createPackageJson();
      await createFile('app/components/SafeWindow.tsx', `
        'use client';
        import { useEffect, useState } from 'react';

        export default function SafeWindow() {
          const [width, setWidth] = useState(0);
          
          useEffect(() => {
            setWidth(window.innerWidth);
          }, []);

          return <div>{width}</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const windowIssue = result.issues.find(i => i.message.includes('window'));
      expect(windowIssue).toBeUndefined();
    });

    it('should NOT flag window access with typeof check', async () => {
      await createPackageJson();
      await createFile('app/utils/browser.ts', `
        export const isBrowser = typeof window !== 'undefined';
        
        export function getWindowWidth() {
          if (typeof window !== 'undefined') {
            return window.innerWidth;
          }
          return 0;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const windowIssue = result.issues.find(i => i.message.includes('window'));
      expect(windowIssue).toBeUndefined();
    });

    it('should detect localStorage access causing hydration issues', async () => {
      await createPackageJson();
      await createFile('app/components/Storage.tsx', `
        export default function Storage() {
          const value = localStorage.getItem('key');
          return <div>{value}</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const storageIssue = result.issues.find(i => i.message.includes('localStorage'));
      expect(storageIssue).toBeDefined();
      expect(storageIssue?.severity).toBe('medium');
    });

    it('should detect suppressHydrationWarning usage', async () => {
      await createPackageJson();
      await createFile('app/components/Suppressed.tsx', `
        export default function Suppressed() {
          return <div suppressHydrationWarning>{Date.now()}</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const suppressIssue = result.issues.find(i => i.message.includes('suppressHydrationWarning'));
      expect(suppressIssue).toBeDefined();
      expect(suppressIssue?.severity).toBe('low');
      expect(suppressIssue?.suggestion).toContain('Fix the actual hydration issue');
    });
  });

  describe('Server Actions Issues', () => {
    it('should detect misplaced use server directive', async () => {
      await createPackageJson();
      await createFile('app/actions.ts', `
        const x = 1;
        'use server'
        
        export async function myAction() {
          return { success: true };
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const directiveIssue = result.issues.find(i => i.message.includes("'use server'") && i.message.includes('top'));
      expect(directiveIssue).toBeDefined();
      expect(directiveIssue?.severity).toBe('high');
    });

    it('should detect Function parameters in Server Actions', async () => {
      await createPackageJson();
      await createFile('app/actions.ts', `
        'use server'
        
        export async function processData(callback: Function) {
          const data = await fetchData();
          callback(data);
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const functionParamIssue = result.issues.find(i => i.message.includes('Function') && i.message.includes('parameters'));
      expect(functionParamIssue).toBeDefined();
      expect(functionParamIssue?.severity).toBe('critical');
      expect(functionParamIssue?.suggestion).toContain('primitive types');
    });

    it('should detect class instances in Server Actions', async () => {
      await createPackageJson();
      await createFile('app/actions.ts', `
        'use server'
        
        export async function createUser() {
          return new User({ name: 'John' });
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const classIssue = result.issues.find(i => i.message.includes('class instances'));
      expect(classIssue).toBeDefined();
      expect(classIssue?.severity).toBe('high');
    });

    it('should detect missing use server in actions directory', async () => {
      await createPackageJson();
      await createFile('app/actions/user-actions.ts', `
        export async function createUser(data: any) {
          // No 'use server' directive
          return { success: true };
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const missingDirective = result.issues.find(i => i.message.includes("should have 'use server'"));
      expect(missingDirective).toBeDefined();
      expect(missingDirective?.severity).toBe('medium');
    });

    it('should NOT flag valid Server Actions', async () => {
      await createPackageJson();
      await createFile('app/actions/valid-actions.ts', `
        'use server'
        
        export async function createUser(name: string, email: string) {
          return { id: 1, name, email };
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const serverActionIssues = result.issues.filter(i => i.type === 'server-action');
      expect(serverActionIssues).toHaveLength(0);
    });
  });

  describe('Suspense Boundary Issues', () => {
    it('should detect async component without loading.tsx', async () => {
      await createPackageJson();
      await createFile('app/dashboard/page.tsx', `
        export default async function Dashboard() {
          const data = await fetchData();
          return <div>{data}</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const suspenseIssue = result.issues.find(i => i.message.includes('loading.tsx'));
      expect(suspenseIssue).toBeDefined();
      expect(suspenseIssue?.severity).toBe('high');
      expect(suspenseIssue?.suggestion).toContain('loading.tsx');
    });

    it('should NOT flag async component with loading.tsx', async () => {
      await createPackageJson();
      await createFile('app/dashboard/page.tsx', `
        export default async function Dashboard() {
          const data = await fetchData();
          return <div>{data}</div>;
        }
      `);
      await createFile('app/dashboard/loading.tsx', `
        export default function Loading() {
          return <div>Loading...</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const suspenseIssue = result.issues.find(i => i.message.includes('loading.tsx'));
      expect(suspenseIssue).toBeUndefined();
    });

    it('should NOT flag async component with Suspense wrapper', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        import { Suspense } from 'react';
        
        export default async function Page() {
          const data = await fetchData();
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <div>{data}</div>
            </Suspense>
          );
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const suspenseIssue = result.issues.find(i => i.message.includes('loading.tsx'));
      expect(suspenseIssue).toBeUndefined();
    });

    it('should detect too many nested Suspense boundaries', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        import { Suspense } from 'react';
        
        export default function Page() {
          return (
            <Suspense fallback={<div>1</div>}>
              <Suspense fallback={<div>2</div>}>
                <Suspense fallback={<div>3</div>}>
                  <Content />
                </Suspense>
              </Suspense>
            </Suspense>
          );
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const nestedIssue = result.issues.find(i => i.message.includes('nested Suspense'));
      expect(nestedIssue).toBeDefined();
      expect(nestedIssue?.severity).toBe('medium');
    });

    it('should detect Suspense without fallback', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        import { Suspense } from 'react';
        
        export default function Page() {
          return (
            <Suspense>
              <AsyncComponent />
            </Suspense>
          );
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const noFallbackIssue = result.issues.find(i => i.message.includes('without fallback'));
      expect(noFallbackIssue).toBeDefined();
      expect(noFallbackIssue?.severity).toBe('low');
    });
  });

  describe('Client/Server Boundary Violations', () => {
    it('should detect both use client and use server in same file', async () => {
      await createPackageJson();
      await createFile('app/confused.tsx', `
        'use client'
        'use server'
        
        export default function Confused() {
          return <div>What am I?</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const bothDirectives = result.issues.find(i => i.message.includes('both'));
      expect(bothDirectives).toBeDefined();
      expect(bothDirectives?.severity).toBe('critical');
    });

    it('should detect server-only imports in client component', async () => {
      await createPackageJson();
      await createFile('app/components/BadClient.tsx', `
        'use client'
        import * as fs from 'fs';
        import { PrismaClient } from '@prisma/client';
        
        export default function BadClient() {
          const data = fs.readFileSync('./data.txt');
          return <div>{data}</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const fsImport = result.issues.find(i => i.message.includes("'fs'"));
      expect(fsImport).toBeDefined();
      expect(fsImport?.severity).toBe('critical');

      const prismaImport = result.issues.find(i => i.message.includes("'prisma'"));
      expect(prismaImport).toBeDefined();
    });

    it('should detect client hooks in server component', async () => {
      await createPackageJson();
      await createFile('app/components/BadServer.tsx', `
        import { useState } from 'react';
        
        export default function BadServer() {
          const [count, setCount] = useState(0);
          return <button onClick={() => setCount(count + 1)}>{count}</button>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const hookIssue = result.issues.find(i => i.message.includes('useState'));
      expect(hookIssue).toBeDefined();
      expect(hookIssue?.severity).toBe('high');
      expect(hookIssue?.suggestion).toContain("'use client'");
    });

    it('should detect use client in middleware', async () => {
      await createPackageJson();
      await createFile('middleware.ts', `
        'use client'
        
        export function middleware() {
          return new Response('Hello');
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const middlewareIssue = result.issues.find(i => i.message.includes('server-only location'));
      expect(middlewareIssue).toBeDefined();
      expect(middlewareIssue?.severity).toBe('high');
    });

    it('should detect use client in layout.tsx (root layout)', async () => {
      await createPackageJson();
      await createFile('app/layout.tsx', `
        'use client'
        
        export default function RootLayout({ children }) {
          return <html><body>{children}</body></html>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const layoutIssue = result.issues.find(i => i.message.includes('server-only location'));
      expect(layoutIssue).toBeDefined();
    });

    it('should NOT flag valid client component', async () => {
      await createPackageJson();
      await createFile('app/components/ValidClient.tsx', `
        'use client'
        import { useState } from 'react';
        
        export default function ValidClient() {
          const [count, setCount] = useState(0);
          return <button onClick={() => setCount(count + 1)}>{count}</button>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      const boundaryIssues = result.issues.filter(i => i.type === 'client-server-boundary');
      expect(boundaryIssues).toHaveLength(0);
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate correct score for no issues', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        export default function Page() {
          return <div>Hello</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.metrics.nextjsScore).toBe(100);
      expect(result.metrics.totalFiles).toBeGreaterThan(0);
    });

    it('should decrease score for critical issues', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        'use client'
        'use server'
        
        export default function Page() {
          return <div>Confused</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.metrics.nextjsScore).toBeLessThan(100);
      expect(result.metrics.nextjsScore).toBeGreaterThanOrEqual(0);
    });

    it('should track issue counts correctly', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        export default function Page() {
          const time = Date.now();
          const random = Math.random();
          return <div>{time} {random}</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.metrics.hydrationIssues).toBe(2);
      expect(result.metrics.componentsAnalyzed).toBeGreaterThan(0);
    });
  });

  describe('Next.js Version Detection', () => {
    it('should detect Next.js version from package.json', async () => {
      await createPackageJson('14.2.3');
      await createFile('app/page.tsx', `
        export default function Page() {
          return <div>Hello</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.nextVersion).toBe('14.2.3');
    });

    it('should detect App Router usage', async () => {
      await createPackageJson();
      await fs.mkdir(path.join(tempDir, 'app'), { recursive: true });
      await createFile('app/page.tsx', `
        export default function Page() {
          return <div>App Router</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.appDirectory).toBe(true);
    });

    it('should detect Pages Router when no app directory', async () => {
      await createPackageJson();
      await createFile('pages/index.tsx', `
        export default function Page() {
          return <div>Pages Router</div>;
        }
      `);

      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.appDirectory).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should respect exclude patterns', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        export default function Page() {
          const time = Date.now();
          return <div>{time}</div>;
        }
      `);
      await createFile('node_modules/package/index.ts', `
        const time = Date.now();
      `);

      const detector = new NextJSDetector({
        excludePatterns: ['**/node_modules/**'],
      });
      const result = await detector.analyze(tempDir);

      // Should only find issue in app/page.tsx, not node_modules
      expect(result.issues).toHaveLength(1);
      const normalizedFilePath = result.issues[0].file.replace(/\\/g, '/');
      expect(normalizedFilePath).toContain('app/page.tsx');
    });

    it('should allow disabling specific checks', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        export default function Page() {
          const time = Date.now();
          return <div>{time}</div>;
        }
      `);

      const detector = new NextJSDetector({
        checkHydration: false,
      });
      const result = await detector.analyze(tempDir);

      const hydrationIssues = result.issues.filter(i => i.type === 'hydration-mismatch');
      expect(hydrationIssues).toHaveLength(0);
    });
  });

  describe('Helper Function', () => {
    it('should provide convenience analyzeNextJS function', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        export default function Page() {
          return <div>Hello</div>;
        }
      `);

      const result = await analyzeNextJS(tempDir);

      expect(result.issues).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should accept config via helper function', async () => {
      await createPackageJson();
      await createFile('app/page.tsx', `
        export default function Page() {
          const time = Date.now();
          return <div>{time}</div>;
        }
      `);

      const result = await analyzeNextJS(tempDir, {
        checkHydration: false,
      });

      const hydrationIssues = result.issues.filter(i => i.type === 'hydration-mismatch');
      expect(hydrationIssues).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent workspace gracefully', async () => {
      const detector = new NextJSDetector();
      const result = await detector.analyze('/non-existent-path');

      expect(result.issues).toBeDefined();
      expect(result.metrics.nextjsScore).toBe(100);
    });

    it('should handle empty workspace', async () => {
      const detector = new NextJSDetector();
      const result = await detector.analyze(tempDir);

      expect(result.issues).toHaveLength(0);
      expect(result.metrics.nextjsScore).toBe(100);
    });
  });

  describe('Performance', () => {
    it('should complete analysis in reasonable time', async () => {
      await createPackageJson();
      
      // Create multiple files
      for (let i = 0; i < 10; i++) {
        await createFile(`app/component${i}.tsx`, `
          export default function Component${i}() {
            const time = Date.now();
            return <div>{time}</div>;
          }
        `);
      }

      const start = performance.now();
      const detector = new NextJSDetector();
      await detector.analyze(tempDir);
      const duration = performance.now() - start;

      // Should complete in less than 5 seconds for 10 files
      expect(duration).toBeLessThan(5000);
    });
  });
});
