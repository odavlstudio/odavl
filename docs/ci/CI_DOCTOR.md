# ODAVL Insight: CI Doctor Guide

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Audience**: Platform engineers, ops engineers, DevOps teams

---

## Overview

`odavl insight ci verify` and `odavl insight ci doctor` are diagnostic commands for validating CI configuration and debugging pipeline behavior.

**Use cases**:
- **Setup time**: Validate config before merging infrastructure changes
- **Pipeline debugging**: Diagnose unexpected failures or drift
- **Compliance checks**: Ensure CI adheres to CI_PHILOSOPHY.md

**Not for**:
- Code analysis (use `odavl insight analyze`)
- Runtime debugging (use `odavl insight status`)

---

## Command: `odavl insight ci verify`

### Purpose

Validates `insight-ci.config.json` schema and enforces CI_PHILOSOPHY.md constraints.

### When to Use

- After creating or modifying `insight-ci.config.json`
- In CI pre-flight checks (validate before running analysis)
- During infrastructure code review

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Config valid or absent (defaults used) | Proceed with analysis |
| 1 | Invalid JSON or schema violation | Fix config file |
| 3 | Internal error | Report issue |

### Example Outputs

#### No Config Present

```bash
$ odavl insight ci verify

Workspace: /home/user/my-project

✓ No insight-ci.config.json found

Insight CI will use built-in defaults matching documented behavior:
  - PR mode: Fail only on Critical issues
  - Main branch: Never blocks on quality
  - Nightly: Disabled by default

To make CI behavior explicit, create insight-ci.config.json
See: docs/ci/CI_CONFIG_REFERENCE.md or insight-ci.config.example.json
```

**Interpretation**: Config absent, defaults apply. No action needed unless you want explicit control.

#### Valid Config

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

**Interpretation**: Config valid, all constraints satisfied. Safe to proceed.

#### Invalid JSON

```bash
$ odavl insight ci verify

Workspace: /home/user/my-project

✗ Configuration error (INVALID_JSON):

Invalid JSON in /home/user/my-project/insight-ci.config.json: Unexpected token } in JSON at position 342
```

**Interpretation**: JSON syntax error. Check for missing commas, trailing commas, or unquoted keys.

#### Schema Violation

```bash
$ odavl insight ci verify

Workspace: /home/user/my-project

✗ Configuration error (SCHEMA_VALIDATION):

Schema validation failed for /home/user/my-project/insight-ci.config.json:
  - modes.main.blockOnQuality: CRITICAL: main.blockOnQuality MUST be false. Main branch builds represent merged, approved code and must never fail on quality issues. See CI_PHILOSOPHY.md.
  - modes.pr.failOn: antiPatterns.failOnMediumOrLow is false, but PR mode is configured to fail on Medium or Low severity. This violates CI_PHILOSOPHY.md: precision over recall.
```

**Interpretation**: Config violates CI philosophy. Fix:
1. Set `modes.main.blockOnQuality: false`
2. Remove `modes.pr.failOn.medium: true` or `modes.pr.failOn.low: true`

---

## Command: `odavl insight ci doctor`

### Purpose

Diagnoses CI environment and detects config/environment drift.

### When to Use

- Pipeline behaving unexpectedly (wrong mode detected, wrong severity gates)
- Multi-platform migration (GitHub → GitLab, Jenkins → GitHub)
- Debugging why PR analysis is not running

### Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Environment and config consistent | No action needed |
| 1 | Config file invalid | Run `ci verify` first |
| 2 | Environment/config drift | Review warnings, adjust config or environment |
| 3 | Internal error | Report issue |

### Flags

- `--json` — Output diagnosis as JSON (for tooling integration)

### Example Outputs

#### Healthy PR Environment (GitHub Actions)

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

**Interpretation**: GitHub Actions PR workflow detected, PR mode active, fails only on Critical. No issues.

#### Main Branch Misconfiguration

```bash
$ odavl insight ci doctor

=== ODAVL Insight CI Doctor ===

Workspace: /home/user/my-project
Config source: insight-ci.config.json

CI Environment:
  Platform: gitlab
  Mode: main
  Branch: main
  Pull request: false
  Scheduled: false

Active Configuration:
  Mode: Main (baseline generation)
  Block on quality: true

⚠ Configuration Issues:
  - CRITICAL: main.blockOnQuality is true. This violates CI_PHILOSOPHY.md.

See: docs/ci/CI_CONFIG_REFERENCE.md for guidance
```

**Interpretation**: Main branch configured to block on quality. **This will cause deployment failures.** Fix: Set `modes.main.blockOnQuality: false`.

#### Over-Aggressive PR Gates

```bash
$ odavl insight ci doctor

=== ODAVL Insight CI Doctor ===

Workspace: /home/user/my-project
Config source: insight-ci.config.json

CI Environment:
  Platform: jenkins
  Mode: pr
  Branch: feature/refactor
  Pull request: true
  Scheduled: false

Active Configuration:
  Mode: PR (delta analysis)
  Fail on:
    Critical: true
    High: true
    Medium: true
    Low: false

⚠ Configuration Issues:
  - WARNING: PR mode fails on Medium or Low severity. This increases false positives.

See: docs/ci/CI_CONFIG_REFERENCE.md for guidance
```

**Interpretation**: PR mode configured to fail on High and Medium. This violates precision-over-recall philosophy. **Will create alert fatigue.**

Fix: Set `modes.pr.failOn.high: false` and `modes.pr.failOn.medium: false`.

#### JSON Output (for Automation)

```bash
$ odavl insight ci doctor --json
```

```json
{
  "workspace": "/home/user/my-project",
  "environment": {
    "platform": "github",
    "mode": "pr",
    "branch": "feature/add-auth",
    "isPullRequest": true,
    "isScheduled": false
  },
  "config": {
    "source": "file",
    "modes": {
      "pr": {
        "enabled": true,
        "failOn": {
          "critical": true,
          "high": false,
          "medium": false,
          "low": false
        },
        "maxNewIssues": null,
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
    "antiPatterns": {
      "failOnLegacy": false,
      "failOnMediumOrLow": false,
      "autoUploadWithoutConsent": false
    }
  },
  "issues": [],
  "healthy": true
}
```

**Use case**: Parse in CI scripts, send to monitoring systems, audit logs.

---

## Wiring into CI Pipelines

### GitHub Actions

```yaml
name: ODAVL Insight CI Validation

on:
  pull_request:
    paths:
      - 'insight-ci.config.json'
      - '.github/workflows/insight-*.yml'

jobs:
  validate-config:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Verify CI config
        run: npx @odavl-studio/cli insight ci verify

      - name: Diagnose environment
        run: npx @odavl-studio/cli insight ci doctor
```

**Trigger**: Only when config file or workflow files change. **Does NOT block regular PRs.**

### GitLab CI

```yaml
# .gitlab-ci.yml
ci-config-validation:
  stage: validate
  rules:
    - changes:
        - insight-ci.config.json
        - .gitlab-ci.yml
  script:
    - npm ci
    - npx @odavl-studio/cli insight ci verify
    - npx @odavl-studio/cli insight ci doctor
```

**Trigger**: Only when config or pipeline files change.

### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any

    stages {
        stage('Validate CI Config') {
            when {
                changeset 'insight-ci.config.json'
            }
            steps {
                sh 'npm ci'
                sh 'npx @odavl-studio/cli insight ci verify'
                sh 'npx @odavl-studio/cli insight ci doctor'
            }
        }
    }
}
```

**Trigger**: Only when config file changes.

### POSIX Runner

```bash
#!/bin/sh
# ci-preflight.sh

set -e

echo "=== CI Configuration Validation ==="

# Verify config schema
npx @odavl-studio/cli insight ci verify

# Diagnose environment
npx @odavl-studio/cli insight ci doctor

echo "=== Validation Complete ==="
```

**Usage**: Call as first step in CI pipeline, before running analysis.

---

## Debugging Common Issues

### Issue: "Mode detected as unknown"

**Symptom**:
```bash
CI Environment:
  Platform: generic
  Mode: unknown
```

**Cause**: CI platform not recognized (missing environment variables).

**Fix**:
1. Check environment variables:
   - GitHub Actions: `GITHUB_ACTIONS`, `GITHUB_EVENT_NAME`, `GITHUB_REF`
   - GitLab CI: `GITLAB_CI`, `CI_PIPELINE_SOURCE`, `CI_COMMIT_BRANCH`
   - Jenkins: `JENKINS_URL`, `BRANCH_NAME`, `CHANGE_ID`
2. If using custom runner, explicitly set mode via config or environment variables.

### Issue: "Config valid but PR still failing on High severity"

**Symptom**: Config shows `failOn.high: false`, but pipeline fails on High issues.

**Cause**: Environment variable override (e.g., `ODAVL_FAIL_ON_HIGH=true`).

**Fix**:
1. Check for environment overrides in CI config.
2. Set `allowOverrides: false` in `modes.pr` to disable environment overrides.

### Issue: "Main branch failing on quality"

**Symptom**: Main branch pipeline fails with exit code 2 (quality gate).

**Cause**: `modes.main.blockOnQuality: true` (violates CI philosophy).

**Fix**:
1. Run `odavl insight ci verify` — will show constraint violation.
2. Set `modes.main.blockOnQuality: false`.
3. Quality issues on main should be tracked as tasks, not blockers.

---

## Best Practices

### DO Use `ci verify` in Config Change PRs

When modifying `insight-ci.config.json`, run `ci verify` as CI step. This catches schema violations before merge.

### DO Run `ci doctor` for Pipeline Debugging

If pipeline behaving unexpectedly, run `ci doctor` locally to diagnose:
- Which mode is detected
- Which severity gates are active
- Whether config matches environment

### DO NOT Run `ci verify` on Every PR

`ci verify` is for config validation, not code analysis. Only run when config or workflow files change. Running on every PR wastes CI time.

### DO NOT Block Production Workflows on `ci doctor`

`ci doctor` exit code 2 indicates drift, not operational failure. Use for alerting and diagnostics, not as hard gate.

---

## Further Reading

- **CI_PHILOSOPHY.md** — Core principles for CI integration
- **CI_CONFIG_REFERENCE.md** — Complete config schema documentation
- **INSIGHT_GITHUB_ACTIONS.md** — GitHub Actions reference workflows
- **GITLAB_CI.md** — GitLab CI integration patterns
- **JENKINS.md** — Jenkins declarative pipeline examples
- **POSIX_RUNNER.md** — Platform-agnostic shell script usage
