# Test Website

**Guardian Test Project** - Next.js Website Detection

## Expected Behavior

When Guardian runs in this directory:

```bash
🔍 Detecting project...
✅ Detected: Next.js Website (Confidence: 90%+)

🛡️ Guardian v5.0
📦 test-website (website)

[1] 🌐 Test Website
    Comprehensive website testing
[2] 🎯 Custom Test
[3] 🗣️ Language Analysis
[0] 🚪 Exit
```

## Detection Signals

- `next.config.js` exists
- `package.json` has `next` dependency
- Type: `website`
- Framework: `next.js`

## Test Coverage

This project tests:
- ✅ Website detection accuracy
- ✅ Next.js framework identification
- ✅ Single package menu rendering
- ✅ Website tester routing
