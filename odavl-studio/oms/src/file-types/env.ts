/**
 * OMEGA-P5: Environment File Type Definition
 * Real parser for .env files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseEnvFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract variable names (keys)
    const variables = lines
      .filter((line) => /^[A-Z_][A-Z0-9_]*\s*=/.test(line.trim()))
      .map((line) => line.split('=')[0].trim());

    // Check for secrets (keywords)
    const secretKeywords = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE', 'API_KEY', 'AUTH'];
    const hasSecrets = variables.some((v) => secretKeywords.some((kw) => v.includes(kw)));

    const complexity = Math.min(100, variables.length * 2);

    return {
      path: filePath,
      type: 'env',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports: variables,
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies: [],
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'env',
      size: 0,
      complexity: 0,
      imports: [],
      exports: [],
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies: [],
    };
  }
}

export const EnvFileType: FileTypeDefinition = {
  id: 'env',
  extensions: ['.env', '.env.local', '.env.development', '.env.production'],
  category: 'config',
  riskWeight: 0.4, // Critical (secrets)
  importance: 0.8,
  parse: parseEnvFile,
};
