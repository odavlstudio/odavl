/**
 * ODAVL Phase P4 - File-Type Detection Engine
 * 
 * This module implements the classification logic that maps
 * any file path to one of the 20 universal file types.
 * 
 * Detection Strategy:
 * 1. Pattern matching (globs like **/*.test.ts)
 * 2. Path-based rules (.odavl/logs/** → diagnostics)
 * 3. Extension mapping (.env → env)
 * 4. Fallback to sourceCode for unknown types
 */

import micromatch from 'micromatch';
import { FileType, FileTypeMetadata, DEFAULT_FILE_TYPE_METADATA } from './universal-types';

/**
 * File Type Detection Rules
 * 
 * Each rule maps a glob pattern or path segment to a file type.
 * Rules are evaluated in order (first match wins).
 */
const FILE_TYPE_RULES: Array<{ patterns: string[]; type: FileType }> = [
  // 1. Environment files (CRITICAL - check first)
  {
    patterns: ['.env', '.env.*', '*.env', 'env.*'],
    type: 'env',
  },

  // 2. Secret candidates (CRITICAL - check early)
  {
    patterns: [
      '*secret*',
      '*key*',
      '*token*',
      '*password*',
      '*credential*',
      '*api-key*',
      '*.pem',
      '*.key',
      '*.crt',
      '*.pfx',
    ],
    type: 'secretCandidates',
  },

  // 3. Infrastructure (CRITICAL)
  {
    patterns: [
      'Dockerfile',
      'Dockerfile.*',
      'docker-compose*.yml',
      'docker-compose*.yaml',
      'kubernetes/**/*',
      'k8s/**/*',
      'helm/**/*',
      'terraform/**/*',
      '*.tf',
      'infra/**/*',
      'infrastructure/**/*',
    ],
    type: 'infrastructure',
  },

  // 4. Database migrations (CRITICAL)
  {
    patterns: [
      'prisma/migrations/**/*',
      'migrations/**/*',
      'db/migrate/**/*',
      '**/migrations/**/*',
      '*.migration.ts',
      '*.migration.js',
    ],
    type: 'migrations',
  },

  // 5. ODAVL diagnostics
  {
    patterns: [
      '.odavl/logs/**/*',
      '.odavl/audit/**/*',
      '.odavl/history.json',
      '.odavl/ledger/**/*',
    ],
    type: 'diagnostics',
  },

  // 6. ODAVL datasets
  {
    patterns: ['.odavl/datasets/**/*', 'ml-data/**/*', 'data/**/*.csv', 'data/**/*.json'],
    type: 'datasets',
  },

  // 7. ML models
  {
    patterns: [
      'ml-models/**/*',
      '.odavl/ml-models/**/*',
      '*.h5',
      '*.pb',
      '*.onnx',
      '*.pt',
      '*.pth',
      '*.tflite',
      'models/**/*.pkl',
    ],
    type: 'mlModels',
  },

  // 8. Test files
  {
    patterns: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.test.js',
      '**/*.test.jsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.spec.js',
      '**/*.spec.jsx',
      '**/tests/**/*',
      '**/test/**/*',
      '**/__tests__/**/*',
    ],
    type: 'tests',
  },

  // 9. Mock files
  {
    patterns: ['**/__mocks__/**/*', '**/__fixtures__/**/*', '**/fixtures/**/*', '*.mock.ts', '*.mock.js'],
    type: 'mocks',
  },

  // 10. Visual regression snapshots
  {
    patterns: [
      'tests/visual-regression/**/*',
      '**/visual-regression/**/*',
      '**/__image_snapshots__/**/*',
      '*.snap.png',
    ],
    type: 'uiSnapshots',
  },

  // 11. Build artifacts (should be gitignored)
  {
    patterns: [
      'dist/**/*',
      'build/**/*',
      '.next/**/*',
      'out/**/*',
      '.nuxt/**/*',
      '.output/**/*',
      '*.bundle.js',
      '*.chunk.js',
    ],
    type: 'buildArtifacts',
  },

  // 12. Coverage reports
  {
    patterns: ['coverage/**/*', '.nyc_output/**/*', 'htmlcov/**/*', '.coverage'],
    type: 'coverage',
  },

  // 13. ODAVL reports
  {
    patterns: ['.odavl/reports/**/*', 'reports/**/*', '.odavl/attestation/**/*'],
    type: 'reports',
  },

  // 14. Log files
  {
    patterns: ['*.log', '*.log.*', 'logs/**/*', '**/*.log', 'error.txt', 'debug.txt'],
    type: 'logs',
  },

  // 15. Schema files
  {
    patterns: [
      '*.schema.json',
      'schema.prisma',
      '*.prisma',
      '*.graphql',
      '*.gql',
      'openapi.yaml',
      'openapi.yml',
      'swagger.json',
    ],
    type: 'schema',
  },

  // 16. Scripts
  {
    patterns: [
      'scripts/**/*',
      'tools/**/*',
      '*.sh',
      '*.ps1',
      '*.bash',
      '*.zsh',
      'Makefile',
      'Rakefile',
    ],
    type: 'scripts',
  },

  // 17. Integrations
  {
    patterns: ['integrations/**/*', 'webhooks/**/*', '**/integration/**/*'],
    type: 'integrations',
  },

  // 18. Static assets
  {
    patterns: [
      'public/**/*',
      'assets/**/*',
      'static/**/*',
      '*.png',
      '*.jpg',
      '*.jpeg',
      '*.gif',
      '*.svg',
      '*.ico',
      '*.woff',
      '*.woff2',
      '*.ttf',
      '*.eot',
    ],
    type: 'assets',
  },

  // 19. Configuration files
  {
    patterns: [
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      '*.config.cjs',
      '.eslintrc',
      '.eslintrc.*',
      '.prettierrc',
      '.prettierrc.*',
      'tsconfig.json',
      'jsconfig.json',
      'package.json',
      'pnpm-workspace.yaml',
      'turbo.json',
      'next.config.*',
      'vite.config.*',
      'vitest.config.*',
      'playwright.config.*',
      '.gitignore',
      '.dockerignore',
    ],
    type: 'config',
  },

  // 20. Source code (fallback - checked last)
  {
    patterns: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.py',
      '**/*.java',
      '**/*.kt',
      '**/*.swift',
      '**/*.go',
      '**/*.rs',
      '**/*.rb',
      '**/*.php',
      '**/*.cs',
      '**/*.cpp',
      '**/*.c',
      '**/*.h',
    ],
    type: 'sourceCode',
  },
];

/**
 * Detect File Type
 * 
 * Classifies a single file path into one of the 20 universal types.
 * 
 * @param filePath - Relative or absolute file path
 * @returns FileType classification
 * 
 * @example
 * detectFileType('src/index.ts') // → 'sourceCode'
 * detectFileType('.env.local') // → 'env'
 * detectFileType('Dockerfile') // → 'infrastructure'
 */
export function detectFileType(filePath: string): FileType {
  try {
    // Normalize path separators (Windows → Unix)
    const normalizedPath = filePath.replace(/\\/g, '/');

    // Check each rule in order (first match wins)
    for (const rule of FILE_TYPE_RULES) {
      if (micromatch.isMatch(normalizedPath, rule.patterns)) {
        return rule.type;
      }
    }

    // Fallback: treat as source code
    return 'sourceCode';
  } catch (error) {
    // Fail-safe: if pattern matching crashes, assume source code
    console.error(`[FileTypeDetection] Error detecting type for ${filePath}:`, error);
    return 'sourceCode';
  }
}

/**
 * Get File Type Metadata
 * 
 * Returns risk level, product ownership, and description for a file type.
 * 
 * @param type - File type to query
 * @returns Metadata (risk, usedBy, description)
 * 
 * @example
 * getFileTypeMetadata('env') // → { risk: 'critical', usedBy: ['insight', 'brain'], ... }
 */
export function getFileTypeMetadata(type: FileType): FileTypeMetadata {
  return DEFAULT_FILE_TYPE_METADATA[type];
}

/**
 * Classify Files
 * 
 * Groups an array of file paths by their detected types.
 * 
 * @param files - Array of file paths
 * @returns Record mapping FileType → file paths
 * 
 * @example
 * classifyFiles(['src/index.ts', '.env', 'Dockerfile'])
 * // → { sourceCode: ['src/index.ts'], env: ['.env'], infrastructure: ['Dockerfile'], ... }
 */
export function classifyFiles(files: string[]): Record<FileType, string[]> {
  try {
    const classified: Record<FileType, string[]> = {} as Record<FileType, string[]>;

    // Initialize all types with empty arrays
    for (const type of Object.keys(DEFAULT_FILE_TYPE_METADATA) as FileType[]) {
      classified[type] = [];
    }

    // Classify each file
    for (const file of files) {
      const type = detectFileType(file);
      classified[type].push(file);
    }

    return classified;
  } catch (error) {
    console.error('[FileTypeDetection] Error classifying files:', error);
    // Fail-safe: return empty classification
    return {} as Record<FileType, string[]>;
  }
}

/**
 * Map File Type to Products
 * 
 * Returns which ODAVL products use a given file type.
 * 
 * @param type - File type to query
 * @returns Array of product names ['insight', 'autopilot', 'guardian', 'brain']
 * 
 * @example
 * mapToProducts('sourceCode') // → ['insight', 'autopilot', 'brain']
 * mapToProducts('env') // → ['insight', 'brain']
 */
export function mapToProducts(type: FileType): string[] {
  try {
    const metadata = getFileTypeMetadata(type);
    return metadata.usedBy;
  } catch (error) {
    console.error(`[FileTypeDetection] Error mapping ${type} to products:`, error);
    return []; // Fail-safe: no products
  }
}

/**
 * Filter Files by Risk Level
 * 
 * Returns only files matching a specific risk level.
 * 
 * @param files - Array of file paths
 * @param risk - Risk level to filter by
 * @returns Filtered file paths
 * 
 * @example
 * filterByRisk(['src/index.ts', '.env'], 'critical') // → ['.env']
 */
export function filterByRisk(
  files: string[],
  risk: FileTypeMetadata['risk']
): string[] {
  try {
    return files.filter((file) => {
      const type = detectFileType(file);
      const metadata = getFileTypeMetadata(type);
      return metadata.risk === risk;
    });
  } catch (error) {
    console.error('[FileTypeDetection] Error filtering by risk:', error);
    return []; // Fail-safe: return empty array
  }
}

/**
 * Filter Files by Product
 * 
 * Returns only files used by a specific ODAVL product.
 * 
 * @param files - Array of file paths
 * @param product - Product name ('insight' | 'autopilot' | 'guardian' | 'brain')
 * @returns Filtered file paths
 * 
 * @example
 * filterByProduct(['src/index.ts', 'coverage/lcov.info'], 'insight')
 * // → ['src/index.ts', 'coverage/lcov.info']
 */
export function filterByProduct(
  files: string[],
  product: 'insight' | 'autopilot' | 'guardian' | 'brain'
): string[] {
  try {
    return files.filter((file) => {
      const type = detectFileType(file);
      const products = mapToProducts(type);
      return products.includes(product);
    });
  } catch (error) {
    console.error('[FileTypeDetection] Error filtering by product:', error);
    return []; // Fail-safe: return empty array
  }
}

/**
 * Get Statistics
 * 
 * Returns file type distribution and risk breakdown.
 * 
 * @param files - Array of file paths
 * @returns Statistics object
 * 
 * @example
 * getStatistics(['src/a.ts', 'src/b.ts', '.env'])
 * // → { total: 3, byType: { sourceCode: 2, env: 1 }, byRisk: { high: 2, critical: 1 } }
 */
export function getStatistics(files: string[]): {
  total: number;
  byType: Record<FileType, number>;
  byRisk: Record<FileTypeMetadata['risk'], number>;
} {
  try {
    const classified = classifyFiles(files);

    const byType: Record<FileType, number> = {} as Record<FileType, number>;
    const byRisk: Record<FileTypeMetadata['risk'], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const [type, typedFiles] of Object.entries(classified)) {
      const count = typedFiles.length;
      byType[type as FileType] = count;

      const metadata = getFileTypeMetadata(type as FileType);
      byRisk[metadata.risk] += count;
    }

    return {
      total: files.length,
      byType,
      byRisk,
    };
  } catch (error) {
    console.error('[FileTypeDetection] Error calculating statistics:', error);
    return {
      total: 0,
      byType: {} as Record<FileType, number>,
      byRisk: { low: 0, medium: 0, high: 0, critical: 0 },
    };
  }
}
