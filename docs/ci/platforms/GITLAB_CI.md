# ODAVL Insight: GitLab CI Integration

**Version**: 1.0.0  
**Last Updated**: December 2025

---

## Why GitLab CI for EU Enterprises

GitLab CI dominates European enterprise deployments due to data sovereignty requirements, self-hosted deployment capabilities, and GDPR-aligned architecture. Organizations in regulated industries (finance, healthcare, government) prefer GitLab for complete infrastructure control.

ODAVL Insight aligns with GitLab's privacy-first philosophy: local-first analysis, optional cloud sync, air-gapped compatibility.

---

## Merge Request Workflow Mapping

### GitHub Actions → GitLab CI Concepts

| GitHub Actions | GitLab CI | Notes |
|---------------|-----------|-------|
| `pull_request` | `merge_requests` | Trigger event |
| `github.base_ref` | `$CI_MERGE_REQUEST_TARGET_BRANCH_NAME` | Target branch |
| `github.head_ref` | `$CI_MERGE_REQUEST_SOURCE_BRANCH_NAME` | Source branch |
| `actions/checkout` | `git clone` (automatic) | GitLab clones by default |
| `GITHUB_TOKEN` | `CI_JOB_TOKEN` | Authentication |
| Artifacts | `artifacts:` | File storage |
| SARIF upload | Code Quality reports | Native integration |

---

## Delta Analysis with GitLab Refs

**Baseline Fetch**:
```bash
git fetch origin $CI_MERGE_REQUEST_TARGET_BRANCH_NAME
BASELINE_REF="origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME"
```

**Analysis**:
```bash
npx @odavl-studio/cli insight analyze \
  --fail-on-critical \
  --delta-mode \
  --baseline-ref $BASELINE_REF
```

---

## Exit Code Behavior and Pipeline Gating

**Exit Code 0**: Analysis succeeded, no new Critical issues  
**Exit Code 1**: Detector failure (crash, timeout, config error)  
**Exit Code 2**: New Critical issues detected (blocks merge)

**GitLab Interpretation**:
- Non-zero exit → Job fails → Pipeline fails → Merge blocked (if required)
- Zero exit → Job succeeds → Pipeline continues

**Pipeline Rules**:
```yaml
rules:
  - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  - if: '$CI_COMMIT_BRANCH == "main"'
```

---

## Why Main Branch Must NEVER Be Blocked

Main branch CI represents merged, approved code. Failing main branch creates deployment ambiguity. Quality issues are reported but do not fail jobs.

**Implementation**:
```yaml
script:
  - npx @odavl-studio/cli insight analyze --format json
allow_failure: true  # Quality issues do not fail pipeline
```

---

## Code Quality Report Integration

GitLab native Code Quality format:
```json
[
  {
    "description": "Hardcoded API key detected",
    "severity": "critical",
    "location": {
      "path": "src/config.ts",
      "lines": { "begin": 23 }
    }
  }
]
```

Convert SARIF to Code Quality via transformation script or use GitLab SAST integration.

---

## Using insight-ci.config.json

GitLab CI pipelines respect `insight-ci.config.json` for centralized behavior control. If absent, built-in defaults apply.

**Pre-Flight Validation**:
```yaml
validate-config:
  stage: .pre
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
      exists:
        - insight-ci.config.json
  script:
    - npx @odavl-studio/cli insight ci verify
```

**Environment Diagnosis** (optional debugging):
```yaml
diagnose:
  stage: .post
  when: on_failure
  script:
    - npx @odavl-studio/cli insight ci doctor
```

See: `docs/ci/CI_CONFIG_REFERENCE.md` and `docs/ci/CI_DOCTOR.md` for configuration details.

---

## Reference Workflows

See `gitlab-pr.yml` and `gitlab-main.yml` in this directory for production-ready configurations.
