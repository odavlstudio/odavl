/**
 * OMEGA-P5: SQL File Type Definition
 * Real parser for .sql files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseSQLFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Count statements
    const creates = (content.match(/CREATE\s+(TABLE|INDEX|VIEW|FUNCTION|PROCEDURE)/gi) || []).length;
    const alters = (content.match(/ALTER\s+TABLE/gi) || []).length;
    const drops = (content.match(/DROP\s+(TABLE|INDEX|VIEW)/gi) || []).length;
    const selects = (content.match(/SELECT\s+/gi) || []).length;
    const inserts = (content.match(/INSERT\s+INTO/gi) || []).length;

    // Check for migrations
    const isMigration = filePath.includes('migration') || filePath.includes('migrate');

    const complexity = Math.min(100, (creates * 10) + (alters * 8) + (drops * 5) + (selects * 2) + (inserts * 3));

    return {
      path: filePath,
      type: 'sql',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports: [],
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies: [],
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'sql',
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

export const SQLFileType: FileTypeDefinition = {
  id: 'sql',
  extensions: ['.sql'],
  category: 'code',
  riskWeight: 0.4, // Critical (database operations)
  importance: 0.8,
  parse: parseSQLFile,
};
