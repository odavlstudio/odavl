# ODAVL Insight: CI Configuration System

**Version**: 1.0.0  
**Introduced**: December 2025

---

## Overview

The CI configuration system provides a single source of truth for ODAVL Insight behavior across all CI platforms (GitHub Actions, GitLab CI, Jenkins, POSIX runners).

**Key Benefits**:
- **Unified behavior**: Same config works on GitHub, GitLab, Jenkins
- **Validation at setup time**: Catch misconfigurations before merge
- **Explicit contracts**: No hidden defaults, all behavior documented
- **Backward compatible**: No config = existing behavior (no breaking changes)

---

## Components

### 1. Configuration Package

**Location**: `packages/insight-ci-config/`

**Exports**:
- `InsightCiConfigSchema` - Zod schema for validation
- `InsightCiConfig` - TypeScript type for config objects
- `loadCiConfig()` - Load and validate config file
- `loadCiConfigOrDefault()` - Load config or return defaults
- `validateCiConfig()` - Validate without throwing
- `CiConfigError` - Typed error for config issues
- `DEFAULT_CI_CONFIG` - Built-in defaults matching current behavior

**Installation**:
```bash
pnpm add @odavl-studio/insight-ci-config
```

### 2. Configuration File

**Location**: `insight-ci.config.json` (repository root)

**Example**:
```json
{
  "version": "1",
  "modes": {
    "pr": {
      "enabled": true,
      "failOn": {
        "critical": true,
        "high": false,
        "medium": false,
        "low": false
      }
    },
    "main": {
      "enabled": true,
      "blockOnQuality": false
    },
    "nightly": {
      "enabled": false
    }
  },
  "severityPolicy": {
    "critical": { "description": "Security, secrets, circular deps" },
    "high": { "description": "Maintainability issues" },
    "medium": { "description": "Minor code smells" },
    "low": { "description": "Informational" }
  },
  "antiPatterns": {
    "failOnLegacy": false,
    "failOnMediumOrLow": false,
    "autoUploadWithoutConsent": false
  }
}
```

**Reference**: `insight-ci.config.example.json` at repo root

### 3. CLI Commands

**`odavl insight ci verify`**  
Validates config schema and CI_PHILOSOPHY.md compliance.

**Exit Codes**:
- `0` = Valid or absent (defaults used)
- `1` = Invalid JSON or schema violation
- `3` = Internal error

**`odavl insight ci doctor`**  
Diagnoses CI environment and detects config drift.

**Exit Codes**:
- `0` = Environment and config consistent
- `1` = Invalid config
- `2` = Environment/config drift
- `3` = Internal error

**Flags**: `--json` for machine-readable output

---

## Usage

### Validation in CI

**GitHub Actions**:
```yaml
- name: Verify CI config
  run: npx @odavl-studio/cli insight ci verify
  if: hashFiles('insight-ci.config.json') != ''
```

**GitLab CI**:
```yaml
validate-config:
  stage: .pre
  script:
    - npx @odavl-studio/cli insight ci verify
```

**Jenkins**:
```groovy
stage('Validate CI Config') {
    when {
        expression { fileExists('insight-ci.config.json') }
    }
    steps {
        sh 'npx @odavl-studio/cli insight ci verify'
    }
}
```

### Diagnosis on Failure

**Optional debugging step**:
```yaml
- name: Diagnose CI Environment
  if: failure()
  run: npx @odavl-studio/cli insight ci doctor
```

---

## Documentation

**Core Documentation**:
- `docs/ci/CI_CONFIG_REFERENCE.md` - Complete schema reference
- `docs/ci/CI_DOCTOR.md` - Diagnostic commands guide
- `docs/ci/CI_PHILOSOPHY.md` - CI integration principles

**Platform-Specific Guides**:
- `docs/ci/github-actions/INSIGHT_GITHUB_ACTIONS.md` - GitHub Actions integration
- `docs/ci/platforms/GITLAB_CI.md` - GitLab CI integration
- `docs/ci/platforms/JENKINS.md` - Jenkins declarative pipeline
- `docs/ci/platforms/POSIX_RUNNER.md` - Platform-agnostic shell script

---

## Schema Constraints

**Critical Constraints** (enforced by Zod):

1. **Main branch must never block on quality**:
   ```json
   "modes": {
     "main": {
       "blockOnQuality": false  // MUST be false
     }
   }
   ```

2. **Anti-patterns must be disabled**:
   ```json
   "antiPatterns": {
     "failOnLegacy": false,            // MUST be false
     "failOnMediumOrLow": false,       // MUST be false
     "autoUploadWithoutConsent": false // MUST be false
   }
   ```

3. **Fail-on rules must be consistent**:
   - If `pr.enabled: false`, all `failOn.*` must be `false`
   - If `antiPatterns.failOnMediumOrLow: false`, cannot fail on Medium/Low

**Validation Errors**: Schema violations result in clear error messages with exact field paths and constraint explanations.

---

## Backward Compatibility

**No config file = No breaking changes**

Workflows without `insight-ci.config.json` continue using built-in defaults:
- PR mode: Fail only on Critical issues
- Main branch: Never blocks on quality
- Nightly: Disabled by default

**Migration**: Optional. Config file provides explicit control but is not required.

---

## Examples

### Minimal Config (Matches Defaults)

```json
{
  "version": "1",
  "modes": {
    "pr": {
      "enabled": true,
      "failOn": { "critical": true, "high": false, "medium": false, "low": false }
    },
    "main": {
      "enabled": true,
      "blockOnQuality": false
    },
    "nightly": {
      "enabled": false
    }
  },
  "severityPolicy": {
    "critical": { "description": "Security, secrets, circular deps" },
    "high": { "description": "Maintainability" },
    "medium": { "description": "Code smells" },
    "low": { "description": "Informational" }
  },
  "antiPatterns": {
    "failOnLegacy": false,
    "failOnMediumOrLow": false,
    "autoUploadWithoutConsent": false
  }
}
```

### Stricter PR Config (Within Philosophy)

```json
{
  "version": "1",
  "modes": {
    "pr": {
      "enabled": true,
      "failOn": { "critical": true, "high": false, "medium": false, "low": false },
      "maxNewIssues": 5,
      "detectors": {
        "include": ["typescript", "security", "circular"],
        "exclude": ["complexity"]
      },
      "allowOverrides": false
    },
    "main": {
      "enabled": true,
      "blockOnQuality": false
    },
    "nightly": {
      "enabled": true,
      "trackTrends": true,
      "alertsOn": { "critical": true, "high": true }
    }
  },
  "severityPolicy": {
    "critical": { "description": "Blocks deployment: secrets, injection, circular deps" },
    "high": { "description": "Review required: maintainability, complexity" },
    "medium": { "description": "Informational: style, patterns" },
    "low": { "description": "Ignore: low-priority suggestions" }
  },
  "antiPatterns": {
    "failOnLegacy": false,
    "failOnMediumOrLow": false,
    "autoUploadWithoutConsent": false
  }
}
```

---

## Implementation Details

### Package Structure

```
packages/insight-ci-config/
├── src/
│   ├── schema.ts      # Zod schema + DEFAULT_CI_CONFIG
│   ├── loader.ts      # Config loading + validation
│   └── index.ts       # Public exports
├── package.json
└── tsconfig.json
```

### CLI Integration

**Commands Location**: `apps/studio-cli/src/commands/insight-ci.ts`

**Registration**: `apps/studio-cli/src/index.ts`

**Help Text**:
```bash
$ odavl insight ci --help

Usage: odavl insight ci [command]

CI configuration management and diagnostics

Commands:
  verify  Verify insight-ci.config.json schema and CI_PHILOSOPHY.md compliance
  doctor  Diagnose CI environment and configuration consistency
```

---

## Quality Bar

**Code Requirements**:
- ✓ TypeScript strict mode
- ✓ Zod schema validation
- ✓ Typed errors with context
- ✓ Zero TODOs or placeholders
- ✓ Production-ready examples

**Documentation Requirements**:
- ✓ Field-by-field schema reference
- ✓ Real-world examples (no fiction)
- ✓ Anti-pattern warnings
- ✓ Platform-specific integration guides
- ✓ Troubleshooting scenarios

**Testing Requirements**:
- ✓ Config absent = defaults used
- ✓ Invalid JSON = clear error
- ✓ Schema violation = constraint explanation
- ✓ Valid config = successful validation
- ✓ Environment detection = correct mode

---

## Future Enhancements

**Version 2** (potential features):
- Per-detector severity overrides
- Conditional gates (e.g., fail on High in `src/security/**` only)
- Team-specific exemptions (e.g., allow complexity in `src/legacy/`)
- Time-limited overrides with expiry dates

**Migration Path**: `"version": "2"` with automatic migration from v1.

---

## Support

**Issues**: Report configuration bugs or schema violations to platform team

**Questions**: See `docs/ci/CI_CONFIG_REFERENCE.md` for schema details

**Examples**: `insight-ci.config.example.json` for production-ready config
