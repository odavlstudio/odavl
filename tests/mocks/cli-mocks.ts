/**
 * CLI Mocks for ODAVL Testing
 * Mock child_process operations (execSync, spawn, exec)
 */

import { vi } from 'vitest';

// ========================================
// Child Process Mocks
// ========================================

/**
 * Mock execSync
 * Use: mockExecSync.mockReturnValue(Buffer.from('output'))
 */
export const mockExecSync = vi.fn();

/**
 * Mock spawn
 */
export const mockSpawn = vi.fn();

/**
 * Mock exec
 */
export const mockExec = vi.fn();

/**
 * Mock fork
 */
export const mockFork = vi.fn();

// ========================================
// Command Output Mocks
// ========================================

/**
 * Mock ESLint output (JSON format)
 */
export const mockEslintOutput = JSON.stringify([
  {
    filePath: '/project/src/index.ts',
    messages: [
      {
        ruleId: 'no-console',
        severity: 2,
        message: 'Unexpected console statement.',
        line: 10,
        column: 5,
        nodeType: 'MemberExpression',
        messageId: 'unexpected',
        endLine: 10,
        endColumn: 18,
      },
      {
        ruleId: '@typescript-eslint/no-unused-vars',
        severity: 1,
        message: "'unusedVar' is defined but never used.",
        line: 5,
        column: 7,
        nodeType: 'Identifier',
        messageId: 'unusedVar',
        endLine: 5,
        endColumn: 16,
      },
    ],
    suppressedMessages: [],
    errorCount: 1,
    fatalErrorCount: 0,
    warningCount: 1,
    fixableErrorCount: 0,
    fixableWarningCount: 0,
    source: 'const unusedVar = 1;\n\nconsole.log("test");',
  },
]);

/**
 * Mock TypeScript compiler output
 */
export const mockTscOutput = `
src/index.ts(10,5): error TS2304: Cannot find name 'unknownVar'.
src/utils.ts(25,15): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
src/types.ts(8,3): error TS2322: Type 'number' is not assignable to type 'string'.

Found 3 errors in 3 files.
`;

/**
 * Mock Git status output
 */
export const mockGitStatus = `
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/index.ts
        modified:   package.json

Untracked files:
  (use "git add <file>..." to include in what will be committed)
        tests/new-test.ts

no changes added to commit (use "git add" and/or "git commit -a")
`;

/**
 * Mock Git diff output
 */
export const mockGitDiff = `
diff --git a/src/index.ts b/src/index.ts
index abc123..def456 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -10,7 +10,7 @@ export function main() {
-  console.log("old");
+  console.log("new");
   return true;
 }
`;

/**
 * Mock npm/pnpm list output
 */
export const mockNpmList = JSON.stringify({
  version: '2.0.0',
  name: 'odavl-studio',
  dependencies: {
    typescript: { version: '5.3.3' },
    'next': { version: '15.0.0' },
    'react': { version: '19.0.0' },
    'prisma': { version: '5.8.0' },
  },
});

/**
 * Mock pnpm list output (different format)
 */
export const mockPnpmList = `
Legend: production dependency, optional only, dev only

odavl-studio@2.0.0 /project

dependencies:
next 15.0.0
prisma 5.8.0
react 19.0.0
typescript 5.3.3

devDependencies:
@types/node 20.10.0
eslint 8.56.0
vitest 1.0.0
`;

/**
 * Mock madge (circular dependency) output
 */
export const mockMadgeOutput = `
✖ Found 2 circular dependencies!

1) src/utils/helper.ts > src/utils/validator.ts > src/utils/helper.ts
2) src/services/auth.ts > src/services/user.ts > src/services/auth.ts
`;

// ========================================
// Mock Process Objects
// ========================================

/**
 * Create mock ChildProcess object
 */
export function createMockChildProcess(overrides: any = {}) {
  return {
    stdout: {
      on: vi.fn((event, callback) => {
        if (event === 'data') callback(Buffer.from('stdout output'));
      }),
      pipe: vi.fn(),
    },
    stderr: {
      on: vi.fn((event, callback) => {
        if (event === 'data') callback(Buffer.from(''));
      }),
      pipe: vi.fn(),
    },
    on: vi.fn((event, callback) => {
      if (event === 'close') callback(0);
    }),
    kill: vi.fn(),
    pid: 12345,
    ...overrides,
  };
}

// ========================================
// Setup Helpers
// ========================================

/**
 * Reset all CLI mocks
 */
export function resetCliMocks(): void {
  mockExecSync.mockReset();
  mockSpawn.mockReset();
  mockExec.mockReset();
  mockFork.mockReset();
}

/**
 * Setup successful command execution
 */
export function mockCommandSuccess(command: string, output: string | Buffer): void {
  mockExecSync.mockImplementation((cmd: string) => {
    if (typeof cmd === 'string' && cmd.includes(command)) {
      return Buffer.from(output);
    }
    return Buffer.from('');
  });
}

/**
 * Setup command failure
 */
export function mockCommandFailure(
  command: string,
  exitCode = 1,
  stderr = 'Command failed'
): void {
  mockExecSync.mockImplementation((cmd: string) => {
    if (typeof cmd === 'string' && cmd.includes(command)) {
      const error = new Error(`Command failed: ${cmd}`) as any;
      error.status = exitCode;
      error.stderr = Buffer.from(stderr);
      error.stdout = Buffer.from('');
      throw error;
    }
    return Buffer.from('');
  });
}

/**
 * Setup ESLint mock
 */
export function mockEslintCommand(hasErrors = true): void {
  if (hasErrors) {
    mockCommandSuccess('eslint', mockEslintOutput);
  } else {
    mockCommandSuccess('eslint', JSON.stringify([]));
  }
}

/**
 * Setup TypeScript compiler mock
 */
export function mockTscCommand(hasErrors = true): void {
  if (hasErrors) {
    mockCommandFailure('tsc', 2, mockTscOutput);
  } else {
    mockCommandSuccess('tsc', '');
  }
}

/**
 * Setup Git command mocks
 */
export function mockGitCommands(): void {
  mockExecSync.mockImplementation((cmd: string) => {
    if (typeof cmd === 'string') {
      if (cmd.includes('git status')) return Buffer.from(mockGitStatus);
      if (cmd.includes('git diff')) return Buffer.from(mockGitDiff);
      if (cmd.includes('git log')) return Buffer.from('commit abc123\nAuthor: Test');
      if (cmd.includes('git branch')) return Buffer.from('* main\n  develop');
    }
    return Buffer.from('');
  });
}

/**
 * Setup package manager mocks
 */
export function mockPackageManagerCommands(): void {
  mockExecSync.mockImplementation((cmd: string) => {
    if (typeof cmd === 'string') {
      if (cmd.includes('pnpm list')) return Buffer.from(mockPnpmList);
      if (cmd.includes('npm list')) return Buffer.from(mockNpmList);
      if (cmd.includes('pnpm install')) return Buffer.from('Dependencies installed');
      if (cmd.includes('pnpm build')) return Buffer.from('Build successful');
    }
    return Buffer.from('');
  });
}

/**
 * Setup spawn mock with streaming output
 */
export function mockSpawnCommand(
  command: string,
  stdoutData: string[] = [],
  stderrData: string[] = [],
  exitCode = 0
): void {
  mockSpawn.mockImplementation((cmd: string, args: string[]) => {
    if (cmd === command) {
      const process = createMockChildProcess();
      
      // Simulate stdout data
      process.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          stdoutData.forEach((data) => callback(Buffer.from(data)));
        }
      });
      
      // Simulate stderr data
      process.stderr.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          stderrData.forEach((data) => callback(Buffer.from(data)));
        }
      });
      
      // Simulate exit
      process.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          callback(exitCode);
        }
      });
      
      return process;
    }
    return createMockChildProcess();
  });
}

/**
 * Mock ODAVL autopilot phases
 */
export function mockOdavlPhases(): void {
  mockExecSync.mockImplementation((cmd: string) => {
    if (typeof cmd === 'string') {
      if (cmd.includes('autopilot observe')) {
        return Buffer.from(JSON.stringify({
          eslintErrors: 5,
          tscErrors: 3,
          files: 120,
        }));
      }
      if (cmd.includes('autopilot decide')) {
        return Buffer.from(JSON.stringify({
          recipeId: 'fix-imports',
          trustScore: 0.85,
        }));
      }
      if (cmd.includes('autopilot act')) {
        return Buffer.from('Fixed 3 files');
      }
      if (cmd.includes('autopilot verify')) {
        return Buffer.from('Verification passed');
      }
    }
    return Buffer.from('');
  });
}

// ========================================
// Example Usage in Tests
// ========================================

/**
 * Example test setup:
 * 
 * import { mockExecSync, mockCommandSuccess, resetCliMocks } from './cli-mocks';
 * 
 * describe('CLI Executor', () => {
 *   beforeEach(() => {
 *     resetCliMocks();
 *   });
 * 
 *   it('should execute ESLint', () => {
 *     mockCommandSuccess('eslint', '[]');
 *     const result = execSync('eslint . -f json');
 *     expect(result.toString()).toBe('[]');
 *   });
 * 
 *   it('should handle command failure', () => {
 *     mockCommandFailure('tsc', 2, 'Type errors found');
 *     expect(() => execSync('tsc --noEmit')).toThrow('Command failed');
 *   });
 * });
 */
