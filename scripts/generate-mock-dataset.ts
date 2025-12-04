#!/usr/bin/env node
/**
 * Generate Mock Training Dataset
 * 
 * Creates synthetic training data for ML model development
 * without requiring GitHub API access.
 * 
 * Usage:
 *   pnpm tsx scripts/generate-mock-dataset.ts --count 1000
 */

import * as fs from 'fs';
import * as path from 'path';

interface TrainingSample {
  id: string;
  language: string;
  errorType: string;
  errorMessage: string;
  beforeCode: string;
  afterCode: string;
  complexity: number;
  linesChanged: number;
  historicalSuccess: number;
  projectMaturity: number;
  testCoverage: number;
  commitUrl: string;
  timestamp: string;
  wasSuccessful: boolean;
}

/**
 * Error types and their patterns
 */
const ERROR_PATTERNS = {
  'type-error': {
    messages: [
      "Property 'xyz' does not exist on type 'Foo'",
      "Type 'string' is not assignable to type 'number'",
      "Cannot find name 'foo'",
      "Object is possibly 'undefined'",
      "Argument of type 'X' is not assignable to parameter of type 'Y'"
    ],
    before: [
      "const x: Foo = {}; x.xyz",
      "let age: number = 'twenty'",
      "function test() { return foo }",
      "const user = getUser(); user.name",
      "function greet(name: string) {} greet(123)"
    ],
    after: [
      "const x: Foo = {}; x.abc",
      "let age: number = 20",
      "function test() { return 'foo' }",
      "const user = getUser(); user?.name",
      "function greet(name: string) {} greet('Alice')"
    ],
    successRate: 0.85
  },
  'import-missing': {
    messages: [
      "Cannot find module 'lodash'",
      "Module '\"react\"' has no exported member 'useState'",
      "Cannot resolve module './utils'",
      "Relative import path '../config' not found",
      "No default export found in module"
    ],
    before: [
      "import _ from 'lodash'",
      "import { useState } from 'react'",
      "import { helper } from './utils'",
      "import config from '../config'",
      "import App from './App'"
    ],
    after: [
      "import * as _ from 'lodash'",
      "import React, { useState } from 'react'",
      "import { helper } from './utils/helper'",
      "import * as config from '../config'",
      "import { App } from './App'"
    ],
    successRate: 0.90
  },
  'runtime-error': {
    messages: [
      "Cannot read property 'length' of undefined",
      "TypeError: foo is not a function",
      "ReferenceError: x is not defined",
      "Maximum call stack size exceeded",
      "Cannot convert undefined or null to object"
    ],
    before: [
      "const len = arr.length",
      "const result = foo()",
      "console.log(x)",
      "function recurse() { recurse() }",
      "Object.keys(null)"
    ],
    after: [
      "const len = arr?.length ?? 0",
      "const result = typeof foo === 'function' ? foo() : null",
      "const x = 10; console.log(x)",
      "function recurse(depth = 0) { if (depth < 100) recurse(depth + 1) }",
      "Object.keys(obj || {})"
    ],
    successRate: 0.75
  },
  'security': {
    messages: [
      "Hardcoded API key detected",
      "SQL injection vulnerability",
      "XSS vulnerability detected",
      "Insecure random number generation",
      "Weak cryptographic algorithm"
    ],
    before: [
      "const API_KEY = 'sk_live_12345'",
      "const query = 'SELECT * FROM users WHERE id=' + userId",
      "element.innerHTML = userInput",
      "const token = Math.random().toString()",
      "crypto.createHash('md5')"
    ],
    after: [
      "const API_KEY = process.env.API_KEY",
      "const query = 'SELECT * FROM users WHERE id=?'; db.query(query, [userId])",
      "element.textContent = userInput",
      "const token = crypto.randomBytes(32).toString('hex')",
      "crypto.createHash('sha256')"
    ],
    successRate: 0.95
  },
  'performance': {
    messages: [
      "Inefficient loop detected",
      "Memory leak: Event listener not removed",
      "Unnecessary re-render",
      "Large bundle size",
      "Blocking synchronous operation"
    ],
    before: [
      "for (let i = 0; i < 1000000; i++) { arr.push(i) }",
      "element.addEventListener('click', handler)",
      "function Component() { const [x] = useState(Math.random()) }",
      "import * as _ from 'lodash'",
      "const data = fs.readFileSync('big.json')"
    ],
    after: [
      "arr = Array.from({ length: 1000000 }, (_, i) => i)",
      "element.addEventListener('click', handler); return () => element.removeEventListener('click', handler)",
      "function Component() { const [x] = useState(() => Math.random()) }",
      "import { debounce } from 'lodash-es'",
      "const data = await fs.promises.readFile('big.json')"
    ],
    successRate: 0.70
  },
  'complexity': {
    messages: [
      "Cyclomatic complexity too high",
      "Function too long (>50 lines)",
      "Too many nested blocks",
      "God class detected",
      "Duplicate code found"
    ],
    before: [
      "if (a) { if (b) { if (c) { if (d) { return x } } } }",
      "function huge() { /* 100 lines */ }",
      "for (...) { for (...) { for (...) { ... } } }",
      "class Manager { /* 50 methods */ }",
      "const sum1 = a + b; const sum2 = c + d"
    ],
    after: [
      "return a && b && c && d ? x : null",
      "function step1() { ... } function step2() { ... }",
      "const results = items.map(x => x.map(y => process(y)))",
      "class UserManager { ... } class DataManager { ... }",
      "const sum = (x, y) => x + y; const sum1 = sum(a, b); const sum2 = sum(c, d)"
    ],
    successRate: 0.65
  }
};

/**
 * Generate a random sample
 */
function generateSample(id: number, errorType: string): TrainingSample {
  const pattern = ERROR_PATTERNS[errorType as keyof typeof ERROR_PATTERNS];
  const idx = Math.floor(Math.random() * pattern.messages.length);

  // Vary success based on pattern's historical rate
  const wasSuccessful = Math.random() < pattern.successRate;

  return {
    id: `mock-${String(id).padStart(6, '0')}`,
    language: Math.random() > 0.3 ? 'typescript' : Math.random() > 0.5 ? 'javascript' : 'python',
    errorType,
    errorMessage: pattern.messages[idx],
    beforeCode: pattern.before[idx],
    afterCode: pattern.after[idx],
    complexity: Math.floor(Math.random() * 10) + 1,
    linesChanged: Math.floor(Math.random() * 20) + 1,
    historicalSuccess: pattern.successRate + (Math.random() - 0.5) * 0.1,
    projectMaturity: Math.random(),
    testCoverage: Math.random() * 100,
    commitUrl: `https://github.com/mock/repo/commit/${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    wasSuccessful
  };
}

/**
 * Generate dataset
 */
function generateDataset(count: number): TrainingSample[] {
  const samples: TrainingSample[] = [];
  const errorTypes = Object.keys(ERROR_PATTERNS);

  for (let i = 0; i < count; i++) {
    const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
    samples.push(generateSample(i + 1, errorType));
  }

  return samples;
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  let count = 1000;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--count' && i + 1 < args.length) {
      count = parseInt(args[i + 1], 10);
    }
  }

  console.log(`🎲 Generating ${count} mock training samples...`);

  const samples = generateDataset(count);

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), '.odavl', 'datasets');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'mock-training-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(samples, null, 2));

  console.log(`✅ Generated ${samples.length} samples`);
  console.log(`💾 Saved to: ${outputPath}`);

  // Statistics
  const stats = {
    total: samples.length,
    byType: {} as Record<string, number>,
    byLanguage: {} as Record<string, number>,
    successRate: samples.filter(s => s.wasSuccessful).length / samples.length
  };

  samples.forEach(s => {
    stats.byType[s.errorType] = (stats.byType[s.errorType] || 0) + 1;
    stats.byLanguage[s.language] = (stats.byLanguage[s.language] || 0) + 1;
  });

  console.log('\n📊 Statistics:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
  console.log('\n  By error type:');
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`);
  });
  console.log('\n  By language:');
  Object.entries(stats.byLanguage).forEach(([lang, count]) => {
    console.log(`    ${lang}: ${count}`);
  });
}

main().catch(console.error);
