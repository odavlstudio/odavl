# ODAVL Studio v2.0 - Major Restructuring Complete

## 🎉 What Changed

ODAVL has been completely restructured into **ODAVL Studio** - a unified platform with three distinct products following the Office 365/Adobe Creative Cloud model.

## 📦 New Structure

```
odavl-studio/
├── insight/           # ODAVL Insight - ML-powered error detection
│   ├── core/          # @odavl-studio/insight-core
│   ├── cloud/         # @odavl-studio/insight-cloud (Next.js dashboard)
│   └── extension/     # VS Code extension
├── autopilot/         # ODAVL Autopilot - Self-healing code
│   ├── engine/        # @odavl-studio/autopilot-engine
│   ├── recipes/       # Improvement recipes
│   └── extension/     # VS Code extension
└── guardian/          # ODAVL Guardian - Pre-deploy testing
    ├── app/           # @odavl-studio/guardian-app (Next.js)
    ├── workers/       # @odavl-studio/guardian-workers
    └── extension/     # VS Code extension

apps/
├── studio-hub/        # Marketing website (Next.js 15)
└── studio-cli/        # Unified CLI (@odavl-studio/cli)

packages/
├── sdk/               # Public SDK (@odavl-studio/sdk)
├── auth/              # Authentication library
└── core/              # Shared utilities
```

## 🚀 Quick Start

### Install CLI Globally

```bash
pnpm add -g @odavl-studio/cli
```

### Use the CLI

```bash
# Show all commands
odavl --help

# Analyze code with Insight
odavl insight analyze

# Run full autopilot cycle
odavl autopilot run

# Run pre-deploy tests with Guardian
odavl guardian test https://your-site.com
```

### Install VS Code Extensions

Search for "ODAVL" in the VS Code marketplace or install manually:

- ODAVL Insight
- ODAVL Autopilot
- ODAVL Guardian

### Use the SDK

```typescript
import { Insight, Autopilot, Guardian } from '@odavl-studio/sdk';

// Initialize with API key
const insight = new Insight({ apiKey: 'your-key' });

// Analyze workspace
const results = await insight.analyze({ 
  workspace: '/path/to/project' 
});

// Run autopilot cycle
const autopilot = new Autopilot({ apiKey: 'your-key' });
const ledger = await autopilot.runCycle({ 
  workspace: '/path/to/project' 
});

// Run quality tests
const guardian = new Guardian({ apiKey: 'your-key' });
const scores = await guardian.runTests({ 
  url: 'https://your-site.com' 
});
```

## 📚 Key Changes

### Package Namespace

All packages now use `@odavl-studio/*` namespace:

- `@odavl-studio/insight-core`
- `@odavl-studio/autopilot-engine`
- `@odavl-studio/guardian-app`
- `@odavl-studio/cli`
- `@odavl-studio/sdk`

### Unified CLI

Single entry point for all ODAVL Studio products:

```bash
odavl info               # Show studio info
odavl insight [cmd]      # Error detection
odavl autopilot [cmd]    # Self-healing
odavl guardian [cmd]     # Quality testing
```

### Public SDK

First-class TypeScript SDK for programmatic access:

```typescript
import { Insight, Autopilot, Guardian } from '@odavl-studio/sdk';
```

### VS Code Extensions

Three separate extensions for each product:

- Better isolation and smaller bundle sizes
- Focused feature sets per product
- Independent update cycles

## 🧪 Testing

All packages include comprehensive test suites:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific package tests
cd packages/sdk && pnpm test
```

## 🏗️ Development

### Build All Packages

```bash
pnpm -r build
```

### Build Individual Package

```bash
cd packages/sdk && pnpm build
cd apps/studio-cli && pnpm build
```

### Develop Extensions

```bash
# Compile extension
cd odavl-studio/insight/extension && pnpm compile

# Watch mode for development
cd odavl-studio/insight/extension && pnpm watch
```

## 📦 Publishing

### NPM Packages

```bash
# Publish SDK
cd packages/sdk && pnpm publish --access public

# Publish CLI
cd apps/studio-cli && pnpm publish --access public
```

### VS Code Extensions

```bash
# Package extension
cd odavl-studio/insight/extension && vsce package

# Publish to marketplace
cd odavl-studio/insight/extension && vsce publish
```

## 🔧 Configuration

### pnpm Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'odavl-studio/*/core'
  - 'odavl-studio/*/cloud'
  - 'odavl-studio/*/app'
  - 'odavl-studio/*/engine'
  - 'odavl-studio/*/workers'
  - 'odavl-studio/*/extension'
```

### TypeScript Paths

```json
{
  "compilerOptions": {
    "paths": {
      "@odavl-studio/*": ["packages/*/src", "apps/*/src"]
    }
  }
}
```

## 📝 Migration Guide

### For Users

1. **Uninstall old CLI**: `pnpm remove -g odavl`
2. **Install new CLI**: `pnpm add -g @odavl-studio/cli`
3. **Update VS Code extensions**: Search for "ODAVL" and install new extensions

### For Developers

1. **Update imports**:

   ```typescript
   // Before
   import { analyzeCode } from 'odavl-insight';
   
   // After
   import { Insight } from '@odavl-studio/sdk';
   const insight = new Insight({ apiKey: 'key' });
   ```

2. **Update package.json dependencies**:

   ```json
   {
     "dependencies": {
       "@odavl-studio/sdk": "^1.0.0"
     }
   }
   ```

## 🎯 What's Next

- [ ] Publish packages to npm
- [ ] Publish extensions to VS Code marketplace
- [ ] Launch marketing website
- [ ] Set up cloud infrastructure
- [ ] Enable authentication for cloud services

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT - See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

This restructuring enables ODAVL to scale as a professional platform while maintaining the core mission of autonomous code quality improvement.
