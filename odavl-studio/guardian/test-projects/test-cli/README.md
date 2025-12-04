# Test CLI

**Guardian Test Project** - CLI Tool Detection

## Expected Behavior

```bash
🔍 Detecting project...
✅ Detected: CLI Tool (Confidence: 90%+)

🛡️ Guardian v5.0
📦 test-cli (cli)

[1] ⚙️ Test CLI Tool
    Comprehensive cli testing
[2] 🎯 Custom Test
[3] 🗣️ Language Analysis
[0] 🚪 Exit
```

## Detection Signals

- `package.json` has `bin` field
- Shebang in main file: `#!/usr/bin/env node`
- Commander dependency
- Type: `cli`

## Test Coverage

- ✅ CLI detection accuracy
- ✅ Binary entry point recognition
- ✅ CLI tester routing
