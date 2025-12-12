# @odavl/oplayer

**ODAVL Protocol Layer (OPL)** - The architectural boundary enforcement layer for ODAVL Studio v2.0.

## 🎯 Purpose

The OPLayer is the **single source of truth** for shared utilities, protocols, and types across all ODAVL products (Insight, Autopilot, Guardian). It enforces **strict product separation** by providing neutral protocols that prevent direct coupling between products.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   @odavl/oplayer                    │
│  (Protocol Layer - Neutral Ground for All Products) │
└─────────────────────────────────────────────────────┘
           ▲              ▲              ▲
           │              │              │
    ┌──────┴──────┐ ┌────┴─────┐ ┌─────┴──────┐
    │   Insight   │ │ Autopilot│ │  Guardian  │
    │  (Detect)   │ │   (Fix)  │ │   (Test)   │
    └─────────────┘ └──────────┘ └────────────┘
         ❌ No direct imports between products
         ✅ All share through @odavl/oplayer
```

## 📦 What's Included

### **1. Protocols** (`@odavl/oplayer/protocols`)
Neutral protocols for inter-product communication:
- `AnalysisProtocol` - For Insight → Autopilot handoff
- `TestResultProtocol` - For Guardian → Products handoff
- `RecipeProtocol` - For Autopilot recipe execution
- `BridgeProtocol` - For cross-product events

### **2. Types** (`@odavl/oplayer/types`)
Shared TypeScript types:
- Billing types (SubscriptionTier, UsageType, ProductTier)
- Error types (ODAVLError, ErrorSeverity)
- Metrics types (CodeMetrics, QualityScore)
- Multi-tenant types (Workspace, Organization)

### **3. Utilities** (`@odavl/oplayer/utilities`)
Product-agnostic utilities:
- Logger (structured logging)
- Cache (LRU cache with TTL)
- Crypto (hashing, encryption)
- Progress tracking
- File system helpers

### **4. Client** (`@odavl/oplayer/client`)
HTTP client for cloud integration:
- REST API client
- WebSocket client
- Authentication headers
- Rate limiting

### **5. GitHub Integration** (`@odavl/oplayer/github`)
GitHub API utilities:
- OAuth flows
- Repository operations
- PR/Issue management
- Webhook handling

## 🚀 Usage

```typescript
// ✅ CORRECT - Import from OPLayer
import { Logger } from '@odavl/oplayer/utilities';
import { AnalysisProtocol } from '@odavl/oplayer/protocols';
import { SubscriptionTier } from '@odavl/oplayer/types';

// ❌ WRONG - Never import directly from other products
import { something } from '@odavl-studio/insight-core';  // ❌ Forbidden
import { something } from '@odavl-studio/autopilot-engine';  // ❌ Forbidden
```

## 🔒 Boundary Enforcement

ESLint rules prevent cross-product imports:

```javascript
// .eslintrc.js
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["@odavl-studio/insight-*"],
          "message": "❌ Products cannot import from Insight. Use @odavl/oplayer instead."
        },
        {
          "group": ["@odavl-studio/autopilot-*"],
          "message": "❌ Products cannot import from Autopilot. Use @odavl/oplayer instead."
        },
        {
          "group": ["@odavl-studio/guardian-*"],
          "message": "❌ Products cannot import from Guardian. Use @odavl/oplayer instead."
        }
      ]
    }]
  }
}
```

## 📖 Migration Guide

### Before (Coupled):
```typescript
// Autopilot importing directly from Insight ❌
import { TypeScriptDetector } from '@odavl-studio/insight-core/detector';
```

### After (Decoupled):
```typescript
// Autopilot using OPLayer protocol ✅
import { AnalysisProtocol } from '@odavl/oplayer/protocols';

const result = await AnalysisProtocol.requestAnalysis({
  workspace: '/path/to/code',
  detectors: ['typescript', 'eslint']
});
```

## 🧪 Testing

```bash
pnpm test          # Run tests
pnpm build         # Build package
pnpm dev           # Watch mode
pnpm typecheck     # TypeScript validation
```

## 📝 License

MIT - See LICENSE file for details.
