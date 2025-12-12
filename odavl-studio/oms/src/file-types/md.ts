/**
 * OMEGA-P5: Markdown File Type Definition
 * Real parser for .md files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseMarkdownFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Count headings
    const headings = lines.filter((line) => /^#{1,6}\s+/.test(line)).length;

    // Count links
    const links = (content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || []).length;

    // Count code blocks
    const codeBlocks = (content.match(/```[\s\S]*?```/g) || []).length;

    // Count images
    const images = (content.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || []).length;

    // Extract internal links (relative paths)
    const internalLinks = content.match(/\]\((?!http)([^)]+)\)/g) || [];
    const linkedFiles = internalLinks.map((link) => link.replace(/\]\(([^)]+)\)/, '$1')).filter(Boolean);

    const complexity = Math.min(100, (headings * 2) + (links * 1) + (codeBlocks * 5) + (lines.length / 20));

    return {
      path: filePath,
      type: 'markdown',
      size: content.length,
      complexity: Math.round(complexity),
      imports: linkedFiles,
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
      type: 'markdown',
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

export const MarkdownFileType: FileTypeDefinition = {
  id: 'markdown',
  extensions: ['.md', '.markdown'],
  category: 'docs',
  riskWeight: 0.1,
  importance: 0.3,
  parse: parseMarkdownFile,
};
