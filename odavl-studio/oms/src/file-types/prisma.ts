/**
 * OMEGA-P5: Prisma Schema File Type Definition
 * Real parser for .prisma files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parsePrismaFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Count models
    const models = (content.match(/^model\s+\w+\s*{/gm) || []).length;

    // Count enums
    const enums = (content.match(/^enum\s+\w+\s*{/gm) || []).length;

    // Extract model names
    const modelNames = content.match(/^model\s+(\w+)\s*{/gm) || [];
    const exports = modelNames.map((m) => m.match(/model\s+(\w+)/)?.[1] || '').filter(Boolean);

    // Count fields (approx)
    const fields = lines.filter((line) => /^\s+\w+\s+\w+/.test(line)).length;

    // Count relations
    const relations = (content.match(/@relation/g) || []).length;

    const complexity = Math.min(100, (models * 15) + (enums * 5) + (relations * 3));

    return {
      path: filePath,
      type: 'prisma',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports,
      functions: 0,
      classes: models,
      interfaces: enums,
      hasTests: false,
      dependencies: [],
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'prisma',
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

export const PrismaFileType: FileTypeDefinition = {
  id: 'prisma',
  extensions: ['.prisma'],
  category: 'code',
  riskWeight: 0.3, // High (database schema)
  importance: 0.9,
  parse: parsePrismaFile,
};
