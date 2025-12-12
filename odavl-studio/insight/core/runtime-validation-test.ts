/**
 * Wave 2 Runtime Validation - Comprehensive Detector Test
 * Tests all detectors on all 7 runtime test projects
 */

import { AnalysisEngine } from './src/analysis-engine.js';
import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';

interface TestProject {
  name: string;
  path: string;
  patterns: string[];
  expectedIssues: number; // Minimum expected issues
}

const TEST_PROJECTS: TestProject[] = [
  {
    name: 'react-sample',
    path: '../runtime-tests/react-sample',
    patterns: ['**/*.js', '**/*.jsx'],
    expectedIssues: 5,
  },
  {
    name: 'nextjs-sample',
    path: '../runtime-tests/nextjs-sample',
    patterns: ['**/*.ts', '**/*.tsx'],
    expectedIssues: 3,
  },
  {
    name: 'node-api-sample',
    path: '../runtime-tests/node-api-sample',
    patterns: ['**/*.js'],
    expectedIssues: 3,
  },
  {
    name: 'python-sample',
    path: '../runtime-tests/python-sample',
    patterns: ['**/*.py'],
    expectedIssues: 10,
  },
  {
    name: 'go-sample',
    path: '../runtime-tests/go-sample',
    patterns: ['**/*.go'],
    expectedIssues: 5,
  },
  {
    name: 'java-sample',
    path: '../runtime-tests/java-sample',
    patterns: ['**/*.java'],
    expectedIssues: 4,
  },
  {
    name: 'rust-sample',
    path: '../runtime-tests/rust-sample',
    patterns: ['**/*.rs'],
    expectedIssues: 6,
  },
];

async function testProject(project: TestProject): Promise<{
  success: boolean;
  issues: number;
  errors: string[];
}> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${project.name}`);
  console.log(`${'='.repeat(60)}`);

  const errors: string[] = [];
  let totalIssues = 0;

  try {
    const engine = new AnalysisEngine();
    const files: string[] = [];

    for (const pattern of project.patterns) {
      const matches = glob.sync(`${project.path}/${pattern}`, {
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      });
      files.push(...matches);
    }

    console.log(`Found ${files.length} files to analyze`);
    if (files.length > 0) {
      console.log(`Sample file: ${files[0]}`);
    }

    if (files.length === 0) {
      errors.push(`No files found matching patterns: ${project.patterns.join(', ')}`);
      return { success: false, issues: 0, errors };
    }

    const results = await engine.analyze(files);
    totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    console.log(`✓ Analysis complete: ${totalIssues} issues found`);
    console.log(`  Files analyzed: ${results.length}`);
    console.log(`  Files with issues: ${results.filter(r => r.issues.length > 0).length}`);

    if (totalIssues < project.expectedIssues) {
      errors.push(
        `Expected at least ${project.expectedIssues} issues, but found only ${totalIssues}`
      );
    }

    // Show sample issues
    if (totalIssues > 0) {
      console.log('\nSample Issues:');
      const samplesShown = Math.min(3, totalIssues);
      let count = 0;
      for (const result of results) {
        if (count >= samplesShown) break;
        for (const issue of result.issues) {
          if (count >= samplesShown) break;
          console.log(`  - [${issue.severity}] ${issue.message.substring(0, 80)}`);
          count++;
        }
      }
    }

    return {
      success: errors.length === 0,
      issues: totalIssues,
      errors,
    };
  } catch (error: any) {
    errors.push(`Runtime error: ${error.message}`);
    console.error(`✗ Error: ${error.message}`);
    console.error(error.stack?.substring(0, 500));
    return { success: false, issues: totalIssues, errors };
  }
}

async function runAllTests() {
  console.log('ODAVL Insight - Wave 2 Runtime Validation');
  console.log('Testing all detectors on 7 runtime test projects\n');

  const results: Record<string, any> = {};
  let totalErrors = 0;
  let totalIssues = 0;
  let projectsPassed = 0;

  for (const project of TEST_PROJECTS) {
    const result = await testProject(project);
    results[project.name] = result;

    if (result.success) {
      projectsPassed++;
    } else {
      totalErrors += result.errors.length;
    }

    totalIssues += result.issues;
  }

  // Final Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Projects tested: ${TEST_PROJECTS.length}`);
  console.log(`Projects passed: ${projectsPassed}`);
  console.log(`Projects failed: ${TEST_PROJECTS.length - projectsPassed}`);
  console.log(`Total issues detected: ${totalIssues}`);
  console.log(`Total errors: ${totalErrors}\n`);

  if (totalErrors > 0) {
    console.log('Failed Projects:');
    for (const [name, result] of Object.entries(results)) {
      if (!result.success) {
        console.log(`\n  ${name}:`);
        for (const error of result.errors) {
          console.log(`    - ${error}`);
        }
      }
    }
  }

  // Write results to file
  const reportPath = path.join(process.cwd(), '.odavl/wave2-runtime-validation.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          projectsTested: TEST_PROJECTS.length,
          projectsPassed,
          totalIssues,
          totalErrors,
        },
        results,
      },
      null,
      2
    )
  );

  console.log(`\nReport saved to: ${reportPath}`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
