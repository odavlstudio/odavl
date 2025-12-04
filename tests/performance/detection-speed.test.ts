/**
 * Performance Benchmark Tests
 */

import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';
import { AIDetectorEngine } from '../../odavl-studio/insight/core/src/ai/ai-detector-engine.js';
import { PluginManager } from '../../packages/sdk/src/plugin-sdk.js';

describe('Performance Benchmarks', () => {
  it('should analyze small file in <500ms', async () => {
    const engine = new AIDetectorEngine({
      enableGPT4: false,
      enableClaude: false,
      enableCustomModel: true,
      strategy: 'hybrid',
    });
    
    const code = `
      function hello() {
        console.log("Hello World");
      }
    `;
    
    const start = performance.now();
    await engine.detect(code, 'test.ts', {});
    const end = performance.now();
    
    expect(end - start).toBeLessThan(500);
  });
  
  it('should analyze typical file in <3000ms', async () => {
    const engine = new AIDetectorEngine({
      enableGPT4: false,
      enableClaude: false,
      enableCustomModel: true,
      strategy: 'hybrid',
    });
    
    const code = `
      class UserService {
        async getUser(id: string) {
          const response = await fetch(\`/api/users/\${id}\`);
          return response.json();
        }
        
        async updateUser(id: string, data: any) {
          const response = await fetch(\`/api/users/\${id}\`, {
            method: 'PUT',
            body: JSON.stringify(data)
          });
          return response.json();
        }
      }
    `;
    
    const start = performance.now();
    await engine.detect(code, 'user-service.ts', {});
    const end = performance.now();
    
    expect(end - start).toBeLessThan(3000);
  });
  
  it('should keep memory usage under 100MB for plugins', async () => {
    const manager = new PluginManager();
    
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Run detectors 100 times
    const code = 'const test = "hello";';
    for (let i = 0; i < 100; i++) {
      await manager.runDetectors(code, 'test.ts', 'typescript');
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
    
    expect(memoryIncrease).toBeLessThan(100);
  });
});
