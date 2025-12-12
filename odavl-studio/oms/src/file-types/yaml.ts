/**
 * OMEGA-P5: YAML File Type Definition
 * Real YAML parser with safe parsing
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

/**
 * Parse YAML file and extract metadata
 * OMEGA-P5: Real implementation with line-based parsing (safe, no external deps)
 */
async function parseYAMLFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Count top-level keys
    const topLevelKeys = lines.filter((line) => {
      return /^[a-zA-Z_][\w-]*:/.test(line.trim());
    });

    // Count nested structures (indented keys)
    const nestedKeys = lines.filter((line) => {
      return /^\s{2,}[a-zA-Z_][\w-]*:/.test(line);
    });

    // Count arrays (lines starting with -)
    const arrayItems = lines.filter((line) => {
      return /^\s*-\s+/.test(line);
    });

    // Determine file type
    const isWorkflow = filePath.includes('.github/workflows') || filePath.includes('workflow');
    const isConfig = filePath.includes('config') || filePath.endsWith('.yml') || filePath.endsWith('.yaml');
    const isDocker = filePath.includes('docker-compose');

    // Calculate depth (max indentation level)
    let maxDepth = 0;
    for (const line of lines) {
      const match = line.match(/^(\s*)/);
      if (match) {
        const indentLevel = Math.floor(match[1].length / 2);
        maxDepth = Math.max(maxDepth, indentLevel);
      }
    }

    // Calculate complexity
    const complexity = Math.min(100, (topLevelKeys.length * 5) + (nestedKeys.length * 2) + (arrayItems.length) + (maxDepth * 10));

    // Extract dependencies (for docker-compose, workflows)
    const dependencies: string[] = [];
    if (isDocker) {
      const imageMatches = content.match(/image:\s*([^\s]+)/g) || [];
      dependencies.push(...imageMatches.map((m) => m.replace('image:', '').trim()));
    }

    return {
      path: filePath,
      type: 'yaml',
      size: content.length,
      complexity: Math.round(complexity),
      imports: [],
      exports: topLevelKeys.map((k) => k.split(':')[0].trim()),
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies,
    };
  } catch (error) {
    console.error(`Failed to parse YAML file ${filePath}:`, error);
    return {
      path: filePath,
      type: 'yaml',
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

/**
 * YAML File Type Definition
 * OMEGA-P5: High risk for infrastructure files
 */
export const YAMLFileType: FileTypeDefinition = {
  id: 'yaml',
  extensions: ['.yaml', '.yml'],
  category: 'infra',
  riskWeight: 0.3, // High risk (infrastructure/CI changes)
  importance: 0.6, // Important (configuration)
  parse: parseYAMLFile,
};
