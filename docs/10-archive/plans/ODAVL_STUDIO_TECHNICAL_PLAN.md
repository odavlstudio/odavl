# 🔧 ODAVL Studio - Technical Restructuring Plan

**Detailed Implementation Guide**  
**Date:** November 16, 2025  
**Version:** 1.0  
**Companion to:** ODAVL_STUDIO_RESTRUCTURING_VISION.md

---

## 📋 Table of Contents

1. [Phase 1: Cleanup & Deletion](#phase-1-cleanup--deletion-week-1)
2. [Phase 2: Structure Creation](#phase-2-structure-creation-week-2)
3. [Phase 3: Build New Components](#phase-3-build-new-components-weeks-3-6)
4. [Phase 4: Integration](#phase-4-integration-weeks-7-8)
5. [Phase 5: Testing & Launch](#phase-5-testing--launch-week-9)

---

## Phase 1: Cleanup & Deletion (Week 1)

### 🎯 Goal

Remove outdated code and organize existing structure for transformation.

### 📦 Step 1.1: Complete Deletion (Day 1)

**Delete these directories completely:**

```bash
# Navigate to project root
cd c:\Users\sabou\dev\odavl

# Delete old website (Next.js 14)
Remove-Item -Recurse -Force .\odavl-website\

# Delete incomplete new website
Remove-Item -Recurse -Force .\apps\odavl-website-v2\

# Delete incomplete SDK
Remove-Item -Recurse -Force .\packages\sdk\

# Delete old VS Code extension
Remove-Item -Recurse -Force .\apps\vscode-ext\

# Delete duplicate types folder
Remove-Item -Recurse -Force .\types\
```

**Update pnpm-workspace.yaml:**

```yaml
# Remove these lines:
# - 'odavl-website'
# - 'apps/odavl-website-v2'
# - 'packages/sdk'
# - 'apps/vscode-ext'
```

**Clean package.json:**

Remove dependencies related to deleted directories.

---

### 📂 Step 1.2: Move Internal Tools (Day 2)

**Create internal directory:**

```bash
mkdir internal
```

**Move these directories:**

```bash
# Move internal tools
Move-Item .\governor\ .\internal\governor\
Move-Item .\learner\ .\internal\learner\
Move-Item .\omega\ .\internal\omega\
Move-Item .\attestation\ .\internal\attestation\
```

**Update any imports that reference these directories.**

---

### 📄 Step 1.3: Organize Documentation (Day 3)

**Current state:** 40+ markdown files scattered in root

**Action:** Move to `docs/` with proper categorization

```bash
# Create subdirectories
mkdir docs\architecture
mkdir docs\guides
mkdir docs\archive

# Move architecture docs
Move-Item .\ARCHITECTURE.md .\docs\architecture\
Move-Item .\DEPLOYMENT_RUNBOOK.md .\docs\architecture\

# Move guides
Move-Item .\DEVELOPER_GUIDE.md .\docs\guides\
Move-Item .\ONBOARDING.md .\docs\guides\
Move-Item .\CI_CD_GUIDE.md .\docs\guides\

# Move governance/legal
Move-Item .\CODE_OF_CONDUCT.md .\docs\
Move-Item .\CONTRIBUTING.md .\docs\
Move-Item .\GDPR_COMPLIANCE.md .\docs\
Move-Item .\PRIVACY.md .\docs\
Move-Item .\SECURITY.md .\docs\

# Keep in root: README.md, LICENSE, CHANGELOG.md
```

**Update all internal documentation links.**

---

### 🧹 Step 1.4: Clean Dependencies (Day 4)

**Root package.json cleanup:**

```bash
# Remove unused dependencies
pnpm remove <any packages from deleted apps>

# Update workspace references
# Ensure pnpm-workspace.yaml is correct

# Reinstall clean dependencies
pnpm install
```

**Verify build:**

```bash
pnpm forensic:all
```

Expected: Some errors (we'll fix in Phase 2), but no catastrophic failures.

---

### ✅ Phase 1 Deliverables

- ✅ 5 directories deleted (old website, new website, SDK, extension, types)
- ✅ Internal tools moved to `internal/`
- ✅ Documentation organized in `docs/`
- ✅ Clean `pnpm-workspace.yaml`
- ✅ Clean `package.json` dependencies
- ✅ Monorepo still compiles (with expected errors)

---

## Phase 2: Structure Creation (Week 2)

### 🎯 Goal

Create new `odavl-studio/` structure and migrate existing code.

### 📁 Step 2.1: Create Directory Structure (Day 1)

```bash
# Create main studio directory
mkdir odavl-studio

# Create product directories
mkdir odavl-studio\insight
mkdir odavl-studio\insight\core
mkdir odavl-studio\insight\cloud
mkdir odavl-studio\insight\extension
mkdir odavl-studio\insight\cli

mkdir odavl-studio\autopilot
mkdir odavl-studio\autopilot\engine
mkdir odavl-studio\autopilot\recipes
mkdir odavl-studio\autopilot\extension
mkdir odavl-studio\autopilot\cli

mkdir odavl-studio\guardian
mkdir odavl-studio\guardian\app
mkdir odavl-studio\guardian\workers
mkdir odavl-studio\guardian\extension
mkdir odavl-studio\guardian\cli

# Create new apps
mkdir apps\studio-hub
mkdir apps\studio-cli

# Create new packages
mkdir packages\core
mkdir packages\ui
mkdir packages\sdk
```

---

### 🔄 Step 2.2: Migrate ODAVL Insight (Day 2)

**2.2.1: Migrate Insight Core**

```bash
# Copy insight-core to new location
xcopy /E /I packages\insight-core\* odavl-studio\insight\core\

# Create package.json for insight/core
```

**New `odavl-studio/insight/core/package.json`:**

```json
{
  "name": "@odavl-studio/insight-core",
  "version": "2.0.0",
  "description": "ODAVL Insight - Core Detection Logic",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./detector": {
      "import": "./dist/detector.js",
      "require": "./dist/detector.cjs"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts src/detector.ts --format esm,cjs --dts",
    "dev": "tsup src/index.ts src/detector.ts --format esm,cjs --dts --watch"
  },
  "dependencies": {
    "@odavl/types": "workspace:*"
  }
}
```

**2.2.2: Migrate Insight Cloud**

```bash
# Copy insight-cloud to new location
xcopy /E /I apps\insight-cloud\* odavl-studio\insight\cloud\
```

**Update `odavl-studio/insight/cloud/package.json`:**

```json
{
  "name": "@odavl-studio/insight-cloud",
  "version": "2.0.0",
  "description": "ODAVL Insight - Cloud Dashboard",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@odavl-studio/insight-core": "workspace:*",
    "@odavl/types": "workspace:*",
    "next": "15.4.5",
    "react": "19.0.0"
  }
}
```

**2.2.3: Update imports in Insight Cloud**

Replace all imports:

```typescript
// Before
import { detector } from '@odavl/insight-core';

// After
import { detector } from '@odavl-studio/insight-core';
```

---

### 🔄 Step 2.3: Migrate ODAVL Autopilot (Day 3)

**2.3.1: Migrate CLI to Autopilot Engine**

```bash
# Copy CLI to autopilot/engine
xcopy /E /I apps\cli\* odavl-studio\autopilot\engine\
```

**Update `odavl-studio/autopilot/engine/package.json`:**

```json
{
  "name": "@odavl-studio/autopilot-engine",
  "version": "2.0.0",
  "description": "ODAVL Autopilot - Autonomous Repair Engine",
  "main": "dist/index.js",
  "bin": {
    "odavl-autopilot": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@odavl-studio/insight-core": "workspace:*",
    "@odavl/types": "workspace:*"
  }
}
```

**2.3.2: Move recipes**

```bash
# Copy recipes from .odavl/recipes to autopilot/recipes
xcopy /E /I .odavl\recipes\* odavl-studio\autopilot\recipes\

# Create README.md in recipes directory
```

**`odavl-studio/autopilot/recipes/README.md`:**

```markdown
# ODAVL Autopilot Recipes

This directory contains autonomous repair recipes used by the Autopilot engine.

## Available Recipes

1. `esm-hygiene.json` - ESM module hygiene
2. `import-cleaner.json` - Import cleanup
3. `remove-unused.json` - Remove unused code
4. `security-hardening.json` - Security improvements
5. `typescript-fixer.json` - TypeScript error fixes

## Recipe Format

See ODAVL_AUTOPILOT_RECIPES.md for full documentation.
```

---

### 🔄 Step 2.4: Migrate ODAVL Guardian (Day 4)

**2.4.1: Migrate Guardian App**

```bash
# Copy guardian to new location
xcopy /E /I apps\guardian\* odavl-studio\guardian\app\
```

**Update `odavl-studio/guardian/app/package.json`:**

```json
{
  "name": "@odavl-studio/guardian-app",
  "version": "2.0.0",
  "description": "ODAVL Guardian - Pre/Post Deploy Testing & Monitoring",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@odavl/types": "workspace:*",
    "next": "15.4.5",
    "react": "19.0.0",
    "@prisma/client": "^5.0.0",
    "bullmq": "^5.0.0",
    "ioredis": "^5.0.0"
  }
}
```

**2.4.2: Extract workers to separate directory**

```bash
# Move workers
xcopy /E /I odavl-studio\guardian\app\src\workers\* odavl-studio\guardian\workers\

# Create package.json for workers
```

**`odavl-studio/guardian/workers/package.json`:**

```json
{
  "name": "@odavl-studio/guardian-workers",
  "version": "2.0.0",
  "description": "ODAVL Guardian - Background Workers",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@odavl/types": "workspace:*",
    "bullmq": "^5.0.0",
    "ioredis": "^5.0.0"
  }
}
```

---

### 🔧 Step 2.5: Update Workspace Configuration (Day 5)

**Update `pnpm-workspace.yaml`:**

```yaml
packages:
  # ODAVL Studio Products
  - 'odavl-studio/insight/*'
  - 'odavl-studio/autopilot/*'
  - 'odavl-studio/guardian/*'
  
  # Apps
  - 'apps/*'
  
  # Packages
  - 'packages/*'
  
  # Internal (excluded from public builds)
  - 'internal/*'
```

**Update root `tsconfig.json`:**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@odavl-studio/insight-core": ["odavl-studio/insight/core/src"],
      "@odavl-studio/insight-cloud": ["odavl-studio/insight/cloud/src"],
      "@odavl-studio/autopilot-engine": ["odavl-studio/autopilot/engine/src"],
      "@odavl-studio/guardian-app": ["odavl-studio/guardian/app/src"],
      "@odavl/types": ["packages/types/src"],
      "@odavl/core": ["packages/core/src"]
    }
  }
}
```

**Install dependencies:**

```bash
pnpm install
```

---

### ✅ Phase 2 Deliverables

- ✅ `odavl-studio/` directory created with 3 product folders
- ✅ Existing code migrated to new structure
- ✅ Package names updated (`@odavl-studio/*`)
- ✅ Workspace configuration updated
- ✅ Import paths updated
- ✅ Project compiles successfully

---

## Phase 3: Build New Components (Weeks 3-6)

### 🎯 Goal

Build brand new components: Website, SDK, VS Code Extensions

### 🌐 Step 3.1: Studio Hub Website (Week 3)

**Create Next.js 15 app:**

```bash
cd apps
pnpm create next-app studio-hub --typescript --tailwind --app --no-src-dir
cd studio-hub
```

**Install dependencies:**

```bash
pnpm add framer-motion lucide-react @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

**Project structure:**

```
apps/studio-hub/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                 → Homepage
│   │   ├── pricing/page.tsx         → Pricing
│   │   ├── products/
│   │   │   ├── insight/page.tsx     → Insight product page
│   │   │   ├── autopilot/page.tsx   → Autopilot product page
│   │   │   └── guardian/page.tsx    → Guardian product page
│   │   └── docs/page.tsx            → Documentation
│   ├── (auth)/
│   │   ├── login/page.tsx           → Login
│   │   └── signup/page.tsx          → Signup
│   └── layout.tsx
├── components/
│   ├── ui/                          → Shadcn components
│   ├── marketing/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── ProductCard.tsx
│   │   └── PricingCard.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   └── utils.ts
└── public/
    └── images/
```

**Design system:**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          // ... (Insight blue)
        },
        autopilot: {
          50: '#fdf4ff',
          // ... (Autopilot purple)
        },
        guardian: {
          50: '#f0fdf4',
          // ... (Guardian green)
        }
      }
    }
  }
}
```

**Key pages implementation:**

**Homepage (`app/(marketing)/page.tsx`):**

```tsx
import { Hero } from '@/components/marketing/Hero';
import { Features } from '@/components/marketing/Features';
import { ProductShowcase } from '@/components/marketing/ProductShowcase';
import { Pricing } from '@/components/marketing/Pricing';
import { CTA } from '@/components/marketing/CTA';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <ProductShowcase />
      <Pricing />
      <CTA />
    </main>
  );
}
```

**Pricing page:**

```tsx
export default function PricingPage() {
  const plans = [
    {
      name: 'ODAVL Insight',
      price: 29,
      features: ['AI error detection', '12 intelligent detectors', 'Real-time analysis']
    },
    {
      name: 'ODAVL Autopilot',
      price: 49,
      features: ['Autonomous repair', 'Recipe-based fixes', 'Trust scoring']
    },
    {
      name: 'ODAVL Guardian',
      price: 39,
      features: ['Pre-deploy testing', 'Post-deploy monitoring', 'Real-time alerts']
    },
    {
      name: 'Studio Complete',
      price: 99,
      highlight: true,
      features: ['All 3 products', 'Save 30%', 'Priority support']
    }
  ];

  return <PricingCards plans={plans} />;
}
```

---

### 📦 Step 3.2: Public SDK (Week 4)

**Create SDK package:**

```bash
mkdir -p packages/sdk/src
cd packages/sdk
```

**`packages/sdk/package.json`:**

```json
{
  "name": "@odavl-studio/sdk",
  "version": "2.0.0",
  "description": "ODAVL Studio - Official SDK for Insight, Autopilot, Guardian",
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./insight": {
      "import": "./dist/insight.js",
      "require": "./dist/insight.cjs"
    },
    "./autopilot": {
      "import": "./dist/autopilot.js",
      "require": "./dist/autopilot.cjs"
    },
    "./guardian": {
      "import": "./dist/guardian.js",
      "require": "./dist/guardian.cjs"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts src/insight.ts src/autopilot.ts src/guardian.ts --format esm,cjs --dts"
  }
}
```

**SDK structure:**

```
packages/sdk/
├── src/
│   ├── index.ts              → Main export (all products)
│   ├── insight.ts            → Insight SDK
│   ├── autopilot.ts          → Autopilot SDK
│   ├── guardian.ts           → Guardian SDK
│   ├── client.ts             → Base HTTP client
│   └── types.ts              → SDK types
└── README.md
```

**Main SDK file (`src/index.ts`):**

```typescript
export * from './insight';
export * from './autopilot';
export * from './guardian';
export * from './types';

// Convenience export for all-in-one usage
export class ODAVLStudio {
  insight: InsightClient;
  autopilot: AutopilotClient;
  guardian: GuardianClient;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.insight = new InsightClient(config);
    this.autopilot = new AutopilotClient(config);
    this.guardian = new GuardianClient(config);
  }
}
```

**Insight SDK (`src/insight.ts`):**

```typescript
export class InsightClient {
  private client: BaseClient;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    this.client = new BaseClient(config);
  }

  async analyze(code: string): Promise<AnalysisResult> {
    return this.client.post('/insight/analyze', { code });
  }

  async fix(issueId: string): Promise<FixResult> {
    return this.client.post(`/insight/fix/${issueId}`);
  }

  async getMetrics(): Promise<Metrics> {
    return this.client.get('/insight/metrics');
  }
}
```

---

### 🔌 Step 3.3: VS Code Extensions (Weeks 5-6)

**Create 3 extensions (shared base):**

```bash
mkdir -p odavl-studio/insight/extension
mkdir -p odavl-studio/autopilot/extension
mkdir -p odavl-studio/guardian/extension
```

**Shared extension base:**

```bash
mkdir -p packages/vscode-shared/src
```

**`packages/vscode-shared/package.json`:**

```json
{
  "name": "@odavl/vscode-shared",
  "version": "2.0.0",
  "description": "Shared utilities for ODAVL VS Code extensions",
  "main": "dist/index.js",
  "dependencies": {
    "@types/vscode": "^1.95.0",
    "@odavl-studio/sdk": "workspace:*"
  }
}
```

**Shared utilities (`packages/vscode-shared/src/index.ts`):**

```typescript
export class ODAVLAuth {
  static async getToken(): Promise<string | null> {
    // Shared authentication logic
  }
}

export class ODAVLWebview {
  static createPanel(context: vscode.ExtensionContext, title: string): vscode.WebviewPanel {
    // Shared webview creation
  }
}
```

**Insight Extension (`odavl-studio/insight/extension/`):**

```typescript
// src/extension.ts
import * as vscode from 'vscode';
import { InsightClient } from '@odavl-studio/sdk/insight';
import { ODAVLAuth } from '@odavl/vscode-shared';

export async function activate(context: vscode.ExtensionContext) {
  const token = await ODAVLAuth.getToken();
  const client = new InsightClient({ apiKey: token! });

  // Register diagnostics provider
  const diagnosticsProvider = new InsightDiagnosticsProvider(client);
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { scheme: 'file', language: 'typescript' },
      diagnosticsProvider
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('odavl.insight.analyze', async () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const result = await client.analyze(editor.document.getText());
        // Show results
      }
    })
  );
}
```

**Extension manifest (`package.json`):**

```json
{
  "name": "odavl-insight",
  "displayName": "ODAVL Insight",
  "description": "AI-powered error detection for React/Next.js",
  "version": "2.0.0",
  "publisher": "odavl",
  "engines": {
    "vscode": "^1.95.0"
  },
  "categories": ["Linters", "Debuggers"],
  "activationEvents": ["onStartupFinished"],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "odavl.insight.analyze",
        "title": "ODAVL Insight: Analyze Current File"
      }
    ]
  }
}
```

**Repeat for Autopilot and Guardian extensions with product-specific features.**

---

### ✅ Phase 3 Deliverables

- ✅ Studio Hub website (Next.js 15, world-class design)
- ✅ Public SDK (@odavl-studio/sdk) with all 3 products
- ✅ 3 VS Code extensions (Insight, Autopilot, Guardian)
- ✅ Shared utilities package
- ✅ Comprehensive documentation

---

## Phase 4: Integration (Weeks 7-8)

### 🎯 Goal

Connect all components with unified CLI and authentication.

### 🖥️ Step 4.1: Unified CLI (Week 7)

**Create CLI app:**

```bash
cd apps
mkdir studio-cli
cd studio-cli
```

**`apps/studio-cli/package.json`:**

```json
{
  "name": "@odavl-studio/cli",
  "version": "2.0.0",
  "description": "ODAVL Studio - Unified CLI for all products",
  "bin": {
    "odavl": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "@odavl-studio/insight-core": "workspace:*",
    "@odavl-studio/autopilot-engine": "workspace:*",
    "@odavl-studio/sdk": "workspace:*",
    "commander": "^12.0.0"
  }
}
```

**CLI structure:**

```typescript
// src/index.ts
#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('odavl')
  .description('ODAVL Studio - Unified CLI')
  .version('2.0.0');

// Insight commands
program
  .command('insight')
  .description('ODAVL Insight commands')
  .action(() => {
    import('./commands/insight').then(m => m.insightCommand());
  });

// Autopilot commands
program
  .command('autopilot')
  .description('ODAVL Autopilot commands')
  .action(() => {
    import('./commands/autopilot').then(m => m.autopilotCommand());
  });

// Guardian commands
program
  .command('guardian')
  .description('ODAVL Guardian commands')
  .action(() => {
    import('./commands/guardian').then(m => m.guardianCommand());
  });

program.parse();
```

**Example: Insight commands (`src/commands/insight.ts`):**

```typescript
import { Command } from 'commander';
import { InsightClient } from '@odavl-studio/sdk/insight';

export function insightCommand() {
  const insight = new Command('insight');

  insight
    .command('analyze')
    .description('Analyze current directory')
    .action(async () => {
      const client = new InsightClient({ apiKey: process.env.ODAVL_API_KEY! });
      const result = await client.analyze(process.cwd());
      console.log(result);
    });

  insight
    .command('fix')
    .description('Auto-fix detected issues')
    .action(async () => {
      // Auto-fix logic
    });

  insight.parse();
}
```

---

### 🔐 Step 4.2: ODAVL ID Authentication (Week 8)

**Create auth package:**

```bash
mkdir -p packages/auth/src
```

**`packages/auth/package.json`:**

```json
{
  "name": "@odavl/auth",
  "version": "2.0.0",
  "description": "ODAVL ID - Unified authentication",
  "main": "dist/index.js",
  "dependencies": {
    "jsonwebtoken": "^9.0.0"
  }
}
```

**Auth implementation:**

```typescript
// packages/auth/src/index.ts
import jwt from 'jsonwebtoken';

export class ODAVLAuth {
  static async login(email: string, password: string): Promise<string> {
    // Call auth API
    const response = await fetch('https://api.odavl.studio/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const { token } = await response.json();
    return token;
  }

  static async verify(token: string): Promise<boolean> {
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      return true;
    } catch {
      return false;
    }
  }

  static async getUser(token: string): Promise<User> {
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    return {
      id: decoded.sub!,
      email: decoded.email!,
      products: decoded.products as string[]
    };
  }
}
```

**Integrate auth into CLI:**

```bash
odavl login                    # Login with ODAVL ID
odavl logout                   # Logout
odavl whoami                   # Show current user
```

**Integrate auth into extensions:**

```typescript
// Store token in VS Code secrets
await context.secrets.store('odavl.token', token);
```

---

### 🔗 Step 4.3: Shared Packages (Week 8)

**Create core package:**

```bash
mkdir -p packages/core/src
```

**`packages/core/package.json`:**

```json
{
  "name": "@odavl/core",
  "version": "2.0.0",
  "description": "ODAVL - Shared utilities",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts"
  }
}
```

**Core utilities:**

```typescript
// packages/core/src/index.ts
export * from './logger';
export * from './config';
export * from './utils';

// packages/core/src/logger.ts
export class Logger {
  static info(message: string) {
    console.log(`[INFO] ${message}`);
  }
  static error(message: string) {
    console.error(`[ERROR] ${message}`);
  }
}

// packages/core/src/config.ts
export class Config {
  static get(key: string): string | undefined {
    return process.env[key];
  }
}
```

**Create UI package (React components):**

```bash
mkdir -p packages/ui/src
```

**Shared React components:**

```typescript
// packages/ui/src/Button.tsx
export function Button({ children, onClick }: ButtonProps) {
  return (
    <button onClick={onClick} className="odavl-button">
      {children}
    </button>
  );
}

// Export all components
export * from './Button';
export * from './Card';
export * from './Badge';
```

---

### ✅ Phase 4 Deliverables

- ✅ Unified CLI (`odavl <product> <command>`)
- ✅ ODAVL ID authentication system
- ✅ Shared packages (core, auth, ui)
- ✅ All components integrated
- ✅ Single sign-on works across CLI, extensions, dashboards

---

## Phase 5: Testing & Launch (Week 9)

### 🎯 Goal

Ensure quality and launch ODAVL Studio 1.0.

### 🧪 Step 5.1: Comprehensive Testing (Days 1-3)

**Unit tests:**

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage
```

**Integration tests:**

```bash
# Test CLI commands
pnpm test:integration

# Test API endpoints
pnpm test:api
```

**E2E tests:**

```bash
# Test VS Code extensions
pnpm test:e2e:extensions

# Test website
pnpm test:e2e:website
```

**Target:** 80%+ coverage across all packages.

---

### ⚡ Step 5.2: Performance Optimization (Day 4)

**Metrics:**

- Website: <2s page load
- CLI: <1s command execution
- Extensions: <500ms response time

**Optimizations:**

- Bundle splitting for Next.js apps
- Tree shaking for SDK
- Lazy loading for VS Code extensions

---

### 📚 Step 5.3: Documentation (Day 5)

**Update documentation:**

1. README.md (root) - Overview of ODAVL Studio
2. docs/getting-started.md - Quick start guide
3. docs/products/ - Individual product docs
4. docs/api/ - API reference (SDK)
5. docs/cli/ - CLI reference

**Generate API docs:**

```bash
pnpm typedoc --out docs/api packages/sdk/src
```

---

### 🚀 Step 5.4: Deployment (Days 6-7)

**Deploy website:**

```bash
cd apps/studio-hub
vercel deploy --prod
```

**Publish SDK to npm:**

```bash
cd packages/sdk
pnpm publish --access public
```

**Publish VS Code extensions:**

```bash
cd odavl-studio/insight/extension
vsce package
vsce publish

cd odavl-studio/autopilot/extension
vsce publish

cd odavl-studio/guardian/extension
vsce publish
```

---

### ✅ Phase 5 Deliverables

- ✅ 80%+ test coverage
- ✅ Performance optimized
- ✅ Documentation complete
- ✅ Website deployed
- ✅ SDK published to npm
- ✅ Extensions published to marketplace
- ✅ **ODAVL Studio 1.0 LAUNCHED!** 🎉

---

## 📊 Final Checklist

### Technical

- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] All tests passing
- [ ] 80%+ coverage
- [ ] Performance metrics met
- [ ] Security audit passed

### Functional

- [ ] All 3 products work independently
- [ ] Unified CLI works (`odavl <product> <command>`)
- [ ] ODAVL ID auth works across all products
- [ ] VS Code extensions connect to cloud dashboards
- [ ] SDK published and documented

### Business

- [ ] Website live at odavl.studio
- [ ] Pricing page live
- [ ] Documentation complete
- [ ] Beta users onboarded
- [ ] Payment integration ready

---

## 🎯 Success Metrics

**Technical:**

- Build time: <2 minutes for full monorepo
- Test suite: <30 seconds
- Zero production errors in first week

**User:**

- Onboarding: <5 minutes to first value
- Extension activation: <2 seconds
- CLI response: <1 second

**Business:**

- Beta users: 50+ in first month
- Paying customers: 10+ in first month
- MRR: $1,000+ by month 2

---

## 📝 Notes

- Use feature flags for gradual rollout
- Monitor performance with Sentry
- Collect user feedback continuously
- Iterate based on real usage data

**Let's ship it! 🚀**
