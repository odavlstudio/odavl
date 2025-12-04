# ODAVL Problems Panel Integration

## Overview

ODAVL now integrates with VS Code's native **Problems Panel**, displaying detected issues alongside TypeScript and ESLint errors for a unified developer experience.

## Features

### ✅ Real-Time Detection

- Automatically analyzes files on save
- Detects 6 types of issues:
  - 🔒 **Security**: XSS, SQL injection, hardcoded secrets
  - 🌐 **Network**: Missing timeouts, error handling, rate limiting
  - ⏱️ **Runtime**: Memory leaks, race conditions, resource cleanup
  - ⚡ **Performance**: Blocking operations, nested loops, large bundles
  - 🧠 **Complexity**: High cyclomatic complexity, deep nesting
  - 🔗 **Isolation**: Tight coupling, low cohesion

### ✅ Problems Panel Display

```
PROBLEMS (12)
├─ TypeScript (5)
├─ ESLint (3)
└─ ODAVL/security (2)
    ├─ test-diagnostics.ts:6 - Hardcoded secret detected
    └─ api-client.ts:42 - XSS vulnerability
   ODAVL/network (1)
    └─ fetch-utils.ts:15 - Missing timeout on fetch
   ODAVL/complexity (1)
    └─ utils.ts:108 - High cyclomatic complexity (18)
```

### ✅ Severity Mapping

- **Critical** → ❌ Error (red)
- **High** → ⚠️ Warning (yellow)
- **Medium** → ℹ️ Information (blue)
- **Low** → 💡 Hint (gray)

## Usage

### Automatic Analysis

Files are analyzed automatically when saved. Just edit and save your TypeScript/JavaScript files.

### Manual Commands

#### Analyze Entire Workspace

```
Ctrl+Shift+P → "ODAVL: Analyze Workspace"
```

Scans all TypeScript/JavaScript files in the workspace.

#### Clear Diagnostics

```
Ctrl+Shift+P → "ODAVL: Clear Diagnostics"
```

Removes all ODAVL diagnostics from the Problems Panel.

## Configuration

### Disable Auto-Analysis

Add to `.vscode/settings.json`:

```json
{
  "odavl.enableDiagnostics": false
}
```

### File Exclusions

ODAVL respects your workspace's file exclusions:

- `node_modules/` - Always excluded
- Files in `.gitignore` - Excluded by default
- Add custom patterns in `files.exclude`

## Supported File Types

- ✅ TypeScript (`.ts`, `.tsx`)
- ✅ JavaScript (`.js`, `.jsx`)
- ❌ JSON, Markdown, CSS (not yet supported)

## Example Output

### Security Issue

```
[ODAVL/security] Hardcoded API key detected: 'sk-12345'
  Severity: Critical
  Code: HARDCODED_SECRET
  File: api-client.ts:15
  Fix: Move to environment variables
```

### Network Issue

```
[ODAVL/network] fetch() call missing timeout
  Severity: High
  Code: MISSING_TIMEOUT
  File: utils.ts:42
  Fix: Add timeout: fetch(url, { signal: AbortSignal.timeout(5000) })
```

### Complexity Issue

```
[ODAVL/complexity] High cyclomatic complexity: 18 (limit: 15)
  Severity: Medium
  Code: HIGH_COMPLEXITY
  File: calculator.ts:108
  Fix: Extract nested conditions into separate functions
```

## Troubleshooting

### Diagnostics Not Appearing

1. Check if file is saved (analysis runs on save)
2. Verify file extension (`.ts`, `.tsx`, `.js`, `.jsx`)
3. Check Output Panel → "ODAVL" for errors
4. Try manual analysis: `ODAVL: Analyze Workspace`

### Too Many False Positives

1. Adjust thresholds in `.odavl/gates.yml`
2. Exclude specific files via `.gitignore`
3. Disable specific detectors (coming soon)

### Performance Issues

- Workspace analysis can be slow for large projects (1000+ files)
- Use auto-analysis (on save) instead for better performance
- Exclude test files if they generate too many warnings

## Integration with CI/CD

ODAVL diagnostics are also available in the CLI:

```bash
pnpm odavl:insight packages/my-package
```

This allows you to:

- Block PRs with critical issues
- Generate reports for security audits
- Track quality metrics over time

## Technical Details

### Architecture

```
File Save Event
    ↓
DiagnosticsService.analyzeFile()
    ↓
Run 6 Detectors in Parallel
    ↓
Convert Errors → vscode.Diagnostic
    ↓
DiagnosticCollection.set()
    ↓
Problems Panel Updates
```

### Detector Priority

1. **Security** - Always runs first (critical path)
2. **Network** - Quick static analysis
3. **Complexity** - AST parsing required
4. **Performance** - Pattern matching
5. **Runtime** - Control flow analysis
6. **Isolation** - Graph analysis (slowest)

### Caching

- Results are cached per file until next save
- Workspace analysis results expire after 5 minutes
- Manual "Clear Diagnostics" clears all caches

## Roadmap

### v1.3.0 (Current)

- ✅ Basic Problems Panel integration
- ✅ 6 detector types
- ✅ Workspace analysis command

### v1.4.0 (Planned)

- 🔄 Real-time analysis (on change, not just save)
- 🔄 Quick fixes (Code Actions)
- 🔄 Ignore/suppress specific issues
- 🔄 Custom detector configuration

### v1.5.0 (Future)

- 🔮 AI-powered fix suggestions
- 🔮 Auto-fix on save
- 🔮 Detailed issue explanations (hover)
- 🔮 Performance profiling integration

## Contributing

Found a false positive? Have a detector suggestion?

1. Open an issue: <https://github.com/odavl/odavl/issues>
2. Include the false positive code snippet
3. Suggest the expected behavior

## License

MIT License - see LICENSE file for details
