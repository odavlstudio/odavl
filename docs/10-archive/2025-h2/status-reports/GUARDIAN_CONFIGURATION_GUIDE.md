# 🔧 Guardian Configuration Guide

## Overview

Guardian v4.2.0 introduces a powerful **Dynamic Configuration System** that allows you to customize every aspect of impact analysis without modifying code.

## Quick Start

### 1. Create Configuration File

Copy the example config to your workspace root:

```bash
cp guardian.config.example.json guardian.config.json
```

### 2. Customize Settings

Edit `guardian.config.json`:

```json
{
  "version": "1.0.0",
  "products": {
    "criticalityScores": {
      "my-core-product": 95,
      "my-cli-tool": 80
    },
    "autoDiscover": {
      "enabled": true,
      "defaultCriticality": 50
    }
  }
}
```

### 3. Use in Code

```typescript
import { ImpactAnalyzer } from '@odavl-studio/guardian-cli';

// Initialize with config
const analyzer = new ImpactAnalyzer(process.cwd());
await analyzer.initialize(); // Loads guardian.config.json

// Analyze impact
const analysis = await analyzer.analyzeDeepImpact('my-core-product');
```

---

## Configuration Schema

### `version` (string)

Configuration schema version for migration.

```json
{
  "version": "1.0.0"
}
```

---

### `products` (object)

Product graph customization.

#### `products.criticalityScores` (Record<string, number>)

Override criticality scores (0-100) for specific products.

```json
{
  "products": {
    "criticalityScores": {
      "insight-core": 95,
      "autopilot-engine": 90,
      "guardian-cli": 80
    }
  }
}
```

**Default Scores**:
- Core products: 95
- Engine products: 90
- CLI tools: 80
- Dashboards: 70
- Extensions: 65
- Unknown: 50

#### `products.custom` (CustomProduct[])

Add custom products not in the default graph.

```json
{
  "products": {
    "custom": [
      {
        "id": "my-custom-product",
        "name": "My Custom Product",
        "directory": "custom/my-product",
        "dependencies": ["insight-core"],
        "criticalityScore": 70,
        "description": "Custom product example"
      }
    ]
  }
}
```

**Fields**:
- `id` (required): Unique product identifier
- `name` (required): Display name
- `directory` (required): Path relative to workspace root
- `dependencies` (optional): Array of product IDs this depends on
- `consumers` (optional): Array of product IDs that depend on this
- `criticalityScore` (optional): 0-100 score (default: 50)
- `description` (optional): Short description

#### `products.autoDiscover` (object)

Auto-discover products from pnpm-workspace.yaml.

```json
{
  "products": {
    "autoDiscover": {
      "enabled": true,
      "workspaceFile": "pnpm-workspace.yaml",
      "defaultCriticality": 50
    }
  }
}
```

**How it works**:
1. Reads `pnpm-workspace.yaml` patterns
2. Finds all `package.json` files
3. Extracts `@odavl-studio/*` dependencies
4. Assigns criticality based on naming conventions:
   - `*-core`: 95
   - `*-engine`: 90
   - `*-cli`: 80
   - `*-app` or `*-dashboard`: 70
   - `*-extension`: 65
   - Other: `defaultCriticality`

---

### `performance` (object)

Performance tuning settings.

#### `performance.impactCache` (object)

Impact analysis result caching (LRU cache with TTL).

```json
{
  "performance": {
    "impactCache": {
      "maxSize": 100,
      "ttlMinutes": 15
    }
  }
}
```

**Fields**:
- `maxSize` (default: 100): Maximum cache entries
- `ttlMinutes` (default: 15): Time-to-live in minutes

**When to adjust**:
- **Increase `maxSize`** if you analyze many different products frequently
- **Decrease `ttlMinutes`** if product dependencies change rapidly
- **Increase `ttlMinutes`** for stable monorepos

#### `performance.similarityCache` (object)

String similarity calculation caching.

```json
{
  "performance": {
    "similarityCache": {
      "maxSize": 1000
    }
  }
}
```

**Fields**:
- `maxSize` (default: 1000): Maximum cached distance calculations

**When to adjust**:
- **Increase** if you correlate large numbers of unique error messages
- **Decrease** to save memory

#### `performance.correlation` (object)

Error correlation limits.

```json
{
  "performance": {
    "correlation": {
      "timeout": 30000,
      "maxErrors": 1000
    }
  }
}
```

**Fields**:
- `timeout` (default: 30000): Max correlation time in milliseconds
- `maxErrors` (default: 1000): Max errors to correlate at once

---

### `thresholds` (object)

Severity and confidence thresholds.

#### `thresholds.severity` (object)

Define what constitutes low/medium/high/critical severity.

```json
{
  "thresholds": {
    "severity": {
      "low": 25,
      "medium": 50,
      "high": 75,
      "critical": 90
    }
  }
}
```

**Severity Calculation**:
```
severity = (criticalityScore × impactWeight × cascadeDepth) / 10
```

**Examples**:
- `severity < 25`: Low (informational)
- `25 ≤ severity < 50`: Medium (monitor)
- `50 ≤ severity < 75`: High (action required)
- `75 ≤ severity < 90`: Very High (urgent)
- `severity ≥ 90`: Critical (immediate action)

#### `thresholds.confidence` (object)

Define confidence level thresholds.

```json
{
  "thresholds": {
    "confidence": {
      "minimum": 30,
      "warning": 50
    }
  }
}
```

**Confidence Levels**:
- `< 30`: Too low, unreliable
- `30-49`: Warning, verify manually
- `50-69`: Moderate confidence
- `70-89`: High confidence
- `≥ 90`: Excellent confidence

---

### `plugins` (object)

Plugin system (future extensibility).

```json
{
  "plugins": {
    "detectors": ["./plugins/my-detector.js"],
    "analyzers": ["./plugins/my-analyzer.js"],
    "hooks": {
      "beforeAnalysis": "./plugins/pre-hook.js",
      "afterAnalysis": "./plugins/post-hook.js",
      "onError": "./plugins/error-handler.js"
    }
  }
}
```

**Status**: Structure defined, implementation in Phase 4.

---

### `dashboard` (object)

Dashboard server settings.

```json
{
  "dashboard": {
    "port": 3333,
    "autoOpen": true,
    "theme": "auto"
  }
}
```

**Fields**:
- `port` (default: 3333): Local server port
- `autoOpen` (default: true): Auto-open browser
- `theme` (default: "auto"): "light", "dark", or "auto"

---

## Constants Reference

All magic numbers have been replaced with named constants.

### Cache Settings

```typescript
DEFAULT_CACHE_SIZE = 100
DEFAULT_CACHE_TTL_MINUTES = 15
DEFAULT_SIMILARITY_CACHE_SIZE = 1000
```

### Performance Limits

```typescript
MAX_CASCADE_DEPTH = 5
MAX_ERRORS_TO_CORRELATE = 1000
CORRELATION_TIMEOUT_MS = 30000
```

### Severity Thresholds

```typescript
SEVERITY_LOW = 25
SEVERITY_MEDIUM = 50
SEVERITY_HIGH = 75
SEVERITY_CRITICAL = 90
```

### Confidence Thresholds

```typescript
CONFIDENCE_MINIMUM = 30
CONFIDENCE_WARNING = 50
CONFIDENCE_HIGH = 70
CONFIDENCE_EXCELLENT = 90
```

### Default Criticality Scores

```typescript
DEFAULT_CRITICALITY = 50
CORE_PRODUCT_CRITICALITY = 95
ENGINE_PRODUCT_CRITICALITY = 90
CLI_PRODUCT_CRITICALITY = 80
DASHBOARD_PRODUCT_CRITICALITY = 70
EXTENSION_PRODUCT_CRITICALITY = 65
```

### Impact Weights

```typescript
DIRECT_DEPENDENCY_WEIGHT = 1.0
API_CONSUMER_WEIGHT = 0.9
DATA_CONSUMER_WEIGHT = 0.7
WORKFLOW_TRIGGER_WEIGHT = 0.6
SHARED_TYPES_WEIGHT = 0.5
INDIRECT_WEIGHT = 0.3
```

---

## Use Cases

### 1. Monorepo with Custom Structure

```json
{
  "products": {
    "autoDiscover": {
      "enabled": true,
      "workspaceFile": "pnpm-workspace.yaml",
      "defaultCriticality": 60
    },
    "criticalityScores": {
      "api-gateway": 95,
      "auth-service": 90,
      "user-service": 80
    }
  }
}
```

### 2. High-Performance Environment

```json
{
  "performance": {
    "impactCache": {
      "maxSize": 500,
      "ttlMinutes": 30
    },
    "similarityCache": {
      "maxSize": 5000
    }
  }
}
```

### 3. Strict Severity Standards

```json
{
  "thresholds": {
    "severity": {
      "low": 10,
      "medium": 30,
      "high": 60,
      "critical": 85
    }
  }
}
```

### 4. Development Environment

```json
{
  "performance": {
    "impactCache": {
      "maxSize": 50,
      "ttlMinutes": 5
    }
  },
  "dashboard": {
    "port": 3000,
    "autoOpen": true,
    "theme": "dark"
  }
}
```

---

## Migration Guide

### From v4.1.0 (Hardcoded) to v4.2.0 (Configurable)

**Before** (hardcoded):
```typescript
const analyzer = new ImpactAnalyzer();
// Used hardcoded cache size: 100, TTL: 15 minutes
```

**After** (configurable):
```typescript
// 1. Create guardian.config.json
{
  "performance": {
    "impactCache": {
      "maxSize": 200,
      "ttlMinutes": 30
    }
  }
}

// 2. Initialize with config
const analyzer = new ImpactAnalyzer(process.cwd());
await analyzer.initialize();
// Now uses your config values!
```

---

## FAQ

### Q: Where should I place guardian.config.json?

**A**: In your workspace root (same directory as `pnpm-workspace.yaml` or `package.json`).

### Q: What happens if I don't create a config file?

**A**: Guardian uses default values from `DEFAULT_CONFIG`. Everything works without configuration.

### Q: Can I override only some settings?

**A**: Yes! Config is merged with defaults. You only need to specify what you want to change.

### Q: How do I reset to defaults?

**A**: Delete or rename `guardian.config.json`.

### Q: Can I use multiple configs for different environments?

**A**: Create `guardian.config.dev.json`, `guardian.config.prod.json`, then symlink:

```bash
ln -s guardian.config.dev.json guardian.config.json
```

---

## Best Practices

1. **Start with defaults**: Only customize when needed
2. **Version your config**: Commit `guardian.config.json` to git
3. **Document overrides**: Add comments explaining why you changed defaults
4. **Monitor performance**: Use `getCacheStats()` to validate cache settings
5. **Test criticality scores**: Verify impact analysis matches your expectations

---

## Next Steps

- **Phase 4**: Plugin system implementation (custom detectors, analyzers)
- **Future**: Hot-reload config on changes
- **Future**: Config validation with JSON Schema
- **Future**: Environment-specific configs (`.env` integration)

---

**Configuration System v1.0.0 - Guardian v4.2.0**
