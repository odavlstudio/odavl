/**
 * OMEGA-P5: Docker Compose File Type Definition
 * Real parser for docker-compose files
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { FileMetadata, FileTypeDefinition } from './ts.js';

async function parseDockerCompose(filePath: string): Promise<FileMetadata> {
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    // Count services
    const services = lines.filter((line) => /^\s{2}\w+:\s*$/.test(line) && !line.includes('services:')).length;

    // Extract service names
    const serviceNames = lines
      .filter((line) => /^\s{2}\w+:\s*$/.test(line) && !line.includes('services:'))
      .map((line) => line.trim().replace(':', ''));

    // Count volumes
    const volumes = (content.match(/volumes:/g) || []).length;

    // Count networks
    const networks = (content.match(/networks:/g) || []).length;

    // Extract images
    const images = content.match(/image:\s*([^\s]+)/g) || [];
    const imageNames = images.map((img) => img.replace('image:', '').trim());

    const complexity = Math.min(100, (services * 15) + (volumes * 5) + (networks * 5));

    return {
      path: filePath,
      type: 'docker-compose',
      size: content.length,
      complexity: Math.round(complexity),
      imports: imageNames,
      exports: serviceNames,
      functions: 0,
      classes: services,
      interfaces: 0,
      hasTests: false,
      dependencies: [],
    };
  } catch (error) {
    return {
      path: filePath,
      type: 'docker-compose',
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

export const DockerComposeType: FileTypeDefinition = {
  id: 'docker-compose',
  extensions: ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'],
  category: 'infra',
  riskWeight: 0.3, // High (orchestration)
  importance: 0.8,
  parse: parseDockerCompose,
};
