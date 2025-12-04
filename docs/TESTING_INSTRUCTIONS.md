# 🧪 Testing Instructions - Problems Panel CLI Integration

## Quick Test (5 minutes)

### Step 1: Build Everything

```powershell
# Build VS Code Extension
cd apps/vscode-ext
pnpm build

# Build CLI
cd ../cli
pnpm build

# Return to root
cd ../..
```

### Step 2: Run VS Code Extension

```powershell
# Open vscode-ext folder in VS Code
code apps/vscode-ext

# Press F5 to launch Extension Development Host
# New VS Code window will open
```

### Step 3: Open Workspace

In the **Extension Development Host** window:

1. File → Open Folder
2. Select: `C:\Users\sabou\dev\odavl`
3. Wait for workspace to load

### Step 4: Trigger Diagnostics

In the Extension Development Host:

1. Open: `test-problemspanel.ts` (in root folder)
2. Press `Ctrl+S` to save
3. Check **Problems Panel** (bottom panel) - should see ~15 ODAVL issues
4. Check file created: `.odavl/problems-panel-export.json`

### Step 5: Run CLI

In a **regular terminal** (not in Extension Development Host):

```powershell
# From workspace root
cd c:\Users\sabou\dev\odavl

# Run insight
pnpm odavl:insight

# When prompted, enter: 7
# (for "problemspanel" option)
```

### Step 6: Verify Output

You should see:

```
📖 Reading from VS Code Problems Panel export...

📅 Export timestamp: 11/8/2025, 10:30:45 AM
📂 Workspace: C:\Users\sabou\dev\odavl
📊 Total files with issues: 1
⚠️  Total issues: 15

═══════════════════════════════════════════════════════════
🔍 Issues by Detector:

🔒 SECURITY (2 issues)
🌐 NETWORK (1 issue)
💥 RUNTIME (1 issue)
⚡ PERFORMANCE (1 issue)
🧠 COMPLEXITY (1 issue)
🧩 ISOLATION (1 issue)

... (detailed output)
```

## Expected Results

### ✅ Success Criteria

1. **Export file exists**: `.odavl/problems-panel-export.json`
2. **CLI reads export**: No "file not found" error
3. **Issues displayed**: Same issues as Problems Panel
4. **Fast execution**: ~1 second (not 10-30 seconds)
5. **Rich formatting**: Emojis, colors, statistics

### ❌ Failure Scenarios

| Error | Cause | Solution |
|-------|-------|----------|
| "No Problems Panel export found" | Extension didn't export | Save file in VS Code (Ctrl+S) |
| "Cannot find module" | Build failed | Run `pnpm build` in both apps |
| Empty output | Export file empty | Check if extension detected issues |
| Crash/exception | JSON parse error | Delete export file, save again |

## Advanced Testing

### Test 2: Multiple Files

1. Open `apps/cli/src/index.ts`
2. Save (Ctrl+S)
3. Open `apps/vscode-ext/src/extension.ts`
4. Save (Ctrl+S)
5. Run CLI → 7
6. Verify `totalFiles > 1`

### Test 3: Error Handling

```powershell
# Delete export file
Remove-Item .odavl/problems-panel-export.json

# Run CLI
pnpm odavl:insight
# Choose: 7

# Should see helpful error message:
# "No Problems Panel export found!"
# "To use this feature:"
# "  1. Open your project in VS Code"
# "  2. Save any TypeScript/JavaScript file (Ctrl+S)"
# etc.
```

### Test 4: Export File Content

```powershell
# View export file
cat .odavl/problems-panel-export.json | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Should contain:
# - timestamp
# - workspaceRoot
# - totalFiles
# - totalIssues
# - diagnostics (object with file paths as keys)
```

## Debugging

### Enable Extension Logging

In Extension Development Host:

1. Open Output panel (View → Output)
2. Select "ODAVL Studio" from dropdown
3. Look for: `[DiagnosticsService] Exported N diagnostic(s)`

### Check Export File

```powershell
# View raw JSON
cat .odavl/problems-panel-export.json

# Pretty print
cat .odavl/problems-panel-export.json | jq .

# Count issues
$export = cat .odavl/problems-panel-export.json | ConvertFrom-Json
$export.totalIssues
```

### CLI Debug Mode

```powershell
# Run CLI with node inspector
node --inspect-brk apps/cli/dist/index.js insight

# Then choose: 7
# Attach debugger in VS Code
```

## Performance Benchmarks

### Expected Timings

| Operation | Time |
|-----------|------|
| File save → Export | ~50-200ms |
| CLI read export | ~500ms-1s |
| CLI full detectors | ~10-30s |

**Speed improvement**: **10-30x faster** ⚡

### Measure Performance

```powershell
# Time CLI execution
Measure-Command { pnpm odavl:insight }
# Choose: 7 when prompted

# Should complete in 1-2 seconds total
```

## Success Checklist

- [ ] Extension builds without errors
- [ ] CLI builds without errors
- [ ] Extension runs in Development Host
- [ ] Problems Panel shows ODAVL issues
- [ ] Export file created in `.odavl/`
- [ ] CLI option 7 appears in menu
- [ ] CLI reads export successfully
- [ ] Output matches Problems Panel
- [ ] Execution time < 2 seconds
- [ ] No crashes or exceptions

## Next Steps

After successful testing:

1. ✅ Mark all TODOs as complete
2. 📝 Update version numbers
3. 🚀 Create release tag
4. 📢 Announce feature to team
5. 📚 Update user documentation

---

**Test Duration**: ~5 minutes  
**Status**: Ready for testing  
**Date**: November 8, 2025
