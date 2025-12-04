# Test Monorepo

**Guardian Test Project** - Monorepo Detection

## Expected Behavior

```bash
🔍 Detecting project...
✅ Detected: pnpm Monorepo (Confidence: 95%+)

🛡️ Guardian v5.0
Test Monorepo Suite - 2 products

📦 TEST MONOREPO PRODUCTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [1] 🌐 Web
      Test website
  [2] 📦 Utils
      Test package

🏢 SUITE ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [3] 🏢 Test All Products
      Full suite validation

⚙️ UTILITIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [4] 🗣️ Language Analysis
  [5] 🌐 Open Dashboard

[0] 🚪 Exit
```

## Detection Signals

- `pnpm-workspace.yaml` exists
- `package.json` has workspaces
- Multiple sub-packages detected
- Type: `monorepo`

## Test Coverage

- ✅ Monorepo detection accuracy
- ✅ Multi-product menu rendering
- ✅ Product type detection (website + package)
- ✅ Suite menu organization
