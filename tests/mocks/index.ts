/**
 * ODAVL Testing Mocks - Central Export
 * 
 * Import all mocks from one place:
 * import { mockAxios, mockPrisma, mockFs } from './tests/mocks';
 */

// API & HTTP Mocks
export * from './api-mocks';

// Database Mocks
export * from './db-mocks';

// File System Mocks
export * from './fs-mocks';

// CLI & Command Execution Mocks
export * from './cli-mocks';

// External Services Mocks
export * from './external-mocks';

// ODAVL Detector Mocks
export * from './detector-mocks';

// ========================================
// Convenience Functions
// ========================================

import {
  resetApiMocks,
  mockAxios,
  mockFetch,
} from './api-mocks';

import {
  resetDbMocks,
  mockPrisma,
} from './db-mocks';

import {
  resetFsMocks,
  mockFs,
  mockPath,
} from './fs-mocks';

import {
  resetCliMocks,
  mockExecSync,
  mockSpawn,
} from './cli-mocks';

import {
  resetExternalMocks,
  mockNVDClient,
  mockLighthouse,
  mockPlaywright,
} from './external-mocks';

import {
  resetDetectorMocks,
  getAllDetectorMocks,
} from './detector-mocks';

/**
 * Reset all mocks at once
 * Call this in beforeEach() for complete cleanup
 */
export function resetAllMocks(): void {
  resetApiMocks();
  resetDbMocks();
  resetFsMocks();
  resetCliMocks();
  resetExternalMocks();
  resetDetectorMocks();
}

/**
 * Get all major mock objects
 * Useful for verification in tests
 */
export function getAllMocks() {
  return {
    api: {
      axios: mockAxios,
      fetch: mockFetch,
    },
    db: {
      prisma: mockPrisma,
    },
    fs: {
      fs: mockFs,
      path: mockPath,
    },
    cli: {
      execSync: mockExecSync,
      spawn: mockSpawn,
    },
    external: {
      nvd: mockNVDClient,
      lighthouse: mockLighthouse,
      playwright: mockPlaywright,
    },
    detectors: getAllDetectorMocks(),
  };
}

// ========================================
// Quick Setup Helpers
// ========================================

import { setupStandardDetectorMocks } from './detector-mocks';
import { mockGitCommands, mockPackageManagerCommands } from './cli-mocks';
import { mockNVDApi, mockLighthouseTest, mockAxeTest } from './external-mocks';

/**
 * Setup common mocks for typical ODAVL tests
 * Call this in beforeEach() or beforeAll()
 */
export function setupCommonMocks(): void {
  // Detectors
  setupStandardDetectorMocks();
  
  // Git commands
  mockGitCommands();
  
  // Package managers
  mockPackageManagerCommands();
  
  // External services
  mockNVDApi();
  mockLighthouseTest();
  mockAxeTest();
}

/**
 * Setup mocks for offline testing
 * All external APIs will return mock data
 */
export function setupOfflineMocks(): void {
  setupCommonMocks();
  
  // Ensure no real HTTP requests
  mockFetch.mockResolvedValue({
    ok: false,
    status: 503,
    statusText: 'Service Unavailable (Offline Mode)',
    json: async () => ({ error: 'Offline mode active' }),
  } as any);
}

/**
 * Setup mocks for integration tests
 * Less mocking, more real behavior
 */
export function setupIntegrationMocks(): void {
  // Only mock external services, not internal behavior
  mockNVDApi();
  mockLighthouseTest();
  mockAxeTest();
}

// ========================================
// Example Usage
// ========================================

/**
 * Example test file:
 * 
 * import { describe, it, expect, beforeEach } from 'vitest';
 * import { 
 *   resetAllMocks,
 *   setupCommonMocks,
 *   mockAxios,
 *   mockPrisma,
 *   mockTypeScriptDetector 
 * } from './tests/mocks';
 * 
 * describe('My Feature', () => {
 *   beforeEach(() => {
 *     resetAllMocks();
 *     setupCommonMocks();
 *   });
 * 
 *   it('should analyze code', async () => {
 *     mockAxios.get.mockResolvedValue({ data: { success: true } });
 *     mockPrisma.project.findUnique.mockResolvedValue({ id: '123' });
 *     
 *     const result = await analyzeCode();
 *     
 *     expect(result).toBeDefined();
 *   });
 * });
 */
