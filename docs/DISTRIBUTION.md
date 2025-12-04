# ODAVL Studio - Distribution Guide

**Last Updated:** November 22, 2025  
**Version:** 0.1.0

---

## Overview

ODAVL Studio distributes two main packages via npm:

- **`@odavl-studio/cli`** - Unified command-line interface for all products
- **`@odavl-studio/sdk`** - Programmatic SDK for custom integrations

Both packages support **dual exports** (ESM + CommonJS) and include full TypeScript definitions.

---

## Package Structure

### CLI (`@odavl-studio/cli`)

```
apps/studio-cli/
├── src/
│   ├── index.ts          # Entry point (Commander routing)
│   ├── commands/
│   │   ├── insight.ts    # Insight commands
│   │   ├── autopilot.ts  # Autopilot commands
│   │   └── guardian.ts   # Guardian commands
│   └── utils/
├── dist/
│   ├── index.js          # Built ESM with shebang
│   └── index.d.ts        # TypeScript definitions
├── package.json          # Package metadata
├── README.md             # User documentation
└── tsconfig.json         # TypeScript config
```

**Key Files:**
- **Entry:** `dist/index.js` (ESM with `#!/usr/bin/env node`)
- **Binary:** `odavl` command (symlinked globally on install)
- **Size:** ~20 KB unpacked, ~6.5 KB tarball

---

### SDK (`@odavl-studio/sdk`)

```
packages/sdk/
├── src/
│   ├── index.ts          # Main export (all products)
│   ├── insight.ts        # Insight-specific exports
│   ├── autopilot.ts      # Autopilot-specific exports
│   └── guardian.ts       # Guardian-specific exports
├── dist/
│   ├── index.js          # ESM entry
│   ├── index.cjs         # CommonJS entry
│   ├── index.d.ts        # TypeScript defs (ESM)
│   ├── index.d.cts       # TypeScript defs (CJS)
│   ├── insight.{js,cjs,d.ts,d.cts}
│   ├── autopilot.{js,cjs,d.ts,d.cts}
│   └── guardian.{js,cjs,d.ts,d.cts}
├── package.json          # With exports map
├── README.md             # API documentation
└── tsconfig.json         # TypeScript config
```

**Key Features:**
- **Subpath Exports:** Import from `.`, `./insight`, `./autopilot`, `./guardian`
- **Dual Formats:** ESM (`.js`) and CommonJS (`.cjs`)
- **TypeScript:** Full definitions (`.d.ts` and `.d.cts`)
- **Size:** ~77 KB unpacked, ~13 KB tarball

---

## Package.json Configuration

### CLI Package

```json
{
  "name": "@odavl-studio/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "odavl": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public",
    "registry": "http://localhost:4873"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts && node scripts/add-shebang.cjs",
    "prepublishOnly": "pnpm run build"
  }
}
```

**Important:**
- `bin` points to `dist/index.js` (must have shebang)
- `files` includes only necessary assets
- `prepublishOnly` ensures build before publish
- `publishConfig.registry` for local testing (remove for npm)

---

### SDK Package

```json
{
  "name": "@odavl-studio/sdk",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./insight": {
      "types": "./dist/insight.d.ts",
      "import": "./dist/insight.js",
      "require": "./dist/insight.cjs"
    },
    "./autopilot": {
      "types": "./dist/autopilot.d.ts",
      "import": "./dist/autopilot.js",
      "require": "./dist/autopilot.cjs"
    },
    "./guardian": {
      "types": "./dist/guardian.d.ts",
      "import": "./dist/guardian.js",
      "require": "./dist/guardian.cjs"
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup src/index.ts src/insight.ts src/autopilot.ts src/guardian.ts --format esm,cjs --dts",
    "prepublishOnly": "pnpm run build"
  }
}
```

**Important:**
- `exports` defines subpath imports (tree-shakeable)
- `types` listed first in each export for better IDE support
- Dual `import`/`require` for ESM + CommonJS compatibility
- `prepublishOnly` hook ensures fresh build

---

## Build Process

### CLI Build

```bash
cd apps/studio-cli
pnpm build

# Output:
# dist/index.js (ESM with shebang)
# dist/index.d.ts (TypeScript definitions)
```

**Build Command:**
```json
"build": "tsup src/index.ts --format esm --dts && node scripts/add-shebang.cjs"
```

**Shebang Script** (`scripts/add-shebang.cjs`):
```javascript
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.js');
let content = fs.readFileSync(indexPath, 'utf8');

if (!content.startsWith('#!/usr/bin/env node')) {
  content = '#!/usr/bin/env node\n' + content;
  fs.writeFileSync(indexPath, content);
  console.log('✅ Shebang added to dist/index.js');
}
```

---

### SDK Build

```bash
cd packages/sdk
pnpm build

# Output:
# dist/index.{js,cjs,d.ts,d.cts}
# dist/insight.{js,cjs,d.ts,d.cts}
# dist/autopilot.{js,cjs,d.ts,d.cts}
# dist/guardian.{js,cjs,d.ts,d.cts}
```

**Build Command:**
```json
"build": "tsup src/index.ts src/insight.ts src/autopilot.ts src/guardian.ts --format esm,cjs --dts"
```

**tsup Configuration** (in package.json or `tsup.config.ts`):
```javascript
export default {
  entry: ['src/index.ts', 'src/insight.ts', 'src/autopilot.ts', 'src/guardian.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true, // Code splitting for shared chunks
  target: 'es2022'
};
```

---

## Publishing Workflow

### Local Registry (Verdaccio)

**Setup:**
```bash
# Install Verdaccio
npm install -g verdaccio

# Start server
verdaccio
# Access: http://localhost:4873

# Configure npm
npm set registry http://localhost:4873
npm adduser --registry http://localhost:4873
# Username: test
# Password: test
# Email: test@example.com
```

**Publish:**
```bash
# Use automation script
.\scripts\publish-local.ps1

# Or manually
cd apps/studio-cli
pnpm build
npm publish --registry http://localhost:4873

cd ../../packages/sdk
pnpm build
npm publish --registry http://localhost:4873
```

**Verify:**
```bash
npm view @odavl-studio/cli --registry http://localhost:4873
npm view @odavl-studio/sdk --registry http://localhost:4873

# Web UI
open http://localhost:4873
```

---

### Public npm Registry

**Prerequisites:**
1. npm account with 2FA enabled
2. Organization `@odavl-studio` created
3. Clean git working directory
4. All tests passing

**Publish:**
```bash
# Dry run first
.\scripts\publish-npm.ps1 -DryRun

# Real publish
.\scripts\publish-npm.ps1

# Will prompt for 2FA codes
```

**Post-Publish:**
```bash
# Push git tags
git push --tags

# Create GitHub release
gh release create @odavl-studio/cli@0.1.0 --notes "Initial release"

# Update CHANGELOG
pnpm changeset
```

---

## Installation

### Global CLI Installation

```bash
# From npm (public)
npm install -g @odavl-studio/cli

# From local registry
npm install -g @odavl-studio/cli --registry http://localhost:4873

# Verify
odavl --version
odavl --help
```

---

### Project SDK Installation

```bash
# From npm (public)
npm install @odavl-studio/sdk

# From local registry
npm install @odavl-studio/sdk --registry http://localhost:4873

# Verify
node -e "console.log(require('@odavl-studio/sdk'))"
```

---

## Usage Examples

### CLI Usage

```bash
# Show version
odavl --version

# Insight analysis
odavl insight analyze

# Autopilot self-healing
odavl autopilot run

# Guardian testing
odavl guardian test https://example.com
```

---

### SDK Usage (ESM)

```typescript
import { InsightAnalyzer } from '@odavl-studio/sdk/insight';
import { AutopilotEngine } from '@odavl-studio/sdk/autopilot';
import { Guardian } from '@odavl-studio/sdk/guardian';

// Use Insight
const analyzer = new InsightAnalyzer({
  detectors: ['typescript', 'eslint']
});
const results = await analyzer.analyze('./src');

// Use Autopilot
const engine = new AutopilotEngine({ maxFiles: 10 });
const runResult = await engine.run();

// Use Guardian
const guardian = new Guardian();
const testResult = await guardian.test('https://example.com');
```

---

### SDK Usage (CommonJS)

```javascript
const { InsightAnalyzer } = require('@odavl-studio/sdk/insight');
const { AutopilotEngine } = require('@odavl-studio/sdk/autopilot');

// Same API as ESM
const analyzer = new InsightAnalyzer({ detectors: ['typescript'] });
analyzer.analyze('./src').then(console.log);
```

---

## Scripts Reference

### `publish-local.ps1`

**Purpose:** Build and publish to Verdaccio (local testing)

**Usage:**
```powershell
.\scripts\publish-local.ps1              # Build and publish both packages
.\scripts\publish-local.ps1 -SkipBuild   # Publish without rebuilding
.\scripts\publish-local.ps1 -Verbose     # Show detailed output
```

**Requirements:**
- Verdaccio running on localhost:4873
- Authenticated (npm adduser)

---

### `publish-npm.ps1`

**Purpose:** Build and publish to public npm registry

**Usage:**
```powershell
.\scripts\publish-npm.ps1              # Full publish with all checks
.\scripts\publish-npm.ps1 -DryRun      # Test without publishing
.\scripts\publish-npm.ps1 -SkipTests   # Skip test suite
.\scripts\publish-npm.ps1 -Force       # Skip git clean check
```

**Pre-Flight Checks:**
- Git working directory clean
- npm authentication valid
- Tests passing
- No version conflicts

---

### `unpublish-local.ps1`

**Purpose:** Remove packages from Verdaccio

**Usage:**
```powershell
.\scripts\unpublish-local.ps1                   # Unpublish all packages
.\scripts\unpublish-local.ps1 -Package cli      # Unpublish CLI only
.\scripts\unpublish-local.ps1 -Version 0.1.0    # Unpublish specific version
.\scripts\unpublish-local.ps1 -Force            # Skip confirmation
```

**Warning:** Cannot be undone!

---

## Troubleshooting

### Issue: Shebang Missing

**Symptom:** `odavl: command not found` or permissions error

**Solution:**
```bash
# Verify shebang
head -n 1 apps/studio-cli/dist/index.js
# Should output: #!/usr/bin/env node

# Rebuild with shebang script
cd apps/studio-cli
pnpm build
```

---

### Issue: Workspace Dependencies

**Symptom:** `npm error code EUNSUPPORTEDPROTOCOL` during install

**Cause:** Published packages contain `workspace:^` protocol references

**Solution:**
1. Publish internal packages first:
   ```bash
   cd odavl-studio/insight/core && npm publish --registry http://localhost:4873
   cd odavl-studio/autopilot/engine && npm publish --registry http://localhost:4873
   ```

2. Or use `pnpm pack` to resolve workspace: references:
   ```bash
   cd apps/studio-cli && pnpm pack
   # Creates odavl-studio-cli-0.1.0.tgz with resolved versions
   ```

---

### Issue: Dual Export Errors

**Symptom:** `Cannot find module` or `SyntaxError: Unexpected token 'export'`

**Solution:**
- Ensure `exports` in package.json lists `types` first
- Verify both `.js` (ESM) and `.cjs` (CommonJS) files exist
- Check `type: "module"` in package.json

---

### Issue: TypeScript Definitions Not Found

**Symptom:** `Could not find a declaration file for module '@odavl-studio/sdk'`

**Solution:**
```bash
# Verify .d.ts files exist
ls packages/sdk/dist/*.d.ts

# Rebuild with --dts flag
cd packages/sdk
tsup src/index.ts --format esm,cjs --dts
```

---

## Version Management

**Recommended:** Use [Changesets](https://github.com/changesets/changesets)

**Setup:**
```bash
pnpm add -D @changesets/cli
pnpm changeset init

# Configure .changeset/config.json
```

**Workflow:**
```bash
# 1. Create changeset (describes changes)
pnpm changeset

# 2. Version packages (updates package.json + CHANGELOG)
pnpm changeset version

# 3. Publish
.\scripts\publish-npm.ps1
```

See [VERSIONING.md](./VERSIONING.md) for detailed guide.

---

## CI/CD Integration

**GitHub Actions Example:**

```yaml
name: Publish Packages

on:
  push:
    tags:
      - '@odavl-studio/*@*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install
      
      - run: pnpm test
      
      - run: pnpm build
      
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Best Practices

1. **Always test locally first** (Verdaccio)
2. **Use semantic versioning** (0.1.0 → 0.2.0 → 1.0.0)
3. **Keep CHANGELOG.md updated** (via changesets)
4. **Tag releases in git** (`@odavl-studio/cli@0.1.0`)
5. **Enable 2FA on npm** (required for @odavl-studio org)
6. **Verify after publish** (`npm view @odavl-studio/cli`)
7. **Test installation** (create fresh project, install, test)

---

## Support

- **Issues:** [github.com/Monawlo812/odavl/issues](https://github.com/Monawlo812/odavl/issues)
- **Discussions:** [github.com/Monawlo812/odavl/discussions](https://github.com/Monawlo812/odavl/discussions)
- **Documentation:** [github.com/Monawlo812/odavl](https://github.com/Monawlo812/odavl)

---

**Next:** [VERSIONING.md](./VERSIONING.md) | [CLI_REFERENCE.md](./CLI_REFERENCE.md) | [SDK_REFERENCE.md](./SDK_REFERENCE.md)
