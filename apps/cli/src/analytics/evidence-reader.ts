import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Evidence file structure from ODAVL evidence collection system
 * Represents parsed evidence data with type safety and validation
 */
export interface EvidenceFile {
  id: string;
  timestamp: string;
  type: 'metric' | 'action' | 'decision' | 'outcome' | 'audit';
  source: string;
  data: Record<string, unknown>;
  context: EvidenceContext;
}

/**
 * Evidence context information including phase, system, and project details
 */
interface EvidenceContext {
  phase?: string;
  cycleDuration?: number;
  system?: {
    version?: string;
    environment?: string;
    hostname?: string;
  };
  project?: {
    name?: string;
    repository?: string;
    branch?: string;
  };
}

/**
 * Safe evidence file reader with error handling and type validation
 * Provides read-only access to ODAVL evidence collection without modification
 */
export class EvidenceReader {
  /**
   * Read and parse all evidence files from specified directory
   * @param directory Path to evidence directory
   * @returns Array of parsed evidence files, empty on error
   */
  async readEvidenceFiles(directory: string): Promise<EvidenceFile[]> {
    try {
      const files = await readdir(directory);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      const evidencePromises = jsonFiles.map(f => 
        this.parseEvidenceFile(join(directory, f))
      );
      
      const results = await Promise.allSettled(evidencePromises);
      return results
        .filter((r): r is PromiseFulfilledResult<EvidenceFile> => 
          r.status === 'fulfilled' && r.value !== null
        )
        .map(r => r.value);
    } catch {
      return [];
    }
  }

  /**
   * Parse single evidence file with validation
   * @param filePath Full path to evidence JSON file
   * @returns Parsed evidence or null on error
   */
  async parseEvidenceFile(filePath: string): Promise<EvidenceFile | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      return this.validateEvidenceStructure(data) ? data : null;
    } catch {
      return null;
    }
  }

  /**
   * Validate evidence file structure with type guard
   * @param data Unknown data to validate
   * @returns True if data matches EvidenceFile interface
   */
  validateEvidenceStructure(data: unknown): data is EvidenceFile {
    if (!data || typeof data !== 'object') return false;
    
    const obj = data as Record<string, unknown>;
    return typeof obj.id === 'string' &&
           typeof obj.timestamp === 'string' &&
           typeof obj.type === 'string' &&
           typeof obj.source === 'string' &&
           typeof obj.data === 'object' &&
           typeof obj.context === 'object';
  }
}