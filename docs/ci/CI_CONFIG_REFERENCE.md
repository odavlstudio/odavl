# ODAVL Insight: CI Configuration Reference

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Audience**: Staff engineers, platform teams, DevOps engineers

---

## Why a Unified CI Configuration?

ODAVL Insight operates across GitHub Actions, GitLab CI, Jenkins, and generic POSIX runners. Before this config, CI behavior was controlled by workflow-specific YAML files, creating fragmentation:

- Different failure rules per platform
- Inconsistent severity mappings
- No single source of truth for CI philosophy
- Difficult to validate conformance with CI_PHILOSOPHY.md

`insight-ci.config.json` solves this by providing:

1. **Single source of truth**: One file defines behavior for all CI platforms
2. **Validation at setup time**: `odavl insight ci verify` catches misconfigurations before merge
3. **Explicit contracts**: No hidden defaults, all behavior documented
4. **Platform portability**: Same config works on GitHub, GitLab, Jenkins, POSIX runners

---

## Configuration Schema

### Root Structure

```json
{
  "$schema": "https://odavl.studio/schemas/insight-ci-config-v1.json",
  "version": "1",
  "modes": { ... },
  "severityPolicy": { ... },
  "antiPatterns": { ... }
}
```

### Field Reference

#### `version` (required)

**Type**: `"1"` (literal string)  
**Purpose**: Schema version for future compatibility  
**Current Value**: Must be `"1"`

#### `modes` (required)

Defines behavior for three CI execution modes: PR, main branch, and nightly.

##### `modes.pr` (required)

Pull request / merge request analysis mode.

```json
{
  "enabled": true,
  "failOn": {
    "critical": true,
    "high": false,
    "medium": false,
    "low": false
  },
  "maxNewIssues": null,
  "detectors": {
    "include": ["typescript", "security", "import", "circular"],
    "exclude": []
  },
  "allowOverrides": true
}
```

**Fields**:

- `enabled`: Enable PR mode analysis (default: `true`)
- `failOn`: Which severity levels cause pipeline failure
  - **critical**: Security vulnerabilities, secrets, circular deps (default: `true`)
  - **high**: Code quality issues, not security (default: `false`)
  - **medium**: Minor code smells (default: `false`)
  - **low**: Informational findings (default: `false`)
- `maxNewIssues`: Numeric limit on new issues (default: `null` = no limit)
- `detectors.include`: Whitelist of detector names (omit for all detectors)
- `detectors.exclude`: Blacklist of detector names
- `allowOverrides`: Allow environment variable overrides (default: `true`)

**Constraints**:
- If `enabled: false`, all `failOn.*` must be `false`
- At most one severity should cause failures (typically only `critical`)

##### `modes.main` (required)

Main branch baseline generation mode.

```json
{
  "enabled": true,
  "blockOnQuality": false,
  "detectors": {
    "include": ["typescript", "security", "import", "circular", "performance"],
    "exclude": []
  }
}
```

**Fields**:

- `enabled`: Enable main branch analysis (default: `true`)
- `blockOnQuality`: **MUST BE `false`** — Main branch never fails on quality issues
- `detectors`: Same structure as PR mode

**Critical Constraint**:

```
blockOnQuality MUST be false
```

Main branch represents merged, approved code. Failing main branch CI creates deployment ambiguity. Quality metrics are informational only. This constraint is **enforced by Zod schema**—invalid configs will be rejected.

##### `modes.nightly` (optional)

Scheduled trend analysis mode.

```json
{
  "enabled": true,
  "trackTrends": true,
  "alertsOn": {
    "critical": true,
    "high": false
  }
}
```

**Fields**:

- `enabled`: Enable nightly analysis (default: `false`)
- `trackTrends`: Compare against previous runs (default: `true`)
- `alertsOn.critical`: Send alerts for Critical issues (default: `true`)
- `alertsOn.high`: Send alerts for High issues (default: `false`)

#### `severityPolicy` (required)

Human-readable definitions of severity levels.

```json
{
  "critical": {
    "description": "Security vulnerabilities, hardcoded secrets, circular dependencies that break builds"
  },
  "high": {
    "description": "Code quality issues that degrade maintainability but do not block development"
  },
  "medium": {
    "description": "Minor code smells and style violations worth addressing eventually"
  },
  "low": {
    "description": "Informational findings with minimal impact"
  }
}
```

**Purpose**: Documents team-specific severity interpretations. Insight detectors map issues to these levels, but your team defines what each level means operationally.

#### `antiPatterns` (required)

Explicit guards against common CI anti-patterns.

```json
{
  "failOnLegacy": false,
  "failOnMediumOrLow": false,
  "autoUploadWithoutConsent": false
}
```

**Fields**:

- `failOnLegacy`: Fail on issues present in baseline (violates delta-first philosophy)
- `failOnMediumOrLow`: Fail on Medium or Low severity (creates alert fatigue)
- `autoUploadWithoutConsent`: Upload source code to cloud without explicit opt-in

**Constraints**:
- All three **MUST be `false`**
- Schema validation enforces these constraints
- If `failOnMediumOrLow: false`, PR mode cannot fail on Medium or Low

---

## Configuration Examples

### Minimal Config (Matches Defaults)

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
      },
      "allowOverrides": true
    },
    "main": {
      "enabled": true,
      "blockOnQuality": false
    },
    "nightly": {
      "enabled": false,
      "trackTrends": true,
      "alertsOn": {
        "critical": true,
        "high": false
      }
    }
  },
  "severityPolicy": {
    "critical": {
      "description": "Security vulnerabilities, hardcoded secrets, circular dependencies"
    },
    "high": {
      "description": "Code quality issues that degrade maintainability"
    },
    "medium": {
      "description": "Minor code smells worth addressing eventually"
    },
    "low": {
      "description": "Informational findings"
    }
  },
  "antiPatterns": {
    "failOnLegacy": false,
    "failOnMediumOrLow": false,
    "autoUploadWithoutConsent": false
  }
}
```

### Stricter PR Settings (Within Philosophy)

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
      },
      "maxNewIssues": 5,
      "detectors": {
        "include": ["typescript", "security", "circular"],
        "exclude": ["complexity"]
      },
      "allowOverrides": false
    },
    "main": {
      "enabled": true,
      "blockOnQuality": false,
      "detectors": {
        "include": ["typescript", "security", "import", "circular", "performance"]
      }
    },
    "nightly": {
      "enabled": true,
      "trackTrends": true,
      "alertsOn": {
        "critical": true,
        "high": true
      }
    }
  },
  "severityPolicy": {
    "critical": {
      "description": "Blocks deployment: secrets, SQL injection, circular deps"
    },
    "high": {
      "description": "Review required but non-blocking: maintainability, complexity"
    },
    "medium": {
      "description": "Informational: style, minor patterns"
    },
    "low": {
      "description": "Ignore: low-priority suggestions"
    }
  },
  "antiPatterns": {
    "failOnLegacy": false,
    "failOnMediumOrLow": false,
    "autoUploadWithoutConsent": false
  }
}
```

**Key Changes**:
- `maxNewIssues: 5` — Numeric gate (max 5 new Critical issues per PR)
- `allowOverrides: false` — Disable environment variable overrides
- Detector filtering — Only run fast, high-signal detectors in PR mode
- Nightly alerts on High severity — Proactive monitoring

---

## DO NOT Patterns

### DO NOT Fail Main on Quality

```json
// ❌ INVALID CONFIG - Schema will reject this
{
  "modes": {
    "main": {
      "blockOnQuality": true  // ❌ FORBIDDEN
    }
  }
}
```

**Why**: Main branch represents merged code. Failing main creates deployment deadlock. Quality issues discovered on main should be tracked as tasks, not blockers.

### DO NOT Fail on Medium or Low Severity

```json
// ⚠️ DISCOURAGED - Creates alert fatigue
{
  "modes": {
    "pr": {
      "failOn": {
        "critical": true,
        "high": false,
        "medium": true,  // ⚠️ High false positive rate
        "low": true      // ⚠️ Noise
      }
    }
  },
  "antiPatterns": {
    "failOnMediumOrLow": false  // ❌ Constraint violation
  }
}
```

**Why**: Insight is tuned for precision (5-15 actionable issues), not recall (500 issues). Failing on Medium/Low creates noise and erodes trust.

### DO NOT Treat Insight as Your Only Security Scanner

```json
// ⚠️ INSUFFICIENT - Insight is not a complete SAST tool
{
  "modes": {
    "pr": {
      "detectors": {
        "include": ["security"]  // ⚠️ Missing context-specific detectors
      }
    }
  }
}
```

**Why**: Insight detects common security patterns (hardcoded secrets, basic injection flaws) but is **not** a replacement for:
- Snyk (dependency vulnerabilities)
- Semgrep (deep semantic security rules)
- CodeQL (dataflow analysis)

Use Insight **alongside** dedicated security tools, not instead of them.

### DO NOT Enable Auto-Upload Without Consent

```json
// ❌ INVALID CONFIG - Schema will reject this
{
  "antiPatterns": {
    "autoUploadWithoutConsent": true  // ❌ FORBIDDEN
  }
}
```

**Why**: ODAVL Insight is privacy-by-construction. Source code never leaves your infrastructure unless you explicitly opt in via `--cloud` flag or `ODAVL_API_TOKEN` environment variable.

---

## Validation Commands

### `odavl insight ci verify`

Validates `insight-ci.config.json` against schema and CI_PHILOSOPHY.md constraints.

**Exit Codes**:
- `0` — Config valid or absent (defaults will be used)
- `1` — Invalid JSON or schema violation
- `3` — Internal error

**Example Output**:

```bash
$ odavl insight ci verify

Workspace: /home/user/my-project

✓ Configuration valid: insight-ci.config.json

Mode Configuration:
  PR: Enabled
    Fail on:
      Critical: true
      High: false
      Medium: false
      Low: false
  Main: Enabled
    Block on quality: false ✓
  Nightly: Enabled

Anti-Pattern Guards:
  Fail on legacy: false ✓
  Fail on Medium/Low: false ✓
  Auto-upload without consent: false ✓

✓ Configuration respects CI_PHILOSOPHY.md constraints
```

### `odavl insight ci doctor`

Diagnoses CI environment and config consistency.

**Exit Codes**:
- `0` — Environment and config are consistent
- `1` — Config file invalid
- `2` — Environment/config drift detected
- `3` — Internal error

**Example Output**:

```bash
$ odavl insight ci doctor

=== ODAVL Insight CI Doctor ===

Workspace: /home/user/my-project
Config source: insight-ci.config.json

CI Environment:
  Platform: github
  Mode: pr
  Branch: feature/add-auth
  Pull request: true
  Scheduled: false

Active Configuration:
  Mode: PR (delta analysis)
  Fail on:
    Critical: true
    High: false
    Medium: false
    Low: false

✓ Configuration is consistent with Insight CI philosophy
```

---

## Integration with CI Platforms

All CI platforms (GitHub Actions, GitLab CI, Jenkins, POSIX runners) respect `insight-ci.config.json` if present. If absent, built-in defaults apply.

**Workflow Pattern**:

```yaml
# GitHub Actions example
- name: Verify CI config
  run: npx @odavl-studio/cli insight ci verify

- name: Run analysis
  run: npx @odavl-studio/cli insight analyze
```

See platform-specific documentation:
- GitHub Actions: `docs/ci/github-actions/INSIGHT_GITHUB_ACTIONS.md`
- GitLab CI: `docs/ci/platforms/GITLAB_CI.md`
- Jenkins: `docs/ci/platforms/JENKINS.md`
- POSIX runner: `docs/ci/platforms/POSIX_RUNNER.md`

---

## Backward Compatibility Guarantee

**If no config file is present**, Insight CLI uses built-in defaults matching current documented behavior:

- PR: Fail only on Critical issues
- Main: Never blocks on quality
- Nightly: Disabled by default

**No breaking changes**. Existing workflows continue to function without modification.

---

## Schema Evolution

Future versions will use `"version": "2"`, `"version": "3"`, etc. The loader will support multiple versions with automatic migration.

Current version: `"1"`
