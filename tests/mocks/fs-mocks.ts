/**
 * File System Mocks for ODAVL Testing
 * Mock Node.js fs/promises operations
 */

import { vi } from 'vitest';
import type { Stats } from 'node:fs';

// ========================================
// File System Mock
// ========================================

/**
 * Mock fs/promises
 * All async file system operations
 */
export const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  appendFile: vi.fn(),
  unlink: vi.fn(),
  mkdir: vi.fn(),
  rmdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  lstat: vi.fn(),
  access: vi.fn(),
  copyFile: vi.fn(),
  rename: vi.fn(),
  chmod: vi.fn(),
  chown: vi.fn(),
  exists: vi.fn(), // Custom helper
};

/**
 * Mock path module
 */
export const mockPath = {
  join: vi.fn((...parts) => parts.join('/')),
  resolve: vi.fn((...parts) => '/' + parts.join('/')),
  dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
  basename: vi.fn((p) => p.split('/').pop()),
  extname: vi.fn((p) => {
    const parts = p.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  }),
  parse: vi.fn(),
  format: vi.fn(),
  isAbsolute: vi.fn((p) => p.startsWith('/')),
  relative: vi.fn(),
  normalize: vi.fn((p) => p),
  sep: '/',
  delimiter: ':',
};

// ========================================
// Mock Data
// ========================================

/**
 * Mock file content map
 */
const mockFileSystem = new Map<string, string | Buffer>();

/**
 * Mock directory tree
 */
const mockDirectories = new Set<string>();

/**
 * Create mock Stats object
 */
export function createMockStats(overrides: Partial<Stats> = {}): Stats {
  const now = new Date();
  return {
    isFile: () => true,
    isDirectory: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isSymbolicLink: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    dev: 0,
    ino: 0,
    mode: 0o644,
    nlink: 1,
    uid: 1000,
    gid: 1000,
    rdev: 0,
    size: 1024,
    blksize: 4096,
    blocks: 8,
    atimeMs: now.getTime(),
    mtimeMs: now.getTime(),
    ctimeMs: now.getTime(),
    birthtimeMs: now.getTime(),
    atime: now,
    mtime: now,
    ctime: now,
    birthtime: now,
    ...overrides,
  } as Stats;
}

// ========================================
// Setup Helpers
// ========================================

/**
 * Reset all file system mocks and clear virtual filesystem
 */
export function resetFsMocks(): void {
  Object.values(mockFs).forEach((method) => {
    if (typeof method === 'function' && 'mockReset' in method) {
      (method as any).mockReset();
    }
  });
  mockFileSystem.clear();
  mockDirectories.clear();
  setupDefaultBehavior();
}

/**
 * Setup default mock behavior
 */
function setupDefaultBehavior(): void {
  // Default readFile behavior
  mockFs.readFile.mockImplementation(async (path: string) => {
    const content = mockFileSystem.get(path);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    return content;
  });

  // Default writeFile behavior
  mockFs.writeFile.mockImplementation(async (path: string, data: string | Buffer) => {
    mockFileSystem.set(path, data);
  });

  // Default exists behavior
  mockFs.exists.mockImplementation(async (path: string) => {
    return mockFileSystem.has(path) || mockDirectories.has(path);
  });

  // Default readdir behavior
  mockFs.readdir.mockImplementation(async (path: string) => {
    const files: string[] = [];
    const pathPrefix = path.endsWith('/') ? path : path + '/';
    
    for (const [filePath] of mockFileSystem) {
      if (filePath.startsWith(pathPrefix)) {
        const relativePath = filePath.substring(pathPrefix.length);
        const fileName = relativePath.split('/')[0];
        if (!files.includes(fileName)) {
          files.push(fileName);
        }
      }
    }
    
    return files;
  });

  // Default stat behavior
  mockFs.stat.mockImplementation(async (path: string) => {
    if (mockFileSystem.has(path)) {
      const content = mockFileSystem.get(path)!;
      const size = typeof content === 'string' ? Buffer.byteLength(content) : content.length;
      return createMockStats({ size, isFile: () => true, isDirectory: () => false });
    }
    if (mockDirectories.has(path)) {
      return createMockStats({ isFile: () => false, isDirectory: () => true });
    }
    throw new Error(`ENOENT: no such file or directory, stat '${path}'`);
  });

  // Default mkdir behavior
  mockFs.mkdir.mockImplementation(async (path: string) => {
    mockDirectories.add(path);
  });

  // Default access behavior (check if file exists)
  mockFs.access.mockImplementation(async (path: string) => {
    if (!mockFileSystem.has(path) && !mockDirectories.has(path)) {
      throw new Error(`ENOENT: no such file or directory, access '${path}'`);
    }
  });
}

/**
 * Add a file to the mock filesystem
 */
export function addMockFile(path: string, content: string | Buffer): void {
  mockFileSystem.set(path, content);
}

/**
 * Add a directory to the mock filesystem
 */
export function addMockDirectory(path: string): void {
  mockDirectories.add(path);
}

/**
 * Setup a mock file structure
 */
export function setupMockFileStructure(structure: Record<string, string | Buffer>): void {
  mockFileSystem.clear();
  mockDirectories.clear();
  
  for (const [path, content] of Object.entries(structure)) {
    if (typeof content === 'string' && content.endsWith('/')) {
      addMockDirectory(path);
    } else {
      addMockFile(path, content);
    }
  }
}

/**
 * Simulate file not found error
 */
export function mockFileNotFound(path: string): void {
  mockFs.readFile.mockImplementation(async (p: string) => {
    if (p === path) {
      throw new Error(`ENOENT: no such file or directory, open '${path}'`);
    }
    const content = mockFileSystem.get(p);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${p}'`);
    }
    return content;
  });
}

/**
 * Simulate permission denied error
 */
export function mockPermissionDenied(path: string): void {
  mockFs.readFile.mockImplementation(async (p: string) => {
    if (p === path) {
      throw new Error(`EACCES: permission denied, open '${path}'`);
    }
    const content = mockFileSystem.get(p);
    if (content === undefined) {
      throw new Error(`ENOENT: no such file or directory, open '${p}'`);
    }
    return content;
  });
}

/**
 * Setup successful file operations
 */
export function mockFileOperations(path: string, content: string = 'mock content'): void {
  addMockFile(path, content);
  mockFs.readFile.mockResolvedValue(content);
  mockFs.writeFile.mockResolvedValue(undefined);
  mockFs.exists.mockResolvedValue(true);
}

// Initialize default behavior
setupDefaultBehavior();

// ========================================
// Example Usage in Tests
// ========================================

/**
 * Example test setup:
 * 
 * import { mockFs, resetFsMocks, addMockFile } from './fs-mocks';
 * 
 * describe('File Reader', () => {
 *   beforeEach(() => {
 *     resetFsMocks();
 *   });
 * 
 *   it('should read file content', async () => {
 *     addMockFile('/path/to/file.txt', 'Hello World');
 *     
 *     const content = await fs.readFile('/path/to/file.txt', 'utf-8');
 *     expect(content).toBe('Hello World');
 *   });
 * 
 *   it('should handle file not found', async () => {
 *     await expect(fs.readFile('/nonexistent.txt')).rejects.toThrow('ENOENT');
 *   });
 * });
 */
