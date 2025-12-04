# 🛠️ Developer Guides

**Resources for contributors and developers** building on ODAVL Studio.

---

## 🏗️ Architecture

### [System Architecture](./architecture.md)
Complete architectural overview:
- **Monorepo Structure**: pnpm workspaces with 3 products
- **Three Products**: Insight, Autopilot, Guardian
- **Shared Infrastructure**: CLI, SDK, auth, types
- **Data Flow**: O-D-A-V-L cycle, ML training, real-time updates
- **VS Code Extensions**: Lazy loading pattern

**Key Diagrams:**
```
ODAVL Studio (pnpm monorepo)
├── odavl-studio/           # Three products
│   ├── insight/            # ML-powered error detection
│   ├── autopilot/          # Self-healing engine
│   └── guardian/           # Pre-deploy testing
├── apps/                   # Applications
│   ├── studio-cli/         # Unified CLI
│   └── studio-hub/         # Marketing website
└── packages/               # Shared packages
    ├── sdk/                # Public TypeScript SDK
    ├── auth/               # JWT authentication
    ├── core/               # Shared utilities
    └── types/              # TypeScript interfaces
```

---

## 🤝 Contributing

### [Contributing Guide](./contributing.md)
How to contribute to ODAVL Studio:
- **Code of Conduct**: Community guidelines
- **Development Setup**: Local environment
- **Pull Request Process**: Branch, commit, test, PR
- **Code Style**: ESLint flat config, TypeScript strict mode
- **Testing**: Vitest with Istanbul coverage
- **Documentation**: Markdown standards

**Quick Start:**
```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/odavl.git
cd odavl

# Install dependencies
pnpm install

# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
pnpm test
pnpm forensic:all

# Commit and push
git commit -m "feat: add my feature"
git push origin feature/my-feature

# Open PR on GitHub
```

---

## 📚 API Reference

### [REST API Documentation](./api-reference.md)
Complete API reference:

**Insight Endpoints:**
- `POST /api/insight/analyze` - Analyze code
- `GET /api/insight/issues` - Get issues
- `GET /api/insight/metrics` - Get metrics

**Autopilot Endpoints:**
- `POST /api/autopilot/run` - Run O-D-A-V-L cycle
- `GET /api/autopilot/ledger` - Get run ledger
- `POST /api/autopilot/undo` - Undo last change

**Guardian Endpoints:**
- `POST /api/guardian/test` - Run pre-deploy tests
- `GET /api/guardian/results` - Get test results
- `GET /api/guardian/gates` - Check quality gates

**Authentication:**
```bash
# Get JWT token
curl -X POST https://api.odavl.io/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'

# Use token
curl -X POST https://api.odavl.io/api/insight/analyze \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "language": "typescript"}'
```

---

## 🧪 Testing Guide

### Testing Strategy

**Unit Tests** (Vitest):
```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

**Integration Tests:**
```bash
pnpm test:integration
```

**E2E Tests** (Playwright):
```bash
pnpm test:e2e
```

**Testing Best Practices:**
1. ✅ Use I/O wrappers for file operations (testable)
2. ✅ Mock external dependencies
3. ✅ Test error paths, not just happy paths
4. ✅ Aim for 80%+ coverage
5. ✅ Use `.test.ts` or `.spec.ts` extensions

---

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ (for Insight Cloud)
- Redis (for caching)

### Local Environment

```bash
# 1. Clone repository
git clone https://github.com/your-org/odavl.git
cd odavl

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env
nano .env  # Edit with your values

# 4. Setup database
pnpm prisma:migrate
pnpm prisma:generate

# 5. Build packages
pnpm build

# 6. Run dev servers
pnpm dev
```

### Development Workflow

```bash
# Make changes
code odavl-studio/insight/core/src/detector/typescript-detector.ts

# Run tests
pnpm test apps/insight-core

# Check types
pnpm typecheck

# Lint
pnpm lint

# Full quality check
pnpm forensic:all
```

---

## 📦 Package Development

### Creating a New Package

```bash
# 1. Create directory
mkdir -p packages/my-package/src

# 2. Create package.json
cat > packages/my-package/package.json << 'EOF'
{
  "name": "@odavl-studio/my-package",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts --format esm,cjs --dts --watch"
  }
}
EOF

# 3. Create tsconfig.json
cat > packages/my-package/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
EOF

# 4. Create source file
cat > packages/my-package/src/index.ts << 'EOF'
export function hello() {
  return "Hello from my-package!";
}
EOF

# 5. Build
pnpm build --filter @odavl-studio/my-package
```

---

## 🔧 Build System

### pnpm Workspaces

**Configuration (`pnpm-workspace.yaml`):**
```yaml
packages:
  - 'odavl-studio/*'
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

**Commands:**
```bash
# Install dependency in specific package
pnpm add lodash --filter @odavl-studio/insight-core

# Build specific package
pnpm build --filter @odavl-studio/autopilot-engine

# Run script in all packages
pnpm --recursive run build
```

### TypeScript Configuration

**Root `tsconfig.json`:**
- Target: ES2022
- Module: bundler
- Strict: true
- Path aliases: `@/*`

**Package-specific:**
Each package extends root config with custom `outDir` and `rootDir`.

---

## 🎨 Code Style

### ESLint Configuration

**Flat Config (`eslint.config.mjs`):**
```javascript
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': 'error',        // Use Logger utility
      'no-debugger': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
];
```

### Naming Conventions
- **Files**: `kebab-case.ts`
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (no `I` prefix)

---

## 📖 Documentation Standards

### Markdown Style
- Use ATX headers (`#`, `##`, `###`)
- Code blocks with language identifiers
- Tables for structured data
- Emoji for visual scanning (sparingly)

### Code Comments
```typescript
/**
 * Analyzes TypeScript code for errors and warnings.
 * 
 * @param code - Source code to analyze
 * @param options - Analysis options
 * @returns Array of detected issues
 * @throws {AnalysisError} If code cannot be parsed
 * 
 * @example
 * ```typescript
 * const issues = await analyzeTypeScript('const x: string = 42;');
 * console.log(issues); // [{ severity: 'error', message: '...' }]
 * ```
 */
export async function analyzeTypeScript(
  code: string,
  options?: AnalysisOptions
): Promise<Issue[]> {
  // Implementation...
}
```

---

## 🔗 Related Resources

- **[Getting Started](../1-getting-started/)** - Setup guide
- **[User Guides](../2-user-guides/)** - Product usage
- **[Language Support](../4-language-support/)** - Detector guides
- **[Deployment](../5-deployment/)** - Production deployment

---

## ❓ Need Help?

- 📖 Read the guides above
- 💬 Join [Discord Community](https://discord.gg/odavl)
- 🐛 Report [GitHub Issues](https://github.com/your-org/odavl/issues)
- 📧 Email dev@odavl.io

---

**Last Updated:** November 24, 2025
