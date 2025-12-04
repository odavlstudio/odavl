/**
 * Unit Tests for PluginManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManager, DetectorPlugin, type Issue, type PluginContext } from '@odavl-studio/sdk/plugin';

class MockDetectorPlugin extends DetectorPlugin {
  async onInit(context: PluginContext): Promise<void> {}
  
  async detect(code: string, filePath: string): Promise<Issue[]> {
    return [{
      type: 'test',
      severity: 'low',
      message: 'Mock issue',
      line: 1,
      column: 0,
    }];
  }
  
  supports(language: string): boolean {
    return language === 'typescript';
  }
  
  shouldSkip(filePath: string): boolean {
    return false;
  }
  
  async onDestroy(): Promise<void> {}
  validate(): boolean { return true; }
}

describe('PluginManager', () => {
  let manager: PluginManager;
  
  beforeEach(() => {
    manager = new PluginManager();
  });
  
  it('should register plugin successfully', () => {
    const plugin = new MockDetectorPlugin({
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      type: 'detector',
    });
    
    manager.register(plugin);
    expect(manager.getPlugin('test-plugin')).toBe(plugin);
  });
  
  it('should unregister plugin', () => {
    const plugin = new MockDetectorPlugin({
      id: 'test-plugin',
      name: 'Test',
      version: '1.0.0',
      type: 'detector',
    });
    
    manager.register(plugin);
    manager.unregister('test-plugin');
    expect(manager.getPlugin('test-plugin')).toBeUndefined();
  });
  
  it('should run detectors and collect issues', async () => {
    const plugin = new MockDetectorPlugin({
      id: 'test-plugin',
      name: 'Test',
      version: '1.0.0',
      type: 'detector',
    });
    
    manager.register(plugin);
    const issues = await manager.runDetectors('const x = 1;', 'test.ts', 'typescript');
    
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toBe('Mock issue');
  });
});
