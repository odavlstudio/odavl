/**
 * Debug test to see what issue is detected in JSON-LD
 */
import { ContextAwareSecurityDetector } from '../src/detector/context-aware-security-v3.js';
import * as path from 'node:path';

async function debug() {
  const detector = new ContextAwareSecurityDetector();
  const testFile = path.join(__dirname, '../test-fixtures/security/jsonld-safe.tsx');

  const issues = await detector.analyzeFile(testFile);

  console.log('JSON-LD Test Issues:', JSON.stringify(issues, null, 2));
  console.log(`Found ${issues.length} issues`);
}

debug().catch(console.error);
