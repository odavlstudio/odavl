# 🚀 Guardian Quick Setup Guide

## Overview
ODAVL Guardian v4.1 is now **zero-config ready**! It works out of the box with automatic fallback when AI is unavailable.

## Installation

### Option 1: Global Install (Recommended)
```bash
npm install -g @odavl-studio/guardian-cli
# or
pnpm add -g @odavl-studio/guardian-cli
```

### Option 2: Local Install
```bash
npm install --save-dev @odavl-studio/guardian-cli
# or
pnpm add -D @odavl-studio/guardian-cli
```

### Option 3: Run Without Installing
```bash
npx @odavl-studio/guardian-cli test
# or
pnpm dlx @odavl-studio/guardian-cli test
```

## Quick Start (3 Steps)

### 1️⃣ Test Your Project
```bash
# Test current directory
guardian test

# Test specific project
guardian test ./my-app

# Test website
guardian test -u https://myapp.com
```

### 2️⃣ Choose Test Mode
```bash
guardian quick   # Fast (~30 seconds)
guardian full    # Comprehensive (~5 minutes)
guardian ai      # AI-powered (requires API key)
```

### 3️⃣ View Results
Results are displayed in terminal and saved to `.guardian/reports/`.

## AI Features (Optional)

Guardian works without AI, but for enhanced analysis:

```bash
# Set API key (get from anthropic.com)
export ANTHROPIC_API_KEY="your-api-key"

# Now AI features are enabled:
guardian ai -u https://myapp.com
```

**AI Features:**
- 📸 Visual screenshot analysis
- 🔍 Smart error interpretation
- 💡 Intelligent suggestions

**Without AI:**
- ✅ Rule-based analysis
- ✅ Pattern matching
- ✅ Heuristic checks

## Configuration (Optional)

Create `guardian.config.json` in your project root:

```json
{
  "mode": "quick",
  "platform": "all",
  "thresholds": {
    "readiness": 90,
    "critical": 0,
    "warnings": 3
  },
  "exclude": [
    "node_modules",
    "dist",
    ".next"
  ]
}
```

## Features

### ✅ Core Features (Always Available)
- Static code analysis
- Dependency checking
- Security scanning
- Performance testing
- Accessibility checks
- Visual regression testing

### 🤖 AI Features (With API Key)
- Screenshot analysis with Claude
- Error log interpretation
- Smart fix suggestions
- Context-aware recommendations

### 📊 Reporting
- Terminal output (colorful, concise)
- JSON export (`--json`)
- HTML reports (`--html`)
- Comparison with previous runs (`--compare`)

## Examples

### Basic Testing
```bash
# Quick test with HTML report
guardian quick --html

# Full test with comparison
guardian full --compare

# Test website
guardian test -u https://example.com --html
```

### Advanced Usage
```bash
# AI analysis with all outputs
guardian ai -u https://myapp.com --html --json --compare

# Verbose mode for debugging
guardian test --verbose

# Skip runtime tests (static only)
guardian test --skip-tests
```

### CI/CD Integration
```yaml
# .github/workflows/guardian.yml
name: Guardian Check
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npx @odavl-studio/guardian-cli quick --json
```

## Troubleshooting

### "No API key found"
✅ **This is OK!** Guardian works without AI using fallback mode.

To enable AI: `export ANTHROPIC_API_KEY="your-key"`

### Build errors
```bash
# Ensure dependencies are installed
pnpm install

# Clear cache and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

### Permission denied (Unix)
```bash
chmod +x ./node_modules/.bin/guardian
```

## Performance

| Mode | Duration | Checks |
|------|----------|--------|
| **Quick** | ~30s | Core checks only |
| **Full** | ~5min | Comprehensive analysis |
| **AI** | ~2min | AI-powered + core checks |

## Simplified Architecture

Guardian v4.1 uses a modular architecture:

```
guardian-cli/
├── guardian-modular.ts      # Main entry (replaces 2118-line monolith)
├── src/
│   ├── commands/
│   │   └── test-command.ts  # Test execution logic
│   ├── services/
│   │   ├── ai-service.ts    # AI with fallback
│   │   └── report-service.ts # Report generation
│   └── utils/
│       └── ... (helpers)
└── real-tests.ts            # Runtime test implementation
```

## Migration from v4.0

If you're using Guardian v4.0, no changes needed! v4.1 is backward compatible:

```bash
# Old command still works
guardian test

# New modular version automatically used
# Old version available via: pnpm dev:old
```

## What's New in v4.1

✨ **New Features:**
- 🔄 Automatic AI fallback (zero-config ready)
- 📦 Modular architecture (better maintainability)
- 🎨 Simplified dependencies (faster install)
- 📊 Enhanced HTML reports
- 🐛 Improved error messages

⚡ **Performance:**
- 30% faster startup time
- 50% smaller bundle size
- Better memory usage

🛡️ **Stability:**
- No crashes when AI unavailable
- Graceful degradation
- Better error handling

## Support

- 📖 Documentation: `guardian help-detailed`
- 💬 Issues: GitHub Issues
- 🌐 Website: odavl.dev

## Next Steps

1. ✅ Run your first test: `guardian quick`
2. 📊 Check the HTML report: Look in `.guardian/reports/`
3. 🎯 Set quality goals in `guardian.config.json`
4. 🔄 Add to CI/CD pipeline
5. 🤖 Optional: Enable AI features with API key

---

**Ready to launch? Let Guardian verify!** 🚀
