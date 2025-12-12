/**
 * ODAVL Phase P4 - File-Type Detection Tests
 * Comprehensive test suite for the universal file-type system
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectFileType,
  getFileTypeMetadata,
  classifyFiles,
  mapToProducts,
  filterByRisk,
  filterByProduct,
  getStatistics,
} from '../file-type-detection';
import { FileType } from '../universal-types';

describe('File-Type Detection Engine', () => {
  describe('detectFileType()', () => {
    it('should detect source code files', () => {
      expect(detectFileType('src/index.ts')).toBe('sourceCode');
      expect(detectFileType('lib/utils.tsx')).toBe('sourceCode');
      expect(detectFileType('app/main.js')).toBe('sourceCode');
      expect(detectFileType('components/Button.jsx')).toBe('sourceCode');
      expect(detectFileType('server/api.py')).toBe('sourceCode');
      expect(detectFileType('models/User.java')).toBe('sourceCode');
    });

    it('should detect environment files as critical', () => {
      expect(detectFileType('.env')).toBe('env');
      expect(detectFileType('.env.local')).toBe('env');
      expect(detectFileType('.env.production')).toBe('env');
      expect(detectFileType('config.env')).toBe('env');
    });

    it('should detect secret candidates as critical', () => {
      expect(detectFileType('api-key.txt')).toBe('secretCandidates');
      expect(detectFileType('secrets.json')).toBe('secretCandidates');
      expect(detectFileType('private-key.pem')).toBe('secretCandidates');
      expect(detectFileType('token.txt')).toBe('secretCandidates');
      expect(detectFileType('credentials.yml')).toBe('secretCandidates');
    });

    it('should detect infrastructure files', () => {
      expect(detectFileType('Dockerfile')).toBe('infrastructure');
      expect(detectFileType('docker-compose.yml')).toBe('infrastructure');
      expect(detectFileType('kubernetes/deployment.yaml')).toBe('infrastructure');
      expect(detectFileType('terraform/main.tf')).toBe('infrastructure');
      expect(detectFileType('infra/config.yml')).toBe('infrastructure');
    });

    it('should detect database migrations', () => {
      expect(detectFileType('prisma/migrations/001_init.sql')).toBe('migrations');
      expect(detectFileType('migrations/20230101_create_users.ts')).toBe('migrations');
      expect(detectFileType('db/migrate/001_setup.rb')).toBe('migrations');
    });

    it('should detect test files', () => {
      expect(detectFileType('src/utils.test.ts')).toBe('tests');
      expect(detectFileType('components/Button.spec.tsx')).toBe('tests');
      expect(detectFileType('tests/integration/api.test.js')).toBe('tests');
      expect(detectFileType('__tests__/unit/parser.test.ts')).toBe('tests');
    });

    it('should detect mock files', () => {
      expect(detectFileType('__mocks__/axios.ts')).toBe('mocks');
      expect(detectFileType('__fixtures__/user.json')).toBe('mocks');
      expect(detectFileType('tests/fixtures/sample-data.ts')).toBe('mocks');
    });

    it('should detect configuration files', () => {
      expect(detectFileType('next.config.js')).toBe('config');
      expect(detectFileType('tsconfig.json')).toBe('config');
      expect(detectFileType('.eslintrc.js')).toBe('config');
      expect(detectFileType('vite.config.ts')).toBe('config');
      expect(detectFileType('package.json')).toBe('config');
    });

    it('should detect schema files', () => {
      expect(detectFileType('schema.prisma')).toBe('schema');
      expect(detectFileType('api.schema.json')).toBe('schema');
      expect(detectFileType('schema.graphql')).toBe('schema');
      expect(detectFileType('openapi.yaml')).toBe('schema');
    });

    it('should detect scripts', () => {
      expect(detectFileType('scripts/build.sh')).toBe('scripts');
      expect(detectFileType('tools/deploy.ps1')).toBe('scripts');
      expect(detectFileType('Makefile')).toBe('scripts');
    });

    it('should detect ML models', () => {
      expect(detectFileType('ml-models/classifier.h5')).toBe('mlModels');
      expect(detectFileType('.odavl/ml-models/trust-predictor.pb')).toBe('mlModels');
      expect(detectFileType('models/trained.onnx')).toBe('mlModels');
    });

    it('should detect datasets', () => {
      expect(detectFileType('.odavl/datasets/training.json')).toBe('datasets');
      expect(detectFileType('ml-data/samples.csv')).toBe('datasets');
      expect(detectFileType('data/test-cases.json')).toBe('datasets');
    });

    it('should detect ODAVL diagnostics', () => {
      expect(detectFileType('.odavl/logs/odavl.log')).toBe('diagnostics');
      expect(detectFileType('.odavl/audit/run-123.json')).toBe('diagnostics');
      expect(detectFileType('.odavl/history.json')).toBe('diagnostics');
    });

    it('should detect log files', () => {
      expect(detectFileType('error.log')).toBe('logs');
      expect(detectFileType('logs/app.log')).toBe('logs');
      expect(detectFileType('debug.txt')).toBe('logs');
    });

    it('should detect build artifacts', () => {
      expect(detectFileType('dist/index.js')).toBe('buildArtifacts');
      expect(detectFileType('.next/server/pages/index.js')).toBe('buildArtifacts');
      expect(detectFileType('build/bundle.js')).toBe('buildArtifacts');
    });

    it('should detect coverage reports', () => {
      expect(detectFileType('coverage/lcov.info')).toBe('coverage');
      expect(detectFileType('.nyc_output/coverage.json')).toBe('coverage');
    });

    it('should detect ODAVL reports', () => {
      expect(detectFileType('.odavl/reports/insight.json')).toBe('reports');
      expect(detectFileType('reports/guardian-results.json')).toBe('reports');
    });

    it('should detect static assets', () => {
      expect(detectFileType('public/logo.png')).toBe('assets');
      expect(detectFileType('assets/styles.css')).toBe('assets');
      expect(detectFileType('static/favicon.ico')).toBe('assets');
    });

    it('should detect visual regression snapshots', () => {
      expect(detectFileType('tests/visual-regression/homepage.snap.png')).toBe('uiSnapshots');
      expect(detectFileType('__image_snapshots__/test.png')).toBe('uiSnapshots');
    });

    it('should detect integration files', () => {
      expect(detectFileType('integrations/github/webhook.ts')).toBe('integrations');
      expect(detectFileType('webhooks/slack.js')).toBe('integrations');
    });

    it('should handle Windows-style paths', () => {
      expect(detectFileType('src\\index.ts')).toBe('sourceCode');
      expect(detectFileType('.odavl\\logs\\app.log')).toBe('diagnostics');
    });

    it('should fallback to sourceCode for unknown types', () => {
      expect(detectFileType('unknown.xyz')).toBe('sourceCode');
      expect(detectFileType('random-file')).toBe('sourceCode');
    });
  });

  describe('getFileTypeMetadata()', () => {
    it('should return correct metadata for sourceCode', () => {
      const metadata = getFileTypeMetadata('sourceCode');
      expect(metadata.risk).toBe('high');
      expect(metadata.usedBy).toContain('insight');
      expect(metadata.usedBy).toContain('autopilot');
      expect(metadata.description).toContain('source code');
    });

    it('should return critical risk for env files', () => {
      const metadata = getFileTypeMetadata('env');
      expect(metadata.risk).toBe('critical');
      expect(metadata.usedBy).toContain('insight');
      expect(metadata.usedBy).toContain('brain');
    });

    it('should return critical risk for infrastructure', () => {
      const metadata = getFileTypeMetadata('infrastructure');
      expect(metadata.risk).toBe('critical');
      expect(metadata.usedBy).toContain('guardian');
    });

    it('should return low risk for logs', () => {
      const metadata = getFileTypeMetadata('logs');
      expect(metadata.risk).toBe('low');
    });

    it('should return medium risk for tests', () => {
      const metadata = getFileTypeMetadata('tests');
      expect(metadata.risk).toBe('medium');
    });

    it('should return metadata for all 20 types', () => {
      const types: FileType[] = [
        'sourceCode',
        'config',
        'infrastructure',
        'tests',
        'mocks',
        'logs',
        'diagnostics',
        'datasets',
        'mlModels',
        'migrations',
        'env',
        'scripts',
        'schema',
        'assets',
        'uiSnapshots',
        'integrations',
        'buildArtifacts',
        'coverage',
        'reports',
        'secretCandidates',
      ];

      types.forEach((type) => {
        const metadata = getFileTypeMetadata(type);
        expect(metadata).toBeDefined();
        expect(metadata.risk).toBeDefined();
        expect(metadata.usedBy).toBeDefined();
        expect(metadata.description).toBeDefined();
      });
    });
  });

  describe('classifyFiles()', () => {
    it('should group files by type', () => {
      const files = [
        'src/index.ts',
        'src/utils.ts',
        '.env',
        'Dockerfile',
        'tests/app.test.ts',
      ];

      const classified = classifyFiles(files);

      expect(classified.sourceCode).toEqual(['src/index.ts', 'src/utils.ts']);
      expect(classified.env).toEqual(['.env']);
      expect(classified.infrastructure).toEqual(['Dockerfile']);
      expect(classified.tests).toEqual(['tests/app.test.ts']);
    });

    it('should handle empty array', () => {
      const classified = classifyFiles([]);
      expect(Object.keys(classified).length).toBeGreaterThan(0); // All types initialized
      expect(classified.sourceCode).toEqual([]);
    });

    it('should handle files of mixed types', () => {
      const files = [
        'package.json',
        'tsconfig.json',
        'src/main.ts',
        'coverage/lcov.info',
        '.odavl/logs/app.log',
      ];

      const classified = classifyFiles(files);

      expect(classified.config.length).toBe(2);
      expect(classified.sourceCode.length).toBe(1);
      expect(classified.coverage.length).toBe(1);
      expect(classified.diagnostics.length).toBe(1);
    });
  });

  describe('mapToProducts()', () => {
    it('should map sourceCode to insight, autopilot, brain', () => {
      const products = mapToProducts('sourceCode');
      expect(products).toContain('insight');
      expect(products).toContain('autopilot');
      expect(products).toContain('brain');
    });

    it('should map tests to insight, guardian', () => {
      const products = mapToProducts('tests');
      expect(products).toContain('insight');
      expect(products).toContain('guardian');
    });

    it('should map env to insight, brain', () => {
      const products = mapToProducts('env');
      expect(products).toContain('insight');
      expect(products).toContain('brain');
      expect(products).not.toContain('autopilot');
    });

    it('should map buildArtifacts to no products', () => {
      const products = mapToProducts('buildArtifacts');
      expect(products).toEqual([]);
    });
  });

  describe('filterByRisk()', () => {
    const files = [
      'src/index.ts', // high
      '.env', // critical
      'tests/app.test.ts', // medium
      'logs/error.log', // low
      'Dockerfile', // critical
    ];

    it('should filter critical risk files', () => {
      const critical = filterByRisk(files, 'critical');
      expect(critical).toContain('.env');
      expect(critical).toContain('Dockerfile');
      expect(critical.length).toBe(2);
    });

    it('should filter high risk files', () => {
      const high = filterByRisk(files, 'high');
      expect(high).toContain('src/index.ts');
    });

    it('should filter medium risk files', () => {
      const medium = filterByRisk(files, 'medium');
      expect(medium).toContain('tests/app.test.ts');
    });

    it('should filter low risk files', () => {
      const low = filterByRisk(files, 'low');
      expect(low).toContain('logs/error.log');
    });
  });

  describe('filterByProduct()', () => {
    const files = [
      'src/index.ts', // insight, autopilot, brain
      'tests/app.test.ts', // insight, guardian
      '.env', // insight, brain
      'coverage/lcov.info', // insight, guardian
    ];

    it('should filter files used by insight', () => {
      const insightFiles = filterByProduct(files, 'insight');
      expect(insightFiles.length).toBe(4); // All files
    });

    it('should filter files used by autopilot', () => {
      const autopilotFiles = filterByProduct(files, 'autopilot');
      expect(autopilotFiles).toContain('src/index.ts');
      expect(autopilotFiles.length).toBe(1);
    });

    it('should filter files used by guardian', () => {
      const guardianFiles = filterByProduct(files, 'guardian');
      expect(guardianFiles).toContain('tests/app.test.ts');
      expect(guardianFiles).toContain('coverage/lcov.info');
      expect(guardianFiles.length).toBe(2);
    });

    it('should filter files used by brain', () => {
      const brainFiles = filterByProduct(files, 'brain');
      expect(brainFiles).toContain('src/index.ts');
      expect(brainFiles).toContain('.env');
      expect(brainFiles.length).toBe(2);
    });
  });

  describe('getStatistics()', () => {
    it('should calculate correct statistics', () => {
      const files = [
        'src/a.ts',
        'src/b.ts',
        '.env',
        'Dockerfile',
        'tests/app.test.ts',
      ];

      const stats = getStatistics(files);

      expect(stats.total).toBe(5);
      expect(stats.byType.sourceCode).toBe(2);
      expect(stats.byType.env).toBe(1);
      expect(stats.byType.infrastructure).toBe(1);
      expect(stats.byType.tests).toBe(1);
      expect(stats.byRisk.high).toBe(2); // sourceCode
      expect(stats.byRisk.critical).toBe(2); // env + infrastructure
      expect(stats.byRisk.medium).toBe(1); // tests
    });

    it('should handle empty array', () => {
      const stats = getStatistics([]);
      expect(stats.total).toBe(0);
      expect(stats.byRisk.low).toBe(0);
    });

    it('should aggregate risk levels correctly', () => {
      const files = [
        '.env',
        '.env.local',
        'Dockerfile',
        'docker-compose.yml',
      ];

      const stats = getStatistics(files);

      expect(stats.byRisk.critical).toBe(4); // All critical
      expect(stats.byRisk.high).toBe(0);
    });
  });

  describe('Edge Cases & Fail-Safe Behavior', () => {
    it('should handle corrupt file paths gracefully', () => {
      expect(() => detectFileType('')).not.toThrow();
      expect(() => detectFileType('///')).not.toThrow();
    });

    it('should handle files with no extension', () => {
      expect(detectFileType('Dockerfile')).toBe('infrastructure');
      expect(detectFileType('Makefile')).toBe('scripts');
      expect(detectFileType('README')).toBe('sourceCode'); // Fallback
    });

    it('should handle deeply nested paths', () => {
      const deepPath = 'a/b/c/d/e/f/g/h/i/j/file.ts';
      expect(detectFileType(deepPath)).toBe('sourceCode');
    });

    it('should prioritize critical types over others', () => {
      // .env should be detected as 'env', not 'sourceCode'
      expect(detectFileType('.env')).toBe('env');
      expect(detectFileType('.env.ts')).toBe('env'); // .env takes priority
    });
  });
});
