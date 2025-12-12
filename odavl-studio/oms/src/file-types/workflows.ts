/**
 * OMEGA-P5: GitHub Workflows File Type Definition
 * Real parser for .github/workflows/*.yml files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseWorkflowFile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Count jobs
    const jobs = lines.filter((line) => /^\s{2}\w+:\s*$/.test(line) && !line.includes('jobs:')).length;

    // Count steps
    const steps = (content.match(/- name:/g) || []).length;

    // Extract actions used
    const actions = content.match(/uses:\s*([^\s]+)/g) || [];
    const actionNames = actions.map((a) => a.replace('uses:', '').trim());

    // Count triggers
    const triggers = (content.match(/^on:/gm) || []).length;

    const complexity = Math.min(100, (jobs * 10) + (steps * 2) + (triggers * 5));

    return {
      path: filePath,
      type: 'workflows',
      size: content.length,
      complexity: Math.round(complexity),
      imports: actionNames,
      exports: [],
      functions: steps,
      classes: jobs,
      interfaces: 0,
      hasTests: false,
      dependencies: actionNames,
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'workflows',
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

export const WorkflowsFileType: FileTypeDefinition = {
  id: 'workflows',
  extensions: ['.github/workflows/*.yml', '.github/workflows/*.yaml'],
  category: 'infra',
  riskWeight: 0.3,
  importance: 0.6,
  parse: parseWorkflowFile,
};
