/**
 * OMEGA-P5: Dockerfile File Type Definition
 * Real parser for Dockerfiles
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseDockerfile(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract base image
    const fromMatch = content.match(/^FROM\s+([^\s]+)/m);
    const baseImage = fromMatch ? fromMatch[1] : '';

    // Count instructions
    const instructions = lines.filter((line) => /^(FROM|RUN|COPY|ADD|ENV|EXPOSE|CMD|ENTRYPOINT|WORKDIR|VOLUME|USER|ARG|LABEL)/i.test(line.trim()));

    // Count layers (RUN, COPY, ADD)
    const layers = lines.filter((line) => /^(RUN|COPY|ADD)/i.test(line.trim())).length;

    // Extract exposed ports
    const ports = content.match(/^EXPOSE\s+(\d+)/gm) || [];
    const exposedPorts = ports.map((p) => p.match(/\d+/)?.[0] || '').filter(Boolean);

    const complexity = Math.min(100, (instructions.length * 3) + (layers * 5));

    return {
      path: filePath,
      type: 'dockerfile',
      size: content.length,
      complexity: Math.round(complexity),
      imports: baseImage ? [baseImage] : [],
      exports: exposedPorts,
      functions: 0,
      classes: 0,
      interfaces: 0,
      hasTests: false,
      dependencies: [],
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'dockerfile',
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

export const DockerfileType: FileTypeDefinition = {
  id: 'dockerfile',
  extensions: ['Dockerfile', '.dockerfile'],
  category: 'infra',
  riskWeight: 0.3, // High (container config)
  importance: 0.7,
  parse: parseDockerfile,
};
