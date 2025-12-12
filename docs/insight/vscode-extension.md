# ODAVL Insight VS Code Extension Guide

**Version**: 1.0.0  
**Last Updated**: December 12, 2025

---

## Overview

The **ODAVL Insight VS Code Extension** brings AI-powered code analysis directly into your editor with real-time error detection, fix suggestions, and cloud integration.

### Key Features

✅ **Real-Time Analysis**
- Automatic analysis on file save
- Issues appear in Problems Panel
- Inline diagnostics with severity colors

✅ **16 Specialized Detectors**
- TypeScript, Security, Performance, Complexity, and more
- Multi-language support (TypeScript, Python, Java, PHP, Ruby, Swift, Kotlin)

✅ **Cloud Integration** (PRO+)
- Connect to ODAVL Cloud for project history
- Team collaboration on issues
- View trends and analytics

✅ **Quick Fixes**
- One-click fix suggestions
- AI-powered code improvements
- Batch fix multiple issues

✅ **Privacy-First**
- Local analysis by default
- Telemetry opt-out
- No source code sent to cloud (only metadata)

---

## Installation

### Method 1: VS Code Marketplace

1. Open **VS Code**
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for **"ODAVL Insight"**
4. Click **Install**
5. Reload VS Code when prompted

### Method 2: Command Line

```bash
code --install-extension odavl.odavl-insight-vscode
```

### Method 3: Manual Installation (.vsix)

1. Download the latest `.vsix` file from [GitHub Releases](https://github.com/odavl-studio/odavl/releases)
2. Open VS Code
3. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
4. Type "Install from VSIX"
5. Select the downloaded `.vsix` file

---

## Quick Start

### Step 1: Open Your Project

```bash
# Open project in VS Code
code /path/to/your/project
```

### Step 2: Extension Activates Automatically

The extension activates when you open a workspace with:
- `package.json` (JavaScript/TypeScript)
- `requirements.txt` (Python)
- `pom.xml` / `build.gradle` (Java)
- `Gemfile` (Ruby)
- `composer.json` (PHP)

### Step 3: Analyze Your Code

**Automatic Analysis:**
- Save any file (`Ctrl+S` / `Cmd+S`)
- Extension analyzes file in background (500ms debounce)
- Results appear in **Problems Panel** (`Ctrl+Shift+M` / `Cmd+Shift+M`)

**Manual Analysis:**
1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type "ODAVL: Analyze Workspace"
3. Press Enter

### Step 4: View Issues

**Problems Panel:**
```
Problems (12)
├── 🔴 Hardcoded API key detected (ODAVL/security)
│   src/config.ts:10:15
├── 🟠 Unused import 'fs' (ODAVL/eslint)
│   src/utils.ts:3:7
├── 🟠 Missing return type annotation (ODAVL/typescript)
│   src/helpers.ts:45:1
└── ...
```

**Click any issue to:**
- Navigate to the exact location
- See full error message
- View fix suggestions

---

## Features in Detail

### 1. Real-Time Diagnostics

**When you save a file:**
1. Extension analyzes file + dependencies
2. Issues appear in Problems Panel within 1-2 seconds
3. Inline squiggly lines highlight issue locations
4. Hover over squigglies for details

**Severity Levels:**
- 🔴 **Critical** - Red squigglies (security, crashes)
- 🟠 **High** - Orange squigglies (errors, bugs)
- 🟡 **Medium** - Yellow squigglies (warnings, best practices)
- 🔵 **Low** - Blue squigglies (suggestions, optimizations)

### 2. Command Palette Actions

Access all features via `Ctrl+Shift+P` / `Cmd+Shift+P`:

| Command | Description |
|---------|-------------|
| **ODAVL: Analyze Workspace** | Analyze all files in workspace |
| **ODAVL: Analyze Current File** | Analyze only the active file |
| **ODAVL: Clear Diagnostics** | Clear all ODAVL issues |
| **ODAVL: Show Output** | View extension logs |
| **ODAVL: Connect to Cloud** | Link to ODAVL Cloud (PRO+) |
| **ODAVL: View Dashboard** | Open Cloud dashboard |
| **ODAVL: Toggle Telemetry** | Enable/disable telemetry |

### 3. Cloud Integration (PRO+)

**Connect to ODAVL Cloud:**

1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type "ODAVL: Connect to Cloud"
3. Login with your account
4. Extension syncs analysis to cloud

**Cloud Benefits:**
- Project history (compare analyses over time)
- Team collaboration (share issues with team)
- Enhanced detectors (database, infrastructure, CI/CD)
- Analytics dashboard (trends, hotspots)

### 4. Quick Fixes

**Apply AI-Powered Fixes:**

1. Click on an issue in Problems Panel
2. Look for 💡 lightbulb icon in editor
3. Click lightbulb or press `Ctrl+.` / `Cmd+.`
4. Select fix from menu:
   - "Remove unused import"
   - "Add type annotation"
   - "Fix security vulnerability"
   - etc.

**Batch Fixes:**
1. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Type "ODAVL: Fix All Auto-Fixable Issues"
3. Review changes
4. Accept or reject

### 5. Settings & Configuration

Open settings: `File > Preferences > Settings` (or `Ctrl+,` / `Cmd+,`)  
Search for: **"odavl"**

**Key Settings:**

| Setting | Default | Description |
|---------|---------|-------------|
| `odavl.enableAutoAnalysis` | `true` | Analyze on file save |
| `odavl.autoAnalysisDelay` | `500` | Debounce delay (ms) |
| `odavl.enabledDetectors` | `["typescript", "eslint", "security", ...]` | Active detectors |
| `odavl.excludePatterns` | `["node_modules/**", "dist/**"]` | Files to ignore |
| `odavl.minSeverity` | `"low"` | Minimum severity to show |
| `odavl.telemetryEnabled` | `true` | Send usage data |
| `odavl.cloudEnabled` | `false` | Enable cloud sync |
| `odavl.cloudAutoSync` | `true` | Auto-sync to cloud |

**Example `.vscode/settings.json`:**
```json
{
  "odavl.enableAutoAnalysis": true,
  "odavl.autoAnalysisDelay": 500,
  "odavl.enabledDetectors": [
    "typescript",
    "eslint",
    "security",
    "performance"
  ],
  "odavl.excludePatterns": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.test.ts"
  ],
  "odavl.minSeverity": "medium",
  "odavl.telemetryEnabled": false
}
```

---

## Common Workflows

### Workflow 1: Daily Development

```
1. Open project in VS Code
   ↓
2. Extension auto-activates
   ↓
3. Edit code, save file (Ctrl+S)
   ↓
4. Issues appear in Problems Panel (1-2s)
   ↓
5. Click issue → navigate to location
   ↓
6. Apply quick fix (Ctrl+.)
   ↓
7. Save again → issue resolved ✅
```

### Workflow 2: Code Review

```
1. Checkout PR branch
   ↓
2. Run manual analysis: Ctrl+Shift+P → "ODAVL: Analyze Workspace"
   ↓
3. Review all issues in Problems Panel
   ↓
4. Filter by severity: Ctrl+Shift+M → dropdown
   ↓
5. Add comments to PR with issue details
   ↓
6. Request changes or approve
```

### Workflow 3: Team Collaboration (Cloud)

```
1. Connect to cloud: Ctrl+Shift+P → "ODAVL: Connect to Cloud"
   ↓
2. Save file → analysis syncs to cloud
   ↓
3. Team member opens dashboard → sees same issues
   ↓
4. Assign issues, add comments
   ↓
5. Fix issues → next analysis shows improvement
   ↓
6. View trends: dashboard shows issue reduction over time
```

### Workflow 4: Pre-Commit Hook

```
1. Stage changes: git add .
   ↓
2. Run analysis: Ctrl+Shift+P → "ODAVL: Analyze Workspace"
   ↓
3. If critical issues → fix before commit
   ↓
4. If no critical issues → commit
   ↓
5. Push with confidence 🚀
```

---

## Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| **Analyze Workspace** | `Ctrl+Shift+A` | `Cmd+Shift+A` |
| **Open Problems Panel** | `Ctrl+Shift+M` | `Cmd+Shift+M` |
| **Quick Fix** | `Ctrl+.` | `Cmd+.` |
| **Command Palette** | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| **Save File** | `Ctrl+S` | `Cmd+S` |
| **Go to Definition** | `F12` | `F12` |

**Customize shortcuts:**
1. `File > Preferences > Keyboard Shortcuts`
2. Search for "odavl"
3. Click pencil icon → set new shortcut

---

## Troubleshooting

### Issue: Extension not activating

**Solution:**
1. Check if workspace has supported files (`package.json`, etc.)
2. Reload VS Code: `Ctrl+Shift+P` → "Reload Window"
3. Check Output panel: `View > Output` → select "ODAVL Insight"

### Issue: No issues detected

**Solution:**
1. Verify detectors enabled: `Settings > odavl.enabledDetectors`
2. Check file not excluded: `Settings > odavl.excludePatterns`
3. Run manual analysis: `Ctrl+Shift+P` → "ODAVL: Analyze Workspace"
4. Check extension logs: `View > Output` → "ODAVL Insight"

### Issue: Analysis too slow

**Solution:**
1. Increase debounce delay: `odavl.autoAnalysisDelay` → `1000` (1 second)
2. Reduce detectors: `odavl.enabledDetectors` → only essential ones
3. Exclude more files: `odavl.excludePatterns` → add `tests/**`, `*.spec.ts`
4. Disable auto-analysis: `odavl.enableAutoAnalysis` → `false` (manual only)

### Issue: Too many issues

**Solution:**
1. Filter by severity: `odavl.minSeverity` → `"high"` or `"critical"`
2. Focus on specific detector: `odavl.enabledDetectors` → `["security"]`
3. Use Problems Panel filters: Click funnel icon → filter by severity

### Issue: Cloud connection failed

**Solution:**
1. Check internet connection
2. Verify auth token: `Ctrl+Shift+P` → "ODAVL: Check Auth Status"
3. Re-login: `Ctrl+Shift+P` → "ODAVL: Connect to Cloud"
4. Check cloud status: https://status.odavl.studio

---

## Privacy & Security

### What Data is Collected?

**With Telemetry Enabled (default):**
- ✅ Usage statistics (commands used, detectors run)
- ✅ Performance metrics (analysis duration)
- ✅ Issue counts (by severity, detector)
- ❌ **NO source code**
- ❌ **NO file names**
- ❌ **NO file paths**
- ❌ **NO user-identifiable information**

**With Cloud Sync Enabled (PRO+):**
- ✅ Issue metadata (message, file, line, severity)
- ✅ Project metadata (name, language)
- ❌ **NO source code**

### How to Opt Out

**Disable Telemetry:**
```json
// .vscode/settings.json
{
  "odavl.telemetryEnabled": false
}
```

**Or via environment variable:**
```bash
export ODAVL_TELEMETRY_ENABLED="false"
```

**Disable Cloud Sync:**
```json
{
  "odavl.cloudEnabled": false
}
```

**Compliance:**
- ✅ GDPR compliant
- ✅ SOC 2 Type II (in progress)
- ✅ Data encrypted in transit (TLS 1.3)
- ✅ Data encrypted at rest (AES-256)

[Read our Privacy Policy →](https://odavl.studio/privacy)

---

## FAQs

**Q: Does the extension slow down VS Code?**  
A: No. Analysis runs in background with lazy loading. Startup time <200ms.

**Q: Can I use it offline?**  
A: Yes. Local analysis works offline. Cloud features require internet.

**Q: What languages are supported?**  
A: Full support: TypeScript/JavaScript. Experimental: Python, Java, PHP, Ruby, Swift, Kotlin.

**Q: Is it free?**  
A: Yes. Local analysis is FREE forever. Cloud features require PRO plan ($29/mo).

**Q: How does it compare to ESLint/TSC?**  
A: ODAVL Insight includes ESLint/TSC plus 14 more detectors (security, performance, etc.). It's a superset.

**Q: Can I customize detectors?**  
A: Yes. Configure via `odavl.enabledDetectors` in settings.

**Q: Does it support monorepos?**  
A: Yes. Analyzes each package independently with proper path resolution.

**Q: Can I disable specific detectors?**  
A: Yes. Edit `odavl.enabledDetectors` to remove unwanted detectors.

**Q: How do I report bugs?**  
A: [GitHub Issues](https://github.com/odavl-studio/odavl/issues) or support@odavl.studio

---

## Upgrade to PRO

Unlock cloud features:

✅ **Cloud Analysis**
- 10 projects (vs 1 on FREE)
- 1,000 files/analysis (vs 100)
- 100 analyses/day (vs 5)

✅ **Project History**
- Compare analyses over time
- Track improvement trends
- Historical retention: 90 days

✅ **Enhanced Detectors**
- 11 detectors (vs 6 on FREE)
- Database, infrastructure, CI/CD

✅ **Team Collaboration** (TEAM plan)
- Share projects with team
- Assign issues
- Comment on findings

**Start 14-day free trial:**
```bash
# In terminal
odavl auth signup --trial

# Or in VS Code
Ctrl+Shift+P → "ODAVL: Start Trial"
```

[View full pricing →](./plans-and-pricing.md)

---

## Support & Resources

📖 **Documentation**: https://docs.odavl.studio  
💬 **Community Discord**: https://discord.gg/odavl  
📧 **Email Support**: support@odavl.studio  
🐛 **Bug Reports**: https://github.com/odavl-studio/odavl/issues  
📊 **Cloud Dashboard**: https://cloud.odavl.studio  
🔗 **GitHub**: https://github.com/odavl-studio/odavl

---

## Extension Details

**Name**: ODAVL Insight  
**ID**: `odavl.odavl-insight-vscode`  
**Version**: 1.0.0  
**Publisher**: ODAVL Studio  
**VS Code**: ^1.80.0  
**License**: MIT

**Categories**: Linters, Programming Languages, Testing  
**Keywords**: error-detection, code-quality, ai, ml, typescript, python, diagnostics

[View on VS Code Marketplace →](https://marketplace.visualstudio.com/items?itemName=odavl.odavl-insight-vscode)

---

*Made with ❤️ by the ODAVL Studio team*
