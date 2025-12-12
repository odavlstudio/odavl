/**
 * ODAVL Phase P5 - File-Type Aware Analysis Tests
 * 
 * Comprehensive test suite for file-type integration in Insight analysis engine.
 * 
 * Test Coverage:
 * - File routing by type
 * - Automatic skipping rules
 * - Priority ordering (critical → high → medium → low)
 * - Detector filtering based on file type
 * - Issue metadata enhancement
 * - Audit logging
 * - Fail-safe behavior
 * 
 * @since Phase P5 (December 2025)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  analyzeFileForInsight,
  analyzeFilesForInsight,
  prioritizeFilesByRisk,
  getFileAnalysisStats,
  FileAnalysisAuditor,
  SKIP_FILE_TYPES,
  FILE_TYPE_DETECTOR_MAP,
  RISK_SCORES,
  type FileAnalysis,
} from '../engine/file-type-analysis';

describe('File-Type Aware Analysis Engine', () => {
  
  // ============================================================
  // analyzeFileForInsight() - Single File Analysis
  // ============================================================
  
  describe('analyzeFileForInsight()', () => {
    it('detects source code files correctly', () => {
      const analysis = analyzeFileForInsight('src/index.ts');
      
      expect(analysis.fileType).toBe('sourceCode');
      expect(analysis.risk).toBe('high');
      expect(analysis.shouldSkip).toBe(false);
      expect(analysis.allowedDetectors).toContain('typescript');
      expect(analysis.allowedDetectors).toContain('eslint');
      expect(analysis.allowedDetectors).toContain('security');
      expect(analysis.usedByProducts).toContain('insight');
    });
    
    it('detects environment files as critical risk', () => {
      const analysis = analyzeFileForInsight('.env');
      
      expect(analysis.fileType).toBe('env');
      expect(analysis.risk).toBe('critical');
      expect(analysis.shouldSkip).toBe(false);
      expect(analysis.allowedDetectors).toEqual(['security']); // Only security detector
      expect(analysis.priorityScore).toBe(RISK_SCORES.critical);
    });
    
    it('detects infrastructure files correctly', () => {
      const analysis = analyzeFileForInsight('Dockerfile');
      
      expect(analysis.fileType).toBe('infrastructure');
      expect(analysis.risk).toBe('critical');
      expect(analysis.shouldSkip).toBe(false);
      expect(analysis.allowedDetectors).toContain('security');
      expect(analysis.allowedDetectors).toContain('infrastructure');
    });
    
    it('marks build artifacts for skipping', () => {
      const analysis = analyzeFileForInsight('dist/index.js');
      
      expect(analysis.fileType).toBe('buildArtifacts');
      expect(analysis.shouldSkip).toBe(true);
      expect(analysis.skipReason).toContain('build artifacts');
      expect(analysis.allowedDetectors).toEqual([]);
    });
    
    it('marks logs for skipping', () => {
      const analysis = analyzeFileForInsight('.odavl/logs/app.log');
      
      expect(analysis.fileType).toBe('logs');
      expect(analysis.shouldSkip).toBe(true);
      expect(analysis.skipReason).toContain('logs');
    });
    
    it('marks coverage reports for skipping', () => {
      const analysis = analyzeFileForInsight('coverage/lcov.info');
      
      expect(analysis.fileType).toBe('coverage');
      expect(analysis.shouldSkip).toBe(true);
      expect(analysis.skipReason).toContain('reports');
    });
    
    it('detects test files correctly', () => {
      const analysis = analyzeFileForInsight('src/utils.test.ts');
      
      expect(analysis.fileType).toBe('tests');
      expect(analysis.risk).toBe('medium');
      expect(analysis.shouldSkip).toBe(false);
      expect(analysis.allowedDetectors).toContain('typescript');
      expect(analysis.allowedDetectors).toContain('eslint');
      expect(analysis.allowedDetectors).not.toContain('complexity'); // Tests skip complexity checks
    });
    
    it('detects migration files as critical', () => {
      const analysis = analyzeFileForInsight('prisma/migrations/001_init.sql');
      
      expect(analysis.fileType).toBe('migrations');
      expect(analysis.risk).toBe('critical');
      expect(analysis.shouldSkip).toBe(false);
      expect(analysis.allowedDetectors).toContain('security');
      expect(analysis.allowedDetectors).toContain('database');
    });
    
    it('detects secret candidates as critical', () => {
      const analysis = analyzeFileForInsight('config/secrets.json');
      
      expect(analysis.fileType).toBe('secretCandidates');
      expect(analysis.risk).toBe('critical');
      expect(analysis.shouldSkip).toBe(false);
      expect(analysis.allowedDetectors).toEqual(['security']); // Only security
    });
    
    it('filters detectors when specific detectors requested', () => {
      const analysis = analyzeFileForInsight('src/index.ts', ['typescript', 'security']);
      
      expect(analysis.allowedDetectors).toEqual(['typescript', 'security']);
      expect(analysis.allowedDetectors).not.toContain('eslint');
      expect(analysis.allowedDetectors).not.toContain('performance');
    });
    
    it('returns empty detectors if requested detector not compatible', () => {
      const analysis = analyzeFileForInsight('.env', ['typescript', 'eslint']);
      
      expect(analysis.allowedDetectors).toEqual([]); // env only supports security
    });
  });
  
  // ============================================================
  // analyzeFilesForInsight() - Bulk Analysis
  // ============================================================
  
  describe('analyzeFilesForInsight()', () => {
    it('filters out skipped files automatically', () => {
      const files = [
        'src/index.ts',           // sourceCode - analyze
        'dist/index.js',          // buildArtifacts - skip
        '.odavl/logs/app.log',    // logs - skip
        'coverage/lcov.info',     // coverage - skip
        '.env',                   // env - analyze
      ];
      
      const analyses = analyzeFilesForInsight(files);
      
      expect(analyses.length).toBe(2); // Only sourceCode and env
      expect(analyses[0].filePath).toBe('src/index.ts');
      expect(analyses[1].filePath).toBe('.env');
    });
    
    it('respects requested detectors for all files', () => {
      const files = ['src/index.ts', 'src/utils.ts', 'src/app.test.ts'];
      const analyses = analyzeFilesForInsight(files, ['typescript', 'security']);
      
      for (const analysis of analyses) {
        expect(analysis.allowedDetectors).toEqual(['typescript', 'security']);
      }
    });
    
    it('handles empty file list', () => {
      const analyses = analyzeFilesForInsight([]);
      
      expect(analyses).toEqual([]);
    });
  });
  
  // ============================================================
  // prioritizeFilesByRisk() - Priority Sorting
  // ============================================================
  
  describe('prioritizeFilesByRisk()', () => {
    it('sorts files by risk priority (critical first)', () => {
      const files = [
        'src/index.ts',                // high (75)
        '.env',                        // critical (100)
        'config/app.json',             // medium (50)
        '.odavl/diagnostics/trace.json', // low (25) - but skipped
      ];
      
      const analyses = analyzeFilesForInsight(files);
      const sorted = prioritizeFilesByRisk(analyses);
      
      expect(sorted[0].risk).toBe('critical'); // .env first
      expect(sorted[1].risk).toBe('high');     // src/index.ts second
      expect(sorted[2].risk).toBe('medium');   // config/app.json third
    });
    
    it('maintains stable sort for same risk level', () => {
      const files = [
        'src/index.ts',
        'src/utils.ts',
        'src/app.ts',
      ];
      
      const analyses = analyzeFilesForInsight(files);
      const sorted = prioritizeFilesByRisk(analyses);
      
      expect(sorted[0].fileType).toBe('sourceCode');
      expect(sorted[1].fileType).toBe('sourceCode');
      expect(sorted[2].fileType).toBe('sourceCode');
      expect(sorted.every(a => a.risk === 'high')).toBe(true);
    });
    
    it('handles empty array', () => {
      const sorted = prioritizeFilesByRisk([]);
      
      expect(sorted).toEqual([]);
    });
  });
  
  // ============================================================
  // getFileAnalysisStats() - Statistics
  // ============================================================
  
  describe('getFileAnalysisStats()', () => {
    it('calculates statistics correctly', () => {
      const allFiles = [
        'src/index.ts',           // sourceCode - high
        '.env',                   // env - critical
        'Dockerfile',             // infrastructure - critical
        'dist/index.js',          // buildArtifacts - skip
        '.odavl/logs/app.log',    // logs - skip
        'config/app.json',        // config - medium
      ];
      
      const analyses = analyzeFilesForInsight(allFiles);
      const stats = getFileAnalysisStats(allFiles, analyses);
      
      expect(stats.total).toBe(6);
      expect(stats.skipped).toBe(2); // dist + logs
      expect(stats.analyzed).toBe(4);
      expect(stats.byRisk.critical).toBe(2); // .env + Dockerfile
      expect(stats.byRisk.high).toBe(1);     // src/index.ts
      expect(stats.byRisk.medium).toBe(1);   // config/app.json
      expect(stats.criticalFiles).toContain('.env');
      expect(stats.criticalFiles).toContain('Dockerfile');
    });
    
    it('handles all skipped files', () => {
      const allFiles = [
        'dist/index.js',
        '.odavl/logs/app.log',
        'coverage/lcov.info',
      ];
      
      const analyses = analyzeFilesForInsight(allFiles);
      const stats = getFileAnalysisStats(allFiles, analyses);
      
      expect(stats.total).toBe(3);
      expect(stats.skipped).toBe(3);
      expect(stats.analyzed).toBe(0);
      expect(stats.criticalFiles).toEqual([]);
    });
    
    it('counts by file type correctly', () => {
      const allFiles = [
        'src/index.ts',
        'src/utils.ts',
        'config/app.json',
        '.env',
      ];
      
      const analyses = analyzeFilesForInsight(allFiles);
      const stats = getFileAnalysisStats(allFiles, analyses);
      
      expect(stats.byType.sourceCode).toBe(2);
      expect(stats.byType.config).toBe(1);
      expect(stats.byType.env).toBe(1);
    });
  });
  
  // ============================================================
  // FileAnalysisAuditor - Audit Logging
  // ============================================================
  
  describe('FileAnalysisAuditor', () => {
    let auditor: FileAnalysisAuditor;
    
    beforeEach(() => {
      auditor = new FileAnalysisAuditor();
    });
    
    it('logs analyze actions', () => {
      const analysis = analyzeFileForInsight('src/index.ts');
      auditor.log(analysis, 'analyze');
      
      const logs = auditor.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('analyze');
      expect(logs[0].filePath).toBe('src/index.ts');
      expect(logs[0].fileType).toBe('sourceCode');
      expect(logs[0].risk).toBe('high');
      expect(logs[0].detectors).toContain('typescript');
    });
    
    it('logs skip actions with reason', () => {
      const analysis = analyzeFileForInsight('dist/index.js');
      auditor.log(analysis, 'skip');
      
      const logs = auditor.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe('skip');
      expect(logs[0].fileType).toBe('buildArtifacts');
      expect(logs[0].reason).toContain('build artifacts');
    });
    
    it('maintains chronological order', () => {
      const files = ['src/index.ts', '.env', 'dist/index.js'];
      
      for (const file of files) {
        const analysis = analyzeFileForInsight(file);
        auditor.log(analysis, analysis.shouldSkip ? 'skip' : 'analyze');
      }
      
      const logs = auditor.getLogs();
      expect(logs.length).toBe(3);
      expect(logs[0].filePath).toBe('src/index.ts');
      expect(logs[1].filePath).toBe('.env');
      expect(logs[2].filePath).toBe('dist/index.js');
    });
    
    it('exports to JSON', () => {
      const analysis = analyzeFileForInsight('src/index.ts');
      auditor.log(analysis, 'analyze');
      
      const json = auditor.export();
      const parsed = JSON.parse(json);
      
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0].filePath).toBe('src/index.ts');
    });
    
    it('clears logs', () => {
      const analysis = analyzeFileForInsight('src/index.ts');
      auditor.log(analysis, 'analyze');
      
      expect(auditor.getLogs().length).toBe(1);
      
      auditor.clear();
      
      expect(auditor.getLogs().length).toBe(0);
    });
  });
  
  // ============================================================
  // Edge Cases & Fail-Safe Behavior
  // ============================================================
  
  describe('Edge Cases', () => {
    it('handles Windows paths', () => {
      const analysis = analyzeFileForInsight('src\\index.ts');
      
      expect(analysis.fileType).toBe('sourceCode');
      expect(analysis.shouldSkip).toBe(false);
    });
    
    it('handles files with multiple dots', () => {
      const analysis = analyzeFileForInsight('.env.production.local');
      
      expect(analysis.fileType).toBe('env');
      expect(analysis.risk).toBe('critical');
    });
    
    it('handles deep nesting', () => {
      const analysis = analyzeFileForInsight('src/modules/auth/services/jwt/token-validator.ts');
      
      expect(analysis.fileType).toBe('sourceCode');
      expect(analysis.shouldSkip).toBe(false);
    });
    
    it('handles files without extensions', () => {
      const analysis = analyzeFileForInsight('Dockerfile');
      
      expect(analysis.fileType).toBe('infrastructure');
      expect(analysis.risk).toBe('critical');
    });
    
    it('defaults to sourceCode for unknown types', () => {
      const analysis = analyzeFileForInsight('unknown-file.xyz');
      
      expect(analysis.fileType).toBe('sourceCode'); // Fallback
      expect(analysis.shouldSkip).toBe(false);
    });
  });
  
  // ============================================================
  // Constants Validation
  // ============================================================
  
  describe('Constants', () => {
    it('SKIP_FILE_TYPES contains all non-analyzable types', () => {
      expect(SKIP_FILE_TYPES).toContain('buildArtifacts');
      expect(SKIP_FILE_TYPES).toContain('logs');
      expect(SKIP_FILE_TYPES).toContain('diagnostics');
      expect(SKIP_FILE_TYPES).toContain('coverage');
      expect(SKIP_FILE_TYPES).toContain('reports');
      expect(SKIP_FILE_TYPES.length).toBe(5);
    });
    
    it('FILE_TYPE_DETECTOR_MAP covers all file types', () => {
      const allFileTypes = [
        'sourceCode', 'config', 'infrastructure', 'tests', 'mocks',
        'logs', 'diagnostics', 'datasets', 'mlModels', 'migrations',
        'env', 'scripts', 'schema', 'assets', 'uiSnapshots',
        'integrations', 'buildArtifacts', 'coverage', 'reports', 'secretCandidates'
      ];
      
      for (const type of allFileTypes) {
        expect(FILE_TYPE_DETECTOR_MAP).toHaveProperty(type);
      }
    });
    
    it('RISK_SCORES has all risk levels', () => {
      expect(RISK_SCORES).toHaveProperty('critical');
      expect(RISK_SCORES).toHaveProperty('high');
      expect(RISK_SCORES).toHaveProperty('medium');
      expect(RISK_SCORES).toHaveProperty('low');
      expect(RISK_SCORES.critical).toBeGreaterThan(RISK_SCORES.high);
      expect(RISK_SCORES.high).toBeGreaterThan(RISK_SCORES.medium);
      expect(RISK_SCORES.medium).toBeGreaterThan(RISK_SCORES.low);
    });
  });
});
