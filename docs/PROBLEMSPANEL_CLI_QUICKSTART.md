# Problems Panel CLI Integration - Quick Guide

## Overview

This feature allows you to read VS Code Problems Panel diagnostics via CLI using the same interactive menu as choosing directories like `apps/cli` or `odavl-website`.

## How It Works

1. **VS Code Extension** runs 6 detectors when you save a file (Ctrl+S)
2. **Auto-exports** all diagnostics to `.odavl/problems-panel-export.json`
3. **CLI reads** from this export when you choose option `7. problemspanel`
4. **Displays results** in the same format as regular detectors

## Quick Start

### Step 1: Save a file in VS Code

```bash
# Open test-problemspanel.ts
# Press Ctrl+S
# Extension auto-exports diagnostics
```

### Step 2: Run CLI

```bash
pnpm odavl:insight

# Choose: 7. problemspanel
```

### Step 3: View Results

```
📖 Reading from VS Code Problems Panel export...

📅 Export timestamp: 11/8/2025, 10:30:45 AM
📂 Workspace: C:\Users\sabou\dev\odavl
📊 Total files with issues: 1
⚠️  Total issues: 15

🔍 Issues by Detector:

🔒 SECURITY (2 issues)
🌐 NETWORK (1 issue)
💥 RUNTIME (1 issue)
⚡ PERFORMANCE (1 issue)
🧠 COMPLEXITY (1 issue)
```

## Export File Structure

```json
{
  "timestamp": "2025-11-08T10:30:45.123Z",
  "workspaceRoot": "C:\\Users\\sabou\\dev\\odavl",
  "totalFiles": 1,
  "totalIssues": 15,
  "diagnostics": {
    "test-problemspanel.ts": [
      {
        "line": 10,
        "message": "Hardcoded API key detected",
        "severity": "critical",
        "source": "security",
        "code": "HARDCODED_SECRET",
        "file": "test-problemspanel.ts"
      }
    ]
  }
}
```

## Benefits

- ⚡ **Fast**: ~1s (reads JSON vs 10-30s running detectors)
- 🔄 **Auto-updated**: Every Ctrl+S updates the export
- 🎯 **Unified workflow**: Same menu for all analysis types
- 🔗 **VS Code integration**: Leverages Problems Panel UI
- 📊 **No duplication**: Detectors run once (in VS Code)

## Commands

```bash
# Build extension
cd apps/vscode-ext && pnpm build

# Build CLI
cd apps/cli && pnpm build

# Run insight with problemspanel
pnpm odavl:insight
# Choose: 7

# Check export file
cat .odavl/problems-panel-export.json
```

## Troubleshooting

**"No Problems Panel export found"**

- Save any .ts/.tsx/.js/.jsx file in VS Code (Ctrl+S)
- Extension will auto-create `.odavl/problems-panel-export.json`

**Export file outdated**

- Save any file in VS Code to refresh
- Export updates automatically on every save

---

**Version**: v1.3.0-problemspanel  
**Status**: ✅ Ready for testing
