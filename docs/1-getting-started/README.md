# 🚀 Getting Started with ODAVL Studio

**Welcome!** This guide will help you install and configure ODAVL Studio in less than 5 minutes.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** - [Download](https://nodejs.org/)
- ✅ **pnpm 8+** - Install: `npm install -g pnpm`
- ✅ **Git** - [Download](https://git-scm.com/)
- ✅ **VS Code** (recommended) - [Download](https://code.visualstudio.com/)

---

## ⚡ Quick Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/odavl.git
cd odavl
```

### Step 2: Install Dependencies

```bash
# Install all packages (pnpm required!)
pnpm install
```

### Step 3: Build All Packages

```bash
# Build entire monorepo
pnpm build
```

### Step 4: Verify Installation

```bash
# Run tests
pnpm test

# Check build status
pnpm forensic:all
```

---

## 🎯 First Steps

### Option 1: Use Insight (Error Detection)

```bash
# Interactive CLI
pnpm odavl:insight

# Or via unified CLI
odavl insight analyze --detectors typescript,eslint
```

### Option 2: Use Autopilot (Self-Healing)

```bash
# Run full O-D-A-V-L cycle
odavl autopilot run --max-files 10

# Check governance rules
cat .odavl/gates.yml
```

### Option 3: Install VS Code Extensions

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "ODAVL"
4. Install:
   - ODAVL Insight
   - ODAVL Autopilot
   - ODAVL Guardian

---

## 📁 Project Structure

```
odavl/
├── odavl-studio/           # Three products
│   ├── insight/            # Error detection
│   ├── autopilot/          # Self-healing
│   └── guardian/           # Testing
├── apps/
│   ├── studio-cli/         # Unified CLI
│   └── studio-hub/         # Marketing site
├── packages/               # Shared packages
├── docs/                   # Documentation (you are here!)
├── .odavl/                 # Configuration & data
└── scripts/                # Automation scripts
```

---

## ⚙️ Configuration

### Create `.odavl/gates.yml`

```yaml
# Governance rules for Autopilot
risk_budget: 100
forbidden_paths:
  - security/**
  - public-api/**
  - "**/*.spec.*"
  - auth/**
actions:
  max_auto_changes: 10
  max_files_per_cycle: 10
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
```

### Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

**Required Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection (Upstash)
- `JWT_SECRET` - Authentication secret
- `SENTRY_DSN` - Error tracking (optional)

---

## 🧪 Run Tests

```bash
# All tests
pnpm test

# With coverage
pnpm test:coverage

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e
```

---

## 🚀 Development Mode

### Start All Dev Servers

```bash
pnpm dev
```

This starts:
- Insight Cloud: `http://localhost:3001`
- Guardian App: `http://localhost:3002`
- Studio Hub: `http://localhost:3000`

### Start Individual Products

```bash
# Insight Cloud only
pnpm insight:dev

# Guardian App only
pnpm guardian:dev

# Studio Hub only
pnpm hub:dev
```

---

## 🔧 Common Commands

```bash
# Build all packages
pnpm build

# Lint entire monorepo
pnpm lint

# TypeScript check
pnpm typecheck

# Full quality check (lint + typecheck + coverage)
pnpm forensic:all

# Clean build artifacts
pnpm clean
```

---

## 📚 Next Steps

Now that you're set up:

1. **[Quick Start Tutorial](./quick-start.md)** - 5-minute walkthrough
2. **[User Guides](../2-user-guides/)** - Learn how to use each product
3. **[Developer Guide](../3-developer-guides/DEVELOPER_GUIDE.md)** - Contributing
4. **[Troubleshooting](./troubleshooting.md)** - Common issues

---

## 🐛 Troubleshooting

### Build Failures

```bash
# Clean and rebuild
rm -rf node_modules
pnpm install
pnpm build
```

### Test Failures

```bash
# Check test output
pnpm test 2>&1 | tee test-output.log

# Run specific test file
pnpm test apps/studio-cli/src/commands/insight.test.ts
```

### Extension Issues

1. Reload VS Code window (Ctrl+Shift+P → "Reload Window")
2. Check extension logs (Output panel → "ODAVL Studio")
3. Verify `.odavl/` directory exists in workspace

---

## ❓ Need Help?

- 📖 Read the [Full Documentation](../README.md)
- 💬 Join [Discord Community](https://discord.gg/odavl)
- 🐛 Report [GitHub Issues](https://github.com/your-org/odavl/issues)
- 📧 Email support@odavl.io

---

**Last Updated:** November 24, 2025
