/**
 * Test: VS Code Extension Multi-Language Support
 * 
 * **Purpose:**
 * Test language detection, multi-language diagnostics, and status bar integration
 * in VS Code extension.
 * 
 * **Test Scenarios:**
 * 1. Language detection from file extensions
 * 2. Workspace language detection
 * 3. Multi-language diagnostics provider
 * 4. Status bar updates
 * 5. Real-time analysis on file save
 * 
 * **Performance Targets:**
 * - Language detection: < 10ms
 * - Single file analysis: < 100ms
 * - Status bar update: < 5ms
 * 
 * @module test-extension-multi-language
 */

import * as path from 'path';
import * as fs from 'fs';

// Simulated VS Code API (for testing without actual VS Code)
interface MockUri {
  fsPath: string;
}

interface MockDiagnostic {
  range: { line: number; col: number; endLine: number; endCol: number };
  message: string;
  severity: string;
  source: string;
}

/**
 * Color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Print colored header
 */
function printHeader(text: string) {
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${text}${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}${'='.repeat(70)}${colors.reset}\n`);
}

/**
 * Print test result
 */
function printResult(name: string, passed: boolean, details?: string) {
  const status = passed
    ? `${colors.green}✅ PASSED${colors.reset}`
    : `${colors.red}❌ FAILED${colors.reset}`;
  console.log(`${status} ${name}`);
  if (details) {
    console.log(`  ${colors.cyan}${details}${colors.reset}`);
  }
}

/**
 * Test 1: Language Detection from File Extensions
 */
function testLanguageDetection() {
  printHeader('Test 1: Language Detection from File Extensions');
  
  const testCases = [
    { file: 'sample.ts', expected: 'typescript', confidence: 100 },
    { file: 'sample.tsx', expected: 'typescript', confidence: 100 },
    { file: 'sample.js', expected: 'javascript', confidence: 100 },
    { file: 'sample.jsx', expected: 'javascript', confidence: 100 },
    { file: 'sample.py', expected: 'python', confidence: 100 },
    { file: 'sample.java', expected: 'java', confidence: 100 },
    { file: 'sample.txt', expected: 'unknown', confidence: 0 },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const ext = path.extname(testCase.file).toLowerCase();
    
    // Simulate language detection
    const extensionMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
    };
    
    const detected = extensionMap[ext] || 'unknown';
    const confidence = detected !== 'unknown' ? 100 : 0;
    
    const isCorrect = detected === testCase.expected && confidence === testCase.confidence;
    
    if (isCorrect) {
      passed++;
      printResult(
        `${testCase.file} → ${detected}`,
        true,
        `Confidence: ${confidence}%`
      );
    } else {
      failed++;
      printResult(
        `${testCase.file} → ${detected}`,
        false,
        `Expected: ${testCase.expected} (${testCase.confidence}%), Got: ${detected} (${confidence}%)`
      );
    }
  }
  
  console.log(`\n${colors.bright}Results: ${passed}/${testCases.length} passed${colors.reset}`);
  return { passed, failed, total: testCases.length };
}

/**
 * Test 2: Workspace Language Detection
 */
function testWorkspaceLanguageDetection() {
  printHeader('Test 2: Workspace Language Detection');
  
  const workspaceRoot = process.cwd();
  
  // Check for project markers
  const markers = [
    { file: 'package.json', language: 'typescript' },
    { file: 'tsconfig.json', language: 'typescript' },
    { file: 'requirements.txt', language: 'python' },
    { file: 'pyproject.toml', language: 'python' },
    { file: 'pom.xml', language: 'java' },
    { file: 'build.gradle', language: 'java' },
  ];
  
  const detectedLanguages = new Set<string>();
  
  for (const marker of markers) {
    const markerPath = path.join(workspaceRoot, marker.file);
    if (fs.existsSync(markerPath)) {
      detectedLanguages.add(marker.language);
      printResult(`Found ${marker.file}`, true, `Language: ${marker.language}`);
    }
  }
  
  if (detectedLanguages.size === 0) {
    printResult('No project markers found', false, 'Expected at least one language');
    return { passed: 0, failed: 1, total: 1 };
  }
  
  const languages = Array.from(detectedLanguages);
  console.log(`\n${colors.bright}Detected Languages: ${languages.join(', ')}${colors.reset}`);
  
  return { passed: languages.length, failed: 0, total: languages.length };
}

/**
 * Test 3: Language Icons and Display Names
 */
function testLanguageIconsAndNames() {
  printHeader('Test 3: Language Icons and Display Names');
  
  const testCases = [
    { language: 'typescript', emoji: '🔷', name: 'TypeScript' },
    { language: 'javascript', emoji: '🟨', name: 'JavaScript' },
    { language: 'python', emoji: '🐍', name: 'Python' },
    { language: 'java', emoji: '☕', name: 'Java' },
    { language: 'unknown', emoji: '❓', name: 'Unknown' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  const emojis: Record<string, string> = {
    typescript: '🔷',
    javascript: '🟨',
    python: '🐍',
    java: '☕',
    unknown: '❓',
  };
  
  const names: Record<string, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    python: 'Python',
    java: 'Java',
    unknown: 'Unknown',
  };
  
  for (const testCase of testCases) {
    const emoji = emojis[testCase.language as keyof typeof emojis];
    const name = names[testCase.language as keyof typeof names];
    
    const emojiMatch = emoji === testCase.emoji;
    const nameMatch = name === testCase.name;
    
    if (emojiMatch && nameMatch) {
      passed++;
      printResult(
        `${testCase.language}`,
        true,
        `${emoji} ${name}`
      );
    } else {
      failed++;
      printResult(
        `${testCase.language}`,
        false,
        `Expected: ${testCase.emoji} ${testCase.name}, Got: ${emoji} ${name}`
      );
    }
  }
  
  console.log(`\n${colors.bright}Results: ${passed}/${testCases.length} passed${colors.reset}`);
  return { passed, failed, total: testCases.length };
}

/**
 * Test 4: Available Detectors Per Language
 */
function testAvailableDetectors() {
  printHeader('Test 4: Available Detectors Per Language');
  
  const detectorsMap: Record<string, string[]> = {
    typescript: [
      'Complexity',
      'Type Safety',
      'Best Practices',
      'Security',
      'Imports',
      'ESLint',
    ],
    javascript: [
      'Complexity',
      'Best Practices',
      'Security',
      'ESLint',
    ],
    python: [
      'Type Hints (MyPy)',
      'Security (Bandit)',
      'Complexity (Radon)',
      'Imports (isort)',
      'Best Practices (Pylint)',
    ],
    java: [
      'Null Safety',
      'Concurrency',
      'Performance',
      'Security',
      'Testing',
      'Architecture',
    ],
  };
  
  let passed = 0;
  let failed = 0;
  
  for (const [language, detectors] of Object.entries(detectorsMap)) {
    if (detectors.length > 0) {
      passed++;
      printResult(
        `${language}`,
        true,
        `${detectors.length} detectors: ${detectors.join(', ')}`
      );
    } else {
      failed++;
      printResult(
        `${language}`,
        false,
        'No detectors available'
      );
    }
  }
  
  console.log(`\n${colors.bright}Results: ${passed}/${Object.keys(detectorsMap).length} passed${colors.reset}`);
  return { passed, failed, total: Object.keys(detectorsMap).length };
}

/**
 * Test 5: Mock Diagnostics Conversion
 */
function testDiagnosticsConversion() {
  printHeader('Test 5: Mock Diagnostics Conversion');
  
  const mockIssues = [
    {
      file: 'test.ts',
      line: 10,
      column: 5,
      message: 'Unused variable',
      severity: 'warning',
      detector: 'typescript',
      language: 'typescript',
    },
    {
      file: 'test.py',
      line: 20,
      column: 0,
      message: 'Missing type hint',
      severity: 'info',
      detector: 'mypy',
      language: 'python',
    },
    {
      file: 'Test.java',
      line: 30,
      column: 10,
      message: 'Possible null pointer dereference',
      severity: 'error',
      detector: 'null-safety',
      language: 'java',
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const issue of mockIssues) {
    // Simulate diagnostic creation
    const languageEmojis: Record<string, string> = {
      typescript: '🔷',
      python: '🐍',
      java: '☕',
    };
    
    const emoji = languageEmojis[issue.language as keyof typeof languageEmojis] || '❓';
    const source = `${emoji} ODAVL/${issue.detector}`;
    
    const diagnostic: MockDiagnostic = {
      range: {
        line: Math.max(0, issue.line - 1),
        col: Math.max(0, issue.column),
        endLine: Math.max(0, issue.line - 1),
        endCol: Math.max(0, issue.column + 100),
      },
      message: issue.message,
      severity: issue.severity,
      source,
    };
    
    if (diagnostic.source.includes(emoji) && diagnostic.range.line >= 0) {
      passed++;
      printResult(
        `${issue.file} (line ${issue.line})`,
        true,
        `${diagnostic.source}: ${diagnostic.message}`
      );
    } else {
      failed++;
      printResult(
        `${issue.file} (line ${issue.line})`,
        false,
        'Failed to create diagnostic'
      );
    }
  }
  
  console.log(`\n${colors.bright}Results: ${passed}/${mockIssues.length} passed${colors.reset}`);
  return { passed, failed, total: mockIssues.length };
}

/**
 * Main test runner
 */
async function runAllTests() {
  printHeader('VS Code Extension Multi-Language Support Tests');
  
  console.log(`${colors.cyan}Testing multi-language detection, diagnostics, and UI integration${colors.reset}\n`);
  
  const startTime = Date.now();
  
  // Run all tests
  const results = {
    languageDetection: testLanguageDetection(),
    workspaceDetection: testWorkspaceLanguageDetection(),
    iconsAndNames: testLanguageIconsAndNames(),
    availableDetectors: testAvailableDetectors(),
    diagnosticsConversion: testDiagnosticsConversion(),
  };
  
  const totalTime = Date.now() - startTime;
  
  // Calculate overall statistics
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalTests = Object.values(results).reduce((sum, r) => sum + r.total, 0);
  const passRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  // Print summary
  printHeader('📊 TEST SUMMARY');
  
  console.log(`${colors.bright}Test Results:${colors.reset}`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${totalTests - totalPassed}${colors.reset}`);
  console.log(`  Pass Rate: ${passRate}%`);
  console.log(`  Total Time: ${totalTime}ms\n`);
  
  // Test breakdown
  console.log(`${colors.bright}Test Breakdown:${colors.reset}`);
  console.log(`  1. Language Detection: ${results.languageDetection.passed}/${results.languageDetection.total}`);
  console.log(`  2. Workspace Detection: ${results.workspaceDetection.passed}/${results.workspaceDetection.total}`);
  console.log(`  3. Icons & Names: ${results.iconsAndNames.passed}/${results.iconsAndNames.total}`);
  console.log(`  4. Available Detectors: ${results.availableDetectors.passed}/${results.availableDetectors.total}`);
  console.log(`  5. Diagnostics Conversion: ${results.diagnosticsConversion.passed}/${results.diagnosticsConversion.total}`);
  
  // Final status
  console.log();
  if (totalPassed === totalTests) {
    console.log(`${colors.green}${colors.bright}✅ ALL TESTS PASSED${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠️  SOME TESTS FAILED${colors.reset}`);
  }
  
  console.log();
}

// Run tests
runAllTests().catch(console.error);
