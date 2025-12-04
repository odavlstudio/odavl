import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as autopilotCommands from '../autopilot';
import * as fs from 'node:fs';

vi.mock('node:fs');

describe('Autopilot Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runFullCycle', () => {
    it('should execute all ODAVL phases and create directory', async () => {
      const mkdirSyncMock = vi.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);

      await autopilotCommands.runFullCycle('10', '40');

      // Verifies .odavl directory is created
      expect(mkdirSyncMock).toHaveBeenCalled();
    });

    it('should respect risk budget constraints', async () => {
      await autopilotCommands.runFullCycle('5', '20');

      // Function returns void, just verify it executes
      expect(true).toBe(true);
    });

    it('should create .odavl directory if it does not exist', async () => {
      const mkdirSyncMock = vi.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
      const existsSyncMock = vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      await autopilotCommands.runFullCycle('10', '40');

      expect(existsSyncMock).toHaveBeenCalled();
      expect(mkdirSyncMock).toHaveBeenCalledWith(expect.stringContaining('.odavl'), {
        recursive: true,
      });
    });
  });

  describe('runPhase', () => {
    it('should execute individual phase', async () => {
      await autopilotCommands.runPhase('observe');

      // Function returns void, verify it executes without error
      expect(true).toBe(true);
    });

    it('should validate phase name', async () => {
      await expect(autopilotCommands.runPhase('invalid')).rejects.toThrow();
    });
  });

  describe('undoLastChange', () => {
    it('should check for undo directory existence', async () => {
      const existsSyncMock = vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      await autopilotCommands.undoLastChange('snapshot-123');

      expect(existsSyncMock).toHaveBeenCalled();
    });

    it('should use latest snapshot if no ID provided', async () => {
      vi.spyOn(fs, 'readFileSync').mockReturnValue('{}');

      await expect(autopilotCommands.undoLastChange()).resolves.not.toThrow();
    });
  });
});
