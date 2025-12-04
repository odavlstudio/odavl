import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as insightCommands from '../insight';
import * as childProcess from 'node:child_process';

vi.mock('node:child_process');

describe('Insight Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeWorkspace', () => {
    it('should run TypeScript and ESLint checks and handle results', async () => {
      const execSyncMock = vi.spyOn(childProcess, 'execSync').mockImplementation((cmd: any) => {
        // Mock both commands to succeed
        if (cmd.includes('tsc')) return Buffer.from('');
        if (cmd.includes('eslint')) return Buffer.from('');
        return Buffer.from('');
      });

      const result = await insightCommands.analyzeWorkspace();

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(execSyncMock).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(childProcess, 'execSync').mockImplementation(() => {
        throw new Error('Command failed');
      });

      await expect(insightCommands.analyzeWorkspace()).resolves.not.toThrow();
    });

    it('should run specific detectors when provided', async () => {
      const execSyncMock = vi.spyOn(childProcess, 'execSync').mockReturnValue(Buffer.from(''));

      await insightCommands.analyzeWorkspace({ detectors: 'typescript,eslint' });

      expect(execSyncMock).toHaveBeenCalled();
    });
  });

  describe('getFixSuggestions', () => {
    it('should complete without returning data (feature in progress)', async () => {
      // getFixSuggestions doesn't return data yet, just shows info message
      const result = await insightCommands.getFixSuggestions();

      expect(result).toBeUndefined(); // No return value yet
    });

    it('should run without errors when called', async () => {
      // Should not throw - feature shows "coming soon" message
      await expect(insightCommands.getFixSuggestions()).resolves.not.toThrow();
    });
  });
});
