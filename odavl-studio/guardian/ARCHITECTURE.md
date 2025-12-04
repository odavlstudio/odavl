# 🏗️ Guardian v4.1 Architecture

## Overview
Guardian v4.1 features a modular, maintainable architecture with clear separation of concerns.

## Directory Structure

```
guardian/
├── cli/                    # Command-Line Interface (Primary Entry Point)
│   ├── guardian-modular.ts # New modular CLI (v4.1)
│   ├── guardian.ts         # Legacy monolith (v4.0 - kept for reference)
│   ├── src/
│   │   ├── commands/       # Command modules
│   │   │   └── test-command.ts
│   │   ├── services/       # Core services
│   │   │   ├── ai-service.ts      # AI with fallback
│   │   │   └── report-service.ts  # Report generation
│   │   └── utils/          # Helper utilities
│   ├── real-tests.ts       # Test execution implementation
│   └── package.json        # CLI dependencies
│
├── app/                    # Next.js Dashboard (Web UI)
│   ├── app/                # Next.js 15 app directory
│   ├── components/         # React components
│   ├── src/
│   │   ├── workers/        # Background job workers
│   │   └── scripts/        # Utility scripts
│   ├── prisma/             # Database schema & migrations
│   ├── public/             # Static assets
│   └── package.json        # Dashboard dependencies
│
├── core/                   # Shared Core Logic
│   ├── src/
│   │   ├── analyzers/      # Code analyzers
│   │   ├── detectors/      # Issue detectors
│   │   └── validators/     # Validation logic
│   └── package.json
│
├── extension/              # VS Code Extension
│   ├── src/
│   │   └── extension.ts    # Extension entry point
│   └── package.json
│
├── workers/                # Background Workers
│   ├── src/
│   │   ├── queue-worker.ts # Job queue processor
│   │   └── monitor-worker.ts # Monitoring worker
│   └── package.json
│
├── dashboard/              # Shared UI Components
│   └── components/         # Reusable React components
│
├── api/                    # API Server (Optional)
│   └── routes/             # REST API endpoints
│
└── tests/                  # Integration Tests
    ├── __tests__/          # Test files
    └── fixtures/           # Test fixtures
```

## Component Roles

### 1. CLI (Primary Interface)

**Location:** `cli/`  
**Entry Point:** `guardian-modular.ts`  
**Purpose:** Command-line testing tool

**Key Features:**
- Modular architecture (no 2K+ line files)
- AI service with automatic fallback
- Multiple test modes (quick/full/ai)
- Report generation (JSON/HTML)

**Usage:**
```bash
guardian test              # Run tests
guardian quick             # Fast mode
guardian full              # Comprehensive
guardian ai                # AI-powered
```

### 2. Dashboard App (Web Interface)

**Location:** `app/`  
**Framework:** Next.js 15  
**Purpose:** Visual test results and monitoring

**Key Features:**
- Real-time test results
- Historical trend analysis
- Team collaboration
- Project management

**Usage:**
```bash
cd app && pnpm dev         # Start dashboard
# Access at http://localhost:3003
```

### 3. Core Package (Shared Logic)

**Location:** `core/`  
**Purpose:** Reusable testing logic shared between CLI and dashboard

**Exports:**
- Analyzers (code, dependencies, security)
- Detectors (issues, patterns, violations)
- Validators (quality gates, thresholds)

**Used By:**
- CLI (for command execution)
- Dashboard (for web UI)
- Extension (for VS Code integration)

### 4. VS Code Extension

**Location:** `extension/`  
**Purpose:** Real-time testing inside VS Code

**Features:**
- Problems panel integration
- Status bar indicators
- Quick testing commands
- Live feedback

### 5. Workers (Background Jobs)

**Location:** `workers/`  
**Purpose:** Asynchronous task processing

**Jobs:**
- Scheduled testing
- Monitoring checks
- Report generation
- Notifications

### 6. Dashboard Components (Shared UI)

**Location:** `dashboard/components/`  
**Purpose:** Reusable React components

**Used By:**
- `app/` (Next.js dashboard)
- Extension webview panels

**Note:** This is NOT a separate dashboard - just shared components!

## Architecture Principles

### 1. **Separation of Concerns**
Each component has a single, clear purpose:
- CLI = Command execution
- App = Visual interface
- Core = Business logic
- Workers = Background processing

### 2. **Modular Design**
Instead of:
```typescript
// ❌ Old way (v4.0): 2,118-line guardian.ts
guardian.ts (everything in one file)
```

New way (v4.1):
```typescript
// ✅ New modular structure
guardian-modular.ts        # Entry point (200 lines)
src/commands/              # Command modules (300 lines each)
src/services/              # Services (200 lines each)
src/utils/                 # Utilities (small files)
```

### 3. **AI with Fallback**
```typescript
// Always works, even without AI
if (aiAvailable) {
  result = await analyzeWithAI();
} else {
  result = fallbackAnalysis(); // Rule-based
}
```

### 4. **Dependency Minimization**
```json
{
  "dependencies": {
    // Core only
    "@anthropic-ai/sdk": "^0.71.0",  // AI (optional)
    "chalk": "^5.4.1",                // Colors
    "commander": "^12.1.0",           // CLI
    "ora": "^8.1.1",                  // Spinners
    "playwright": ">=1.55.1"          // Testing
    // Removed: depcheck, fastest-levenshtein, js-yaml
  }
}
```

## Data Flow

### Testing Flow

```
User Command
    ↓
guardian-modular.ts (CLI entry)
    ↓
test-command.ts (Command handler)
    ↓
┌─────────────────────────────┐
│ Phase 1: Static Analysis    │
│ (uses core/analyzers)       │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ Phase 2: Runtime Tests      │
│ (uses playwright)           │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│ Phase 3: AI Analysis        │
│ (ai-service with fallback)  │
└─────────────────────────────┘
    ↓
report-service.ts (Generate report)
    ↓
Save to .guardian/reports/
    ↓
Display results
```

### Dashboard Flow

```
User visits http://localhost:3003
    ↓
Next.js app/ renders UI
    ↓
API routes fetch data
    ↓
Prisma queries PostgreSQL
    ↓
Components render results
    ↓
WebSocket for real-time updates
```

## Package Dependencies

### CLI Dependencies (Minimal)
```
@anthropic-ai/sdk  # AI analysis (optional)
chalk              # Terminal colors
commander          # CLI framework
ora                # Progress spinners
playwright         # Browser testing
```

### Dashboard Dependencies (Full Stack)
```
next               # Framework
@prisma/client     # Database
react              # UI
@radix-ui/*        # Components
playwright         # Testing
bullmq             # Job queue
ioredis            # Redis client
```

### Core Dependencies (None!)
```
# Core package has ZERO external dependencies
# Pure TypeScript logic only
```

## Building the Project

### Build CLI
```bash
cd cli
pnpm build
# Creates: dist/guardian-modular.{js,mjs,d.ts}
```

### Build Dashboard
```bash
cd app
pnpm build
# Creates: .next/ (production build)
```

### Build All
```bash
# From guardian/ root
pnpm build:all
```

## Testing Strategy

### Unit Tests
```bash
pnpm test              # All unit tests
pnpm test:coverage     # With coverage
```

### Integration Tests
```bash
pnpm test:integration  # Cross-component tests
```

### E2E Tests
```bash
pnpm test:e2e          # Full workflow tests
```

## Configuration

### CLI Configuration
```json
// guardian.config.json (project root)
{
  "mode": "quick",
  "thresholds": {
    "readiness": 90,
    "critical": 0
  }
}
```

### Dashboard Configuration
```env
# app/.env.local
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-...
```

## Deployment

### CLI (npm/pnpm)
```bash
# Publish to npm
cd cli
pnpm build
npm publish
```

### Dashboard (Vercel/Docker)
```bash
# Deploy to Vercel
cd app
vercel deploy

# Or Docker
docker build -t guardian-app .
docker run -p 3003:3003 guardian-app
```

## Migration Guide (v4.0 → v4.1)

### Breaking Changes
**None!** v4.1 is fully backward compatible.

### Recommended Updates

1. **Use new CLI entry point:**
```bash
# Old (still works)
guardian test

# New (recommended - uses modular version)
guardian test  # Automatically uses guardian-modular.ts
```

2. **Update imports in custom code:**
```typescript
// Old
import { runTests } from '@odavl-studio/guardian-cli';

// New
import { executeTests } from '@odavl-studio/guardian-cli/commands/test-command';
```

3. **Enable AI with fallback:**
```bash
# Optional: Set API key
export ANTHROPIC_API_KEY="your-key"

# Works without API key (fallback mode)
guardian test
```

## Future Roadmap

### v4.2 (Next Release)
- [ ] Plugin system for custom checks
- [ ] Remote monitoring dashboard
- [ ] Docker containerized tests
- [ ] Multi-language support (Python, Java)

### v5.0 (Long-term)
- [ ] Distributed testing (parallel browsers)
- [ ] Advanced AI features (GPT-4V integration)
- [ ] Real-time collaboration
- [ ] SaaS platform

## Troubleshooting

### "Module not found"
```bash
# Ensure dependencies are installed
cd cli && pnpm install
cd ../app && pnpm install
```

### "AI not available"
✅ **This is normal!** Guardian works without AI.

To enable: `export ANTHROPIC_API_KEY="your-key"`

### Dashboard won't start
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check environment variables
cat app/.env.local
```

## Support

- 📖 Documentation: `./docs/`
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 🌐 Website: https://odavl.dev

---

**Architecture designed for:**
- ✅ Maintainability (modular, small files)
- ✅ Scalability (clear separation)
- ✅ Testability (dependency injection)
- ✅ Flexibility (AI optional, fallback included)
- ✅ Developer Experience (clear structure, good DX)
