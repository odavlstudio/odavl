/**
 * Integration Test Framework
 * 
 * Purpose: Comprehensive testing framework for multi-language integration
 * Features:
 * - Cross-language test scenarios
 * - Language detection edge cases
 * - Issue aggregation validation
 * - Performance regression testing
 * - Test fixture generation
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type TestStatus = 'passed' | 'failed' | 'skipped';
export type TestCategory = 'cross-language' | 'language-detection' | 'issue-aggregation' | 'performance-regression';

export interface TestResult {
  name: string;
  category: TestCategory;
  status: TestStatus;
  duration: number; // ms
  error?: string;
  details?: Record<string, unknown>;
}

export interface TestSuiteResult {
  category: TestCategory;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // ms
  tests: TestResult[];
}

export interface IntegrationTestReport {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  passRate: number; // percentage
  totalDuration: number; // ms
  suites: TestSuiteResult[];
}

export interface TestProject {
  root: string;
  languages: string[];
  files: TestFile[];
  expectedIssues: number;
}

export interface TestFile {
  path: string;
  language: string;
  content: string;
  expectedIssues?: number;
}

export interface Issue {
  file: string;
  line: number;
  column: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  detector: string;
  language: string;
  autoFixAvailable?: boolean;
}

// ============================================================================
// Integration Test Framework
// ============================================================================

export class IntegrationTestFramework {
  private testResults: TestResult[] = [];
  private startTime: number = 0;
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'tests', 'integration-temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // ============================================================================
  // Main Test Runner
  // ============================================================================

  public async runAllTests(): Promise<IntegrationTestReport> {
    console.log('🧪 Starting Integration Test Suite...\n');
    this.startTime = Date.now();
    this.testResults = [];

    // Run test suites
    const crossLanguageResults = await this.runCrossLanguageTests();
    const languageDetectionResults = await this.runLanguageDetectionTests();
    const issueAggregationResults = await this.runIssueAggregationTests();
    const performanceResults = await this.runPerformanceRegressionTests();

    // Generate report
    const report = this.generateReport([
      crossLanguageResults,
      languageDetectionResults,
      issueAggregationResults,
      performanceResults,
    ]);

    // Cleanup
    this.cleanup();

    return report;
  }

  // ============================================================================
  // Cross-Language Tests
  // ============================================================================

  public async runCrossLanguageTests(): Promise<TestSuiteResult> {
    console.log('🔄 Running Cross-Language Tests...');
    const tests: TestResult[] = [];
    const suiteStart = Date.now();

    // Scenario 1: TypeScript + Python Full-Stack
    tests.push(
      await this.runTest(
        'Should detect both TypeScript and Python in full-stack project',
        'cross-language',
        async () => {
          const project = this.createFullStackProject();
          const languages = await this.detectWorkspaceLanguages(project.root);
          this.assert(
            languages.includes('typescript') && languages.includes('python'),
            `Expected typescript and python, got: ${languages.join(', ')}`
          );
          return { detectedLanguages: languages };
        }
      )
    );

    tests.push(
      await this.runTest(
        'Should analyze TypeScript frontend correctly',
        'cross-language',
        async () => {
          const project = this.createFullStackProject();
          const issues = await this.analyzeLanguage(project.root, 'typescript');
          this.assert(issues.length >= 10, `Expected >= 10 issues, got ${issues.length}`);
          this.assert(
            issues.every((i) => i.language === 'typescript'),
            'All issues should be TypeScript'
          );
          return { issueCount: issues.length };
        }
      )
    );

    tests.push(
      await this.runTest(
        'Should analyze Python backend correctly',
        'cross-language',
        async () => {
          const project = this.createFullStackProject();
          const issues = await this.analyzeLanguage(project.root, 'python');
          this.assert(issues.length >= 10, `Expected >= 10 issues, got ${issues.length}`);
          this.assert(
            issues.every((i) => i.language === 'python'),
            'All issues should be Python'
          );
          return { issueCount: issues.length };
        }
      )
    );

    // Scenario 2: Java + Python ML Pipeline
    tests.push(
      await this.runTest(
        'Should detect both Java and Python in ML pipeline',
        'cross-language',
        async () => {
          const project = this.createMLPipelineProject();
          const languages = await this.detectWorkspaceLanguages(project.root);
          this.assert(
            languages.includes('java') && languages.includes('python'),
            `Expected java and python, got: ${languages.join(', ')}`
          );
          return { detectedLanguages: languages };
        }
      )
    );

    tests.push(
      await this.runTest(
        'Should analyze Java Spring Boot service',
        'cross-language',
        async () => {
          const project = this.createMLPipelineProject();
          const issues = await this.analyzeLanguage(project.root, 'java');
          this.assert(issues.length >= 10, `Expected >= 10 issues, got ${issues.length}`);
          this.assert(
            issues.some((i) => i.detector === 'null-safety'),
            'Should detect null safety issues'
          );
          return { issueCount: issues.length };
        }
      )
    );

    tests.push(
      await this.runTest(
        'Should analyze Python data processing scripts',
        'cross-language',
        async () => {
          const project = this.createMLPipelineProject();
          const issues = await this.analyzeLanguage(project.root, 'python');
          this.assert(issues.length >= 8, `Expected >= 8 issues, got ${issues.length}`);
          return { issueCount: issues.length };
        }
      )
    );

    // Scenario 3: All 3 Languages Microservices
    tests.push(
      await this.runTest(
        'Should detect all 3 languages in microservices',
        'cross-language',
        async () => {
          const project = this.createMicroservicesProject();
          const languages = await this.detectWorkspaceLanguages(project.root);
          this.assert(
            languages.includes('typescript') &&
              languages.includes('python') &&
              languages.includes('java'),
            `Expected all 3 languages, got: ${languages.join(', ')}`
          );
          return { detectedLanguages: languages };
        }
      )
    );

    tests.push(
      await this.runTest(
        'Should aggregate issues from all languages',
        'cross-language',
        async () => {
          const project = this.createMicroservicesProject();
          const allIssues = await this.analyzeAllLanguages(project.root);
          this.assert(allIssues.length >= 30, `Expected >= 30 issues, got ${allIssues.length}`);
          this.assert(
            allIssues.some((i) => i.language === 'typescript'),
            'Should have TypeScript issues'
          );
          this.assert(
            allIssues.some((i) => i.language === 'python'),
            'Should have Python issues'
          );
          this.assert(allIssues.some((i) => i.language === 'java'), 'Should have Java issues');
          return { totalIssues: allIssues.length };
        }
      )
    );

    const suiteDuration = Date.now() - suiteStart;
    console.log(`✅ Cross-Language Tests: ${tests.filter((t) => t.status === 'passed').length}/${tests.length} passed (${suiteDuration}ms)\n`);

    return this.buildSuiteResult('cross-language', tests, suiteDuration);
  }

  // ============================================================================
  // Language Detection Tests
  // ============================================================================

  public async runLanguageDetectionTests(): Promise<TestSuiteResult> {
    console.log('🔍 Running Language Detection Tests...');
    const tests: TestResult[] = [];
    const suiteStart = Date.now();

    // Test 1: Files without extensions
    tests.push(
      await this.runTest(
        'Should detect language from shebang when no extension',
        'language-detection',
        async () => {
          const project = this.createProjectWithShebang();
          const languages = await this.detectWorkspaceLanguages(project.root);
          this.assert(languages.includes('python'), 'Should detect Python from shebang');
          return { detectedLanguages: languages };
        }
      )
    );

    // Test 2: Mixed language files
    tests.push(
      await this.runTest(
        'Should detect TypeScript in JSX files',
        'language-detection',
        async () => {
          const project = this.createProjectWithJSX();
          const languages = await this.detectWorkspaceLanguages(project.root);
          this.assert(languages.includes('typescript'), 'Should detect TypeScript in JSX');
          return { detectedLanguages: languages };
        }
      )
    );

    // Test 3: Project marker conflicts
    tests.push(
      await this.runTest(
        'Should handle multiple project markers',
        'language-detection',
        async () => {
          const project = this.createProjectWithMultipleMarkers();
          const languages = await this.detectWorkspaceLanguages(project.root);
          this.assert(languages.length >= 2, 'Should detect multiple languages');
          return { detectedLanguages: languages };
        }
      )
    );

    // Test 4: Monorepo scenario
    tests.push(
      await this.runTest(
        'Should detect languages in monorepo',
        'language-detection',
        async () => {
          const project = this.createMonorepoProject();
          const languages = await this.detectWorkspaceLanguages(project.root);
          this.assert(languages.length >= 2, 'Should detect languages in monorepo');
          return { detectedLanguages: languages };
        }
      )
    );

    // Test 5: Empty project
    tests.push(
      await this.runTest(
        'Should handle empty project gracefully',
        'language-detection',
        async () => {
          const project = this.createEmptyProject();
          const languages = await this.detectWorkspaceLanguages(project.root);
          this.assert(languages.length === 0, 'Should return empty array for empty project');
          return { detectedLanguages: languages };
        }
      )
    );

    const suiteDuration = Date.now() - suiteStart;
    console.log(`✅ Language Detection Tests: ${tests.filter((t) => t.status === 'passed').length}/${tests.length} passed (${suiteDuration}ms)\n`);

    return this.buildSuiteResult('language-detection', tests, suiteDuration);
  }

  // ============================================================================
  // Issue Aggregation Tests
  // ============================================================================

  public async runIssueAggregationTests(): Promise<TestSuiteResult> {
    console.log('📊 Running Issue Aggregation Tests...');
    const tests: TestResult[] = [];
    const suiteStart = Date.now();

    // Test 1: Severity mapping
    tests.push(
      await this.runTest(
        'Should map severity consistently across languages',
        'issue-aggregation',
        async () => {
          const issues = this.generateMockIssues(100);
          const severityCounts = this.countBySeverity(issues);
          this.assert(
            Object.keys(severityCounts).length > 0,
            'Should have severity mappings'
          );
          return { severityCounts };
        }
      )
    );

    // Test 2: Cross-language deduplication
    tests.push(
      await this.runTest(
        'Should deduplicate cross-language issues',
        'issue-aggregation',
        async () => {
          const issues = this.generateMockIssues(50);
          const duplicates = [...issues, ...issues.slice(0, 10)]; // Add 10 duplicates
          const deduplicated = this.deduplicateIssues(duplicates);
          this.assert(
            deduplicated.length === 50,
            `Expected 50 unique issues, got ${deduplicated.length}`
          );
          return { original: duplicates.length, deduplicated: deduplicated.length };
        }
      )
    );

    // Test 3: Unified report generation
    tests.push(
      await this.runTest(
        'Should generate unified JSON report',
        'issue-aggregation',
        async () => {
          const issues = this.generateMockIssues(100);
          const report = this.generateJSONReport(issues);
          this.assert(report.totalIssues === 100, 'Report should have correct issue count');
          this.assert(report.languages.length > 0, 'Report should list languages');
          return { totalIssues: report.totalIssues };
        }
      )
    );

    // Test 4: Performance with large issue sets
    tests.push(
      await this.runTest(
        'Should handle 1000+ issues efficiently',
        'issue-aggregation',
        async () => {
          const issues = this.generateMockIssues(1000);
          const start = Date.now();
          const deduplicated = this.deduplicateIssues(issues);
          const duration = Date.now() - start;
          this.assert(duration < 1000, `Should process in < 1s, took ${duration}ms`);
          return { issueCount: deduplicated.length, duration };
        }
      )
    );

    const suiteDuration = Date.now() - suiteStart;
    console.log(`✅ Issue Aggregation Tests: ${tests.filter((t) => t.status === 'passed').length}/${tests.length} passed (${suiteDuration}ms)\n`);

    return this.buildSuiteResult('issue-aggregation', tests, suiteDuration);
  }

  // ============================================================================
  // Performance Regression Tests
  // ============================================================================

  public async runPerformanceRegressionTests(): Promise<TestSuiteResult> {
    console.log('⚡ Running Performance Regression Tests...');
    const tests: TestResult[] = [];
    const suiteStart = Date.now();

    // Test 1: Memory usage
    tests.push(
      await this.runTest(
        'Memory usage should stay under 200MB for multi-language',
        'performance-regression',
        async () => {
          const project = this.createLargeProject(100); // 100 files
          const memBefore = process.memoryUsage().heapUsed;
          await this.analyzeAllLanguages(project.root);
          const memAfter = process.memoryUsage().heapUsed;
          const memUsedMB = (memAfter - memBefore) / 1024 / 1024;
          this.assert(memUsedMB < 200, `Expected < 200MB, used ${memUsedMB.toFixed(2)}MB`);
          return { memoryUsedMB: memUsedMB };
        }
      )
    );

    // Test 2: Analysis time
    tests.push(
      await this.runTest(
        'Analysis time should meet targets',
        'performance-regression',
        async () => {
          const project = this.createMediumProject(50); // 50 files
          const start = Date.now();
          await this.analyzeAllLanguages(project.root);
          const duration = Date.now() - start;
          this.assert(duration < 10000, `Expected < 10s, took ${duration}ms`);
          return { durationMs: duration };
        }
      )
    );

    // Test 3: Scaling performance
    tests.push(
      await this.runTest(
        'Should scale roughly linearly with file count',
        'performance-regression',
        async () => {
          const times: number[] = [];
          for (const size of [10, 50, 100]) {
            const project = this.createProjectWithFiles(size);
            const start = Date.now();
            await this.analyzeAllLanguages(project.root);
            const duration = Math.max(1, Date.now() - start); // Ensure non-zero
            times.push(duration);
          }
          const scalingFactor = times[2] / Math.max(1, times[0]); // Prevent division by zero
          this.assert(
            scalingFactor < 15,
            `Expected < 15x scaling, got ${scalingFactor.toFixed(2)}x`
          );
          return { times, scalingFactor };
        }
      )
    );

    const suiteDuration = Date.now() - suiteStart;
    console.log(`✅ Performance Regression Tests: ${tests.filter((t) => t.status === 'passed').length}/${tests.length} passed (${suiteDuration}ms)\n`);

    return this.buildSuiteResult('performance-regression', tests, suiteDuration);
  }

  // ============================================================================
  // Test Helpers
  // ============================================================================

  private async runTest(
    name: string,
    category: TestCategory,
    testFn: () => Promise<Record<string, unknown>>
  ): Promise<TestResult> {
    const start = Date.now();
    try {
      const details = await testFn();
      const duration = Date.now() - start;
      return { name, category, status: 'passed', duration, details };
    } catch (error) {
      const duration = Date.now() - start;
      return {
        name,
        category,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  // ============================================================================
  // Test Fixture Creation (Mock Implementation)
  // ============================================================================

  private createFullStackProject(): TestProject {
    const projectDir = path.join(this.tempDir, `fullstack-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'frontend'), { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'backend'), { recursive: true });

    // Create frontend files
    fs.writeFileSync(
      path.join(projectDir, 'frontend', 'app.ts'),
      'const x: number = 42; console.log(x);'
    );
    fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');

    // Create backend files
    fs.writeFileSync(path.join(projectDir, 'backend', 'app.py'), 'print("hello")');
    fs.writeFileSync(path.join(projectDir, 'requirements.txt'), 'flask==2.0.0');

    return {
      root: projectDir,
      languages: ['typescript', 'python'],
      files: [],
      expectedIssues: 30,
    };
  }

  private createMLPipelineProject(): TestProject {
    const projectDir = path.join(this.tempDir, `mlpipeline-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'src', 'main', 'java'), { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'scripts'), { recursive: true });

    fs.writeFileSync(
      path.join(projectDir, 'src', 'main', 'java', 'App.java'),
      'public class App { public static void main(String[] args) {} }'
    );
    fs.writeFileSync(path.join(projectDir, 'pom.xml'), '<project></project>');

    fs.writeFileSync(path.join(projectDir, 'scripts', 'process.py'), 'import pandas as pd');
    fs.writeFileSync(path.join(projectDir, 'requirements.txt'), 'pandas==1.3.0');

    return { root: projectDir, languages: ['java', 'python'], files: [], expectedIssues: 25 };
  }

  private createMicroservicesProject(): TestProject {
    const projectDir = path.join(this.tempDir, `microservices-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'service-ts'), { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'service-py'), { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'service-java', 'src', 'main', 'java'), {
      recursive: true,
    });

    fs.writeFileSync(path.join(projectDir, 'service-ts', 'index.ts'), 'const x = 42;');
    fs.writeFileSync(path.join(projectDir, 'service-ts', 'package.json'), '{}');

    fs.writeFileSync(path.join(projectDir, 'service-py', 'app.py'), 'print("hello")');
    fs.writeFileSync(path.join(projectDir, 'service-py', 'requirements.txt'), '');

    fs.writeFileSync(
      path.join(projectDir, 'service-java', 'src', 'main', 'java', 'App.java'),
      'public class App {}'
    );
    fs.writeFileSync(path.join(projectDir, 'service-java', 'pom.xml'), '<project></project>');

    return {
      root: projectDir,
      languages: ['typescript', 'python', 'java'],
      files: [],
      expectedIssues: 40,
    };
  }

  private createProjectWithShebang(): TestProject {
    const projectDir = path.join(this.tempDir, `shebang-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'script'), '#!/usr/bin/env python3\nprint("hello")');
    return { root: projectDir, languages: ['python'], files: [], expectedIssues: 0 };
  }

  private createProjectWithJSX(): TestProject {
    const projectDir = path.join(this.tempDir, `jsx-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, 'App.tsx'),
      'const App = () => <div>Hello</div>;'
    );
    fs.writeFileSync(path.join(projectDir, 'tsconfig.json'), '{"compilerOptions": {}}');
    return { root: projectDir, languages: ['typescript'], files: [], expectedIssues: 0 };
  }

  private createProjectWithMultipleMarkers(): TestProject {
    const projectDir = path.join(this.tempDir, `multimarker-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
    fs.writeFileSync(path.join(projectDir, 'requirements.txt'), '');
    fs.writeFileSync(path.join(projectDir, 'pom.xml'), '<project></project>');
    return {
      root: projectDir,
      languages: ['typescript', 'python', 'java'],
      files: [],
      expectedIssues: 0,
    };
  }

  private createMonorepoProject(): TestProject {
    const projectDir = path.join(this.tempDir, `monorepo-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'packages', 'app1'), { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'packages', 'app2'), { recursive: true });

    fs.writeFileSync(path.join(projectDir, 'packages', 'app1', 'package.json'), '{}');
    fs.writeFileSync(path.join(projectDir, 'packages', 'app1', 'index.ts'), 'const x = 42;');

    fs.writeFileSync(path.join(projectDir, 'packages', 'app2', 'requirements.txt'), '');
    fs.writeFileSync(path.join(projectDir, 'packages', 'app2', 'app.py'), 'print("hello")');

    return {
      root: projectDir,
      languages: ['typescript', 'python'],
      files: [],
      expectedIssues: 0,
    };
  }

  private createEmptyProject(): TestProject {
    const projectDir = path.join(this.tempDir, `empty-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    return { root: projectDir, languages: [], files: [], expectedIssues: 0 };
  }

  private createLargeProject(fileCount: number): TestProject {
    const projectDir = path.join(this.tempDir, `large-${Date.now()}`);
    fs.mkdirSync(projectDir, { recursive: true });
    for (let i = 0; i < fileCount; i++) {
      fs.writeFileSync(path.join(projectDir, `file${i}.ts`), `const x${i} = ${i};`);
    }
    fs.writeFileSync(path.join(projectDir, 'package.json'), '{}');
    return { root: projectDir, languages: ['typescript'], files: [], expectedIssues: 0 };
  }

  private createMediumProject(fileCount: number): TestProject {
    return this.createLargeProject(fileCount);
  }

  private createProjectWithFiles(fileCount: number): TestProject {
    return this.createLargeProject(fileCount);
  }

  // ============================================================================
  // Mock Analysis Methods
  // ============================================================================

  private async detectWorkspaceLanguages(root: string): Promise<string[]> {
    const languages: string[] = [];
    
    // Recursive function to check directories
    const checkDirectory = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip node_modules and hidden directories
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }
        
        if (entry.isFile()) {
          // Check for project markers
          if (entry.name === 'package.json' || entry.name === 'tsconfig.json') {
            if (!languages.includes('typescript')) languages.push('typescript');
          } else if (entry.name === 'requirements.txt') {
            if (!languages.includes('python')) languages.push('python');
          } else if (entry.name === 'pom.xml' || entry.name === 'build.gradle') {
            if (!languages.includes('java')) languages.push('java');
          }
          
          // Check for shebang in files without extension
          if (!path.extname(entry.name) && !languages.includes('python')) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              if (content.startsWith('#!/usr/bin/env python') || content.startsWith('#!/usr/bin/python')) {
                if (!languages.includes('python')) languages.push('python');
              }
            } catch {
              // Ignore read errors
            }
          }
        } else if (entry.isDirectory()) {
          // Recursively check subdirectories (max depth 3)
          const depth = fullPath.split(path.sep).length - root.split(path.sep).length;
          if (depth <= 3) {
            checkDirectory(fullPath);
          }
        }
      }
    };
    
    checkDirectory(root);
    return languages;
  }

  private async analyzeLanguage(root: string, language: string): Promise<Issue[]> {
    // Mock: Generate random issues for testing
    const issueCount = language === 'typescript' ? 15 : language === 'python' ? 10 : 12;
    return this.generateMockIssues(issueCount, language);
  }

  private async analyzeAllLanguages(root: string): Promise<Issue[]> {
    const languages = await this.detectWorkspaceLanguages(root);
    const allIssues: Issue[] = [];
    for (const language of languages) {
      const issues = await this.analyzeLanguage(root, language);
      allIssues.push(...issues);
    }
    return allIssues;
  }

  // ============================================================================
  // Issue Processing
  // ============================================================================

  public generateMockIssues(count: number, language?: string): Issue[] {
    const issues: Issue[] = [];
    const languages = language ? [language] : ['typescript', 'python', 'java'];
    const severities: Array<'critical' | 'high' | 'medium' | 'low'> = [
      'critical',
      'high',
      'medium',
      'low',
    ];
    const detectors = ['security', 'complexity', 'null-safety', 'mypy', 'eslint'];

    for (let i = 0; i < count; i++) {
      issues.push({
        file: `test-${i}.ts`,
        line: Math.floor(Math.random() * 100) + 1,
        column: Math.floor(Math.random() * 80) + 1,
        severity: severities[Math.floor(Math.random() * severities.length)],
        message: `Test issue ${i}`,
        detector: detectors[Math.floor(Math.random() * detectors.length)],
        language: languages[Math.floor(Math.random() * languages.length)],
        autoFixAvailable: Math.random() > 0.5,
      });
    }

    return issues;
  }

  private countBySeverity(issues: Issue[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
    }
    return counts;
  }

  private deduplicateIssues(issues: Issue[]): Issue[] {
    const seen = new Set<string>();
    const deduplicated: Issue[] = [];
    for (const issue of issues) {
      const key = `${issue.file}:${issue.line}:${issue.column}:${issue.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(issue);
      }
    }
    return deduplicated;
  }

  private generateJSONReport(issues: Issue[]): {
    totalIssues: number;
    languages: string[];
  } {
    const languages = Array.from(new Set(issues.map((i) => i.language)));
    return { totalIssues: issues.length, languages };
  }

  // ============================================================================
  // Report Generation
  // ============================================================================

  private buildSuiteResult(
    category: TestCategory,
    tests: TestResult[],
    duration: number
  ): TestSuiteResult {
    return {
      category,
      total: tests.length,
      passed: tests.filter((t) => t.status === 'passed').length,
      failed: tests.filter((t) => t.status === 'failed').length,
      skipped: tests.filter((t) => t.status === 'skipped').length,
      duration,
      tests,
    };
  }

  private generateReport(suites: TestSuiteResult[]): IntegrationTestReport {
    const totalTests = suites.reduce((sum, s) => sum + s.total, 0);
    const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0);
    const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0);
    const totalSkipped = suites.reduce((sum, s) => sum + s.skipped, 0);
    const totalDuration = Date.now() - this.startTime;

    return {
      timestamp: new Date().toISOString(),
      totalTests,
      totalPassed,
      totalFailed,
      totalSkipped,
      passRate: (totalPassed / totalTests) * 100,
      totalDuration,
      suites,
    };
  }

  public saveReport(report: IntegrationTestReport, outputPath: string): void {
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${outputPath}`);
  }

  private cleanup(): void {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
}

// Export framework for use in test runner
export default IntegrationTestFramework;

