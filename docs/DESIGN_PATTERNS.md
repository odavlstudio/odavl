# ODAVL Studio - Design Patterns & Code Conventions

## 1. Core Design Patterns

### 1.1 Monorepo Architecture Pattern

**Pattern**: pnpm Workspaces with Shared Packages

```yaml
# pnpm-workspace.yaml
packages:
  - "odavl-studio/*/core"
  - "odavl-studio/*/cloud"
  - "apps/*"
  - "packages/*"
```

**Benefits**:
- Single source of truth for dependencies
- Atomic commits across packages
- Shared TypeScript configuration
- Efficient builds with caching

**Implementation**:
```json
// package.json
{
  "name": "@odavl-studio/insight-core",
  "dependencies": {
    "@odavl/types": "workspace:*"
  }
}
```

---

### 1.2 Dual Export Pattern (ESM/CJS)

**Pattern**: Support both ESM and CommonJS consumers

```typescript
// packages/sdk/src/index.ts
export { Insight } from './insight.js';
export { Autopilot } from './autopilot.js';
export { Guardian } from './guardian.js';
```

```json
// package.json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

**Build Command**:
```bash
tsup src/index.ts --format esm,cjs --dts
```

**Usage**:
```typescript
// ESM
import { Insight } from '@odavl-studio/sdk';

// CommonJS
const { Insight } = require('@odavl-studio/sdk');
```

---

### 1.3 Detector Pattern

**Pattern**: Plugin-based architecture for analyzers

```typescript
// Interface all detectors implement
interface IDetector {
  name: string;
  analyze(workspace: string): Promise<Issue[]>;
}

// Example implementation
class TypeScriptDetector implements IDetector {
  name = 'typescript';
  
  async analyze(workspace: string): Promise<Issue[]> {
    const program = ts.createProgram(/*...*/);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    return diagnostics.map(this.toIssue);
  }
  
  private toIssue(diagnostic: ts.Diagnostic): Issue {
    return {
      severity: this.getSeverity(diagnostic.category),
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      file: diagnostic.file?.fileName || '',
      line: diagnostic.start ? 
        diagnostic.file?.getLineAndCharacterOfPosition(diagnostic.start).line : 0,
      code: `TS${diagnostic.code}`
    };
  }
}
```

**Registration Pattern**:
```typescript
// odavl-studio/insight/core/src/index.ts
const detectors: IDetector[] = [
  new TypeScriptDetector(),
  new ESLintDetector(),
  new SecurityDetector(),
  // ... 9 more
];

export async function analyze(workspace: string) {
  const results = await Promise.all(
    detectors.map(d => d.analyze(workspace))
  );
  return results.flat();
}
```

---

### 1.4 Phase Pipeline Pattern (O-D-A-V-L)

**Pattern**: Sequential phase execution with validation

```typescript
// odavl-studio/autopilot/engine/src/index.ts
async function runCycle() {
  // 1. OBSERVE
  const beforeMetrics = await observe();
  console.log(`Issues detected: ${beforeMetrics.totalIssues}`);
  
  // 2. DECIDE
  const decision = await decide(beforeMetrics);
  if (decision === 'noop') return;
  
  // 3. ACT (with snapshot)
  await saveUndoSnapshot();
  const actResult = await act(decision);
  
  // 4. VERIFY
  const afterMetrics = await observe();
  const verified = await verify(beforeMetrics, afterMetrics);
  
  if (!verified) {
    await rollback();
    throw new Error('Quality gates failed');
  }
  
  // 5. LEARN
  await learn(decision, verified);
}
```

**Benefits**:
- Clear separation of concerns
- Easy to test each phase
- Rollback on failure
- Audit trail

---

### 1.5 Repository Pattern (Data Access)

**Pattern**: Abstract database operations

```typescript
// packages/core/src/repositories/BaseRepository.ts
abstract class BaseRepository<T> {
  constructor(protected prisma: PrismaClient) {}
  
  async findById(id: string): Promise<T | null> {
    return this.prisma[this.tableName].findUnique({ where: { id } });
  }
  
  async create(data: Omit<T, 'id'>): Promise<T> {
    return this.prisma[this.tableName].create({ data });
  }
  
  protected abstract get tableName(): string;
}

// Usage
class UserRepository extends BaseRepository<User> {
  protected get tableName() { return 'user'; }
  
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }
}
```

---

## 2. Safety Patterns

### 2.1 Risk Budget Guard Pattern

**Pattern**: Pre-flight safety checks before modifications

```typescript
// odavl-studio/autopilot/engine/src/policies/risk-budget-guard.ts
class RiskBudgetGuard {
  constructor(
    private maxFiles: number = 10,
    private maxLOCPerFile: number = 40,
    private protectedPaths: string[] = ['security/**', 'auth/**']
  ) {}
  
  validate(changes: FileChange[]): void {
    // Check file count
    if (changes.length > this.maxFiles) {
      throw new Error(`Exceeded max files: ${changes.length}/${this.maxFiles}`);
    }
    
    // Check LOC per file
    for (const change of changes) {
      if (change.linesChanged > this.maxLOCPerFile) {
        throw new Error(
          `File ${change.path} exceeds max LOC: ${change.linesChanged}/${this.maxLOCPerFile}`
        );
      }
    }
    
    // Check protected paths
    const violations = changes.filter(c => 
      this.protectedPaths.some(p => micromatch.isMatch(c.path, p))
    );
    
    if (violations.length > 0) {
      throw new Error(`Protected paths: ${violations.map(v => v.path).join(', ')}`);
    }
  }
}
```

---

### 2.2 Undo Snapshot Pattern

**Pattern**: Capture state before modifications

```typescript
// odavl-studio/autopilot/engine/src/core/undo-system.ts
interface Snapshot {
  timestamp: string;
  files: Record<string, string>; // path → content
  metadata: {
    runId: string;
    recipe: string;
  };
}

async function saveUndoSnapshot(files: string[]): Promise<void> {
  const snapshot: Snapshot = {
    timestamp: new Date().toISOString(),
    files: {},
    metadata: { runId: generateId(), recipe: currentRecipe }
  };
  
  // Capture original content
  for (const file of files) {
    snapshot.files[file] = await fs.readFile(file, 'utf-8');
  }
  
  const snapshotPath = `.odavl/undo/${snapshot.timestamp}.json`;
  await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
  
  // Update latest symlink
  await fs.symlink(snapshotPath, '.odavl/undo/latest.json');
}

async function rollback(): Promise<void> {
  const latestPath = '.odavl/undo/latest.json';
  const snapshot: Snapshot = JSON.parse(await fs.readFile(latestPath, 'utf-8'));
  
  for (const [path, content] of Object.entries(snapshot.files)) {
    await fs.writeFile(path, content);
  }
  
  console.log(`Rolled back to ${snapshot.timestamp}`);
}
```

---

### 2.3 Attestation Pattern

**Pattern**: Cryptographic proof of improvements

```typescript
// odavl-studio/autopilot/engine/src/core/attestation.ts
interface Attestation {
  runId: string;
  timestamp: string;
  recipe: string;
  deltas: {
    eslint: number;
    typeErrors: number;
  };
  gatesPassed: boolean;
  signature: string;
}

async function generateAttestation(
  runId: string,
  recipe: string,
  before: Metrics,
  after: Metrics
): Promise<Attestation> {
  const attestation: Attestation = {
    runId,
    timestamp: new Date().toISOString(),
    recipe,
    deltas: {
      eslint: after.eslintWarnings - before.eslintWarnings,
      typeErrors: after.typeErrors - before.typeErrors
    },
    gatesPassed: after.totalIssues < before.totalIssues,
    signature: ''
  };
  
  // SHA-256 signature
  const content = JSON.stringify(attestation);
  attestation.signature = `sha256:${crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')}`;
  
  const path = `.odavl/attestation/${attestation.signature}.json`;
  await fs.writeFile(path, JSON.stringify(attestation, null, 2));
  
  return attestation;
}
```

---

## 3. Performance Patterns

### 3.1 Parallel Execution Pattern

**Pattern**: Run independent operations concurrently

```typescript
// odavl-studio/insight/core/src/analyzer/parallel-analyzer.ts
async function analyzeParallel(workspace: string): Promise<Issue[]> {
  const detectors: IDetector[] = [
    new TypeScriptDetector(),
    new ESLintDetector(),
    new SecurityDetector(),
    // ... 9 more
  ];
  
  // Run all detectors in parallel
  const results = await Promise.all(
    detectors.map(async (detector) => {
      const start = performance.now();
      try {
        const issues = await detector.analyze(workspace);
        const duration = performance.now() - start;
        console.log(`${detector.name}: ${issues.length} issues (${duration.toFixed(0)}ms)`);
        return issues;
      } catch (error) {
        console.error(`${detector.name} failed:`, error);
        return [];
      }
    })
  );
  
  return results.flat();
}
```

**Benefits**:
- 12 detectors run simultaneously
- Total time = slowest detector (not sum)
- Graceful failure (one detector failing doesn't stop others)

---

### 3.2 Incremental Analysis Pattern

**Pattern**: Only analyze changed files

```typescript
// odavl-studio/insight/core/src/analyzer/incremental.ts
interface AnalysisCache {
  files: Record<string, {
    hash: string;
    issues: Issue[];
    timestamp: string;
  }>;
}

async function analyzeIncremental(workspace: string): Promise<Issue[]> {
  const cache = await loadCache();
  const currentFiles = await glob('**/*.ts', { cwd: workspace });
  
  const changedFiles: string[] = [];
  const cachedIssues: Issue[] = [];
  
  for (const file of currentFiles) {
    const content = await fs.readFile(file, 'utf-8');
    const hash = crypto.createHash('md5').update(content).digest('hex');
    
    const cached = cache.files[file];
    if (cached && cached.hash === hash) {
      // File unchanged, use cached results
      cachedIssues.push(...cached.issues);
    } else {
      // File changed or new
      changedFiles.push(file);
    }
  }
  
  // Analyze only changed files
  const newIssues = await analyzeFiles(changedFiles);
  
  // Update cache
  await updateCache(changedFiles, newIssues);
  
  return [...cachedIssues, ...newIssues];
}
```

**Speedup**: 10x faster for typical edit (1-2 files changed)

---

### 3.3 LRU Cache Pattern

**Pattern**: Cache frequently accessed data with size limit

```typescript
// packages/core/src/utils/lru-cache.ts
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; lastAccess: number }>();
  
  constructor(private maxSize: number = 100) {}
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Update access time
    entry.lastAccess = Date.now();
    return entry.value;
  }
  
  set(key: K, value: V): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = [...this.cache.entries()]
        .sort(([, a], [, b]) => a.lastAccess - b.lastAccess)[0];
      this.cache.delete(oldest[0]);
    }
    
    this.cache.set(key, { value, lastAccess: Date.now() });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

// Usage: ML model predictions cache
const predictionCache = new LRUCache<string, number>(1000);

async function predict(features: Features): Promise<number> {
  const key = JSON.stringify(features);
  const cached = predictionCache.get(key);
  
  if (cached !== undefined) return cached;
  
  const prediction = await mlModel.predict(features);
  predictionCache.set(key, prediction);
  return prediction;
}
```

---

## 4. Testing Patterns

### 4.1 Fixture Pattern

**Pattern**: Reusable test data

```typescript
// tests/fixtures/sample-projects.ts
export const fixtures = {
  validTypescript: {
    'tsconfig.json': JSON.stringify({ compilerOptions: { strict: true } }),
    'src/index.ts': 'const greeting: string = "Hello";'
  },
  
  withErrors: {
    'src/index.ts': 'const x: string = 123;' // Type error
  },
  
  withSecurity: {
    'src/api.ts': 'const API_KEY = "hardcoded-secret";' // Security issue
  }
};

// Usage in tests
describe('TypeScript Detector', () => {
  it('detects type errors', async () => {
    const workspace = await createTempWorkspace(fixtures.withErrors);
    const detector = new TypeScriptDetector();
    const issues = await detector.analyze(workspace);
    
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('TS2322');
  });
});
```

---

### 4.2 Mock Pattern for External Dependencies

**Pattern**: Mock file system and commands

```typescript
// tests/mocks/fs-mock.ts
export const fsMock = {
  files: new Map<string, string>(),
  
  readFile: vi.fn((path: string) => {
    const content = fsMock.files.get(path);
    if (!content) throw new Error(`File not found: ${path}`);
    return Promise.resolve(content);
  }),
  
  writeFile: vi.fn((path: string, content: string) => {
    fsMock.files.set(path, content);
    return Promise.resolve();
  }),
  
  reset() {
    this.files.clear();
    this.readFile.mockClear();
    this.writeFile.mockClear();
  }
};

// Usage
beforeEach(() => {
  fsMock.reset();
  fsMock.files.set('src/index.ts', 'const x = 1;');
});
```

---

### 4.3 Snapshot Testing Pattern

**Pattern**: Verify complex outputs

```typescript
// tests/detectors/typescript.test.ts
describe('TypeScript Detector', () => {
  it('matches snapshot for sample project', async () => {
    const workspace = path.join(__dirname, '../fixtures/sample-ts-project');
    const detector = new TypeScriptDetector();
    const issues = await detector.analyze(workspace);
    
    // Serialize for snapshot (remove timestamps)
    const normalized = issues.map(i => ({
      severity: i.severity,
      message: i.message,
      code: i.code
    }));
    
    expect(normalized).toMatchSnapshot();
  });
});
```

---

## 5. VS Code Extension Patterns

### 5.1 Lazy Service Initialization

**Pattern**: Defer expensive initialization

```typescript
// extension/src/extension.ts
class LazyServices {
  private _dataService?: ODAVLDataService;
  
  get dataService(): ODAVLDataService {
    if (!this._dataService) {
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      if (!workspaceRoot) throw new Error('No workspace');
      
      this._dataService = new ODAVLDataService(workspaceRoot);
      console.log('[ODAVL] Data service initialized');
    }
    return this._dataService;
  }
  
  dispose() {
    this._dataService?.dispose();
  }
}

const services = new LazyServices();

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl.analyze', async () => {
      // Service initialized only when command runs
      const results = await services.dataService.analyze();
      // ...
    })
  );
  
  context.subscriptions.push({ dispose: () => services.dispose() });
}
```

---

### 5.2 Diagnostic Collection Pattern

**Pattern**: Integrate with Problems Panel

```typescript
// extension/src/diagnostics-service.ts
export class DiagnosticsService {
  private collection: vscode.DiagnosticCollection;
  
  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection('odavl');
  }
  
  updateDiagnostics(issues: Issue[]): void {
    const diagnosticMap = new Map<string, vscode.Diagnostic[]>();
    
    for (const issue of issues) {
      const uri = vscode.Uri.file(issue.file);
      const range = new vscode.Range(
        issue.line, issue.column,
        issue.line, issue.column + 1
      );
      
      const diagnostic = new vscode.Diagnostic(
        range,
        issue.message,
        this.toSeverity(issue.severity)
      );
      diagnostic.source = 'ODAVL';
      diagnostic.code = issue.code;
      
      const existing = diagnosticMap.get(uri.fsPath) || [];
      existing.push(diagnostic);
      diagnosticMap.set(uri.fsPath, existing);
    }
    
    // Batch update
    this.collection.clear();
    for (const [file, diagnostics] of diagnosticMap) {
      this.collection.set(vscode.Uri.file(file), diagnostics);
    }
  }
  
  private toSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity) {
      case 'critical':
      case 'high': return vscode.DiagnosticSeverity.Error;
      case 'medium': return vscode.DiagnosticSeverity.Warning;
      case 'low': return vscode.DiagnosticSeverity.Information;
      default: return vscode.DiagnosticSeverity.Hint;
    }
  }
  
  dispose() {
    this.collection.dispose();
  }
}
```

---

### 5.3 File Watcher Pattern

**Pattern**: Auto-trigger on file changes

```typescript
// extension/src/watcher.ts
export function setupWatcher(context: vscode.ExtensionContext) {
  // Watch for .odavl/ledger/*.json files
  const watcher = vscode.workspace.createFileSystemWatcher(
    '**/.odavl/ledger/run-*.json'
  );
  
  watcher.onDidCreate(async (uri) => {
    // Wait for file write to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const config = vscode.workspace.getConfiguration('odavl');
    if (config.get('autoOpenLedger')) {
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc);
    }
  });
  
  context.subscriptions.push(watcher);
}
```

---

## 6. Error Handling Patterns

### 6.1 Result Type Pattern

**Pattern**: Type-safe error handling without exceptions

```typescript
// packages/core/src/utils/result.ts
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

function failure<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage
async function analyzeFile(path: string): Promise<Result<Issue[]>> {
  try {
    const content = await fs.readFile(path, 'utf-8');
    const issues = await detectIssues(content);
    return success(issues);
  } catch (error) {
    return failure(error as Error);
  }
}

// Consuming code
const result = await analyzeFile('src/index.ts');
if (result.ok) {
  console.log(`Found ${result.value.length} issues`);
} else {
  console.error(`Analysis failed: ${result.error.message}`);
}
```

---

### 6.2 Command Wrapper Pattern

**Pattern**: Never throw from shell commands

```typescript
// odavl-studio/autopilot/engine/src/utils/sh.ts
interface CommandResult {
  out: string;
  err: string;
  exitCode: number;
}

export function sh(cmd: string): CommandResult {
  try {
    const out = execSync(cmd, { 
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8'
    });
    return { out, err: '', exitCode: 0 };
  } catch (error: any) {
    return {
      out: error.stdout?.toString() ?? '',
      err: error.stderr?.toString() ?? '',
      exitCode: error.status ?? 1
    };
  }
}

// Usage - always safe, never throws
const { out, err, exitCode } = sh('eslint . --format json');
if (exitCode !== 0) {
  console.error(`ESLint failed: ${err}`);
  return;
}

const results = JSON.parse(out);
```

---

## 7. Configuration Patterns

### 7.1 Layered Configuration Pattern

**Pattern**: Default → User → CLI arguments

```typescript
// packages/core/src/config/config-loader.ts
interface Config {
  insight: {
    detectors: string[];
    autoFix: boolean;
  };
  autopilot: {
    maxFiles: number;
    maxLOC: number;
  };
}

const DEFAULT_CONFIG: Config = {
  insight: {
    detectors: ['typescript', 'eslint'],
    autoFix: false
  },
  autopilot: {
    maxFiles: 10,
    maxLOC: 40
  }
};

export async function loadConfig(workspace: string): Promise<Config> {
  // 1. Start with defaults
  let config = { ...DEFAULT_CONFIG };
  
  // 2. Load user config if exists
  const userConfigPath = path.join(workspace, '.odavlrc.json');
  if (await fs.pathExists(userConfigPath)) {
    const userConfig = await fs.readJSON(userConfigPath);
    config = merge(config, userConfig);
  }
  
  // 3. Apply CLI arguments (highest priority)
  const cliArgs = parseCliArgs();
  config = merge(config, cliArgs);
  
  return config;
}
```

---

## 8. Deployment Patterns

### 8.1 Prisma Singleton Pattern

**Pattern**: Prevent connection leaks in serverless

```typescript
// odavl-studio/insight/cloud/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Why**: Prevents creating multiple Prisma instances in development (hot reload) and serverless (function reuse).

---

### 8.2 Health Check Pattern

**Pattern**: Monitoring endpoint for uptime

```typescript
// apps/studio-hub/pages/api/health.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis
    await redis.ping();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        redis: 'up'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
```

---

## Summary

These patterns are used throughout ODAVL Studio to ensure:

✅ **Type Safety** - TypeScript + strict mode  
✅ **Performance** - Parallel execution, caching, incremental analysis  
✅ **Safety** - Risk guards, undo system, attestations  
✅ **Testability** - Mocks, fixtures, dependency injection  
✅ **Maintainability** - Clear abstractions, single responsibility  
✅ **Scalability** - Efficient algorithms, resource management

For implementation details, see source code in respective packages.

---

**Version**: ODAVL Studio v2.0  
**Last Updated**: November 23, 2025  
**Word Count**: ~3,200 words
