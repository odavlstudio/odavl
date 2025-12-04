# Test Extension

**Guardian Test Project** - VS Code Extension Detection

## Expected Behavior

```bash
🔍 Detecting project...
✅ Detected: VS Code Extension (Confidence: 95%+)

🛡️ Guardian v5.0
📦 test-extension (extension)

[1] 🧩 Test Extension
    Comprehensive extension testing
[2] 🎯 Custom Test
[3] 🗣️ Language Analysis
[0] 🚪 Exit
```

## Detection Signals

- `package.json` has `engines.vscode`
- `src/extension.ts` exists
- Type: `extension`

## Test Coverage

- ✅ Extension detection accuracy
- ✅ VS Code API recognition
- ✅ Extension tester routing
