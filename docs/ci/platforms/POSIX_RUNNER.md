# ODAVL Insight: POSIX Runner Integration

**Version**: 1.0.0  
**Last Updated**: December 2025

---

## Air-Gapped Usage

POSIX shell script (`insight.sh`) operates without external dependencies:
- No network requests (unless explicit cloud upload)
- No CI platform assumptions (GitHub, GitLab, Jenkins)
- No package manager requirements (uses pre-installed CLI)

Ideal for:
- Secure facilities with no internet access
- Custom CI runners (TeamCity, Bamboo, CircleCI)
- Manual validation before commit
- Compliance environments requiring audit trails

---

## No CI Platform Assumptions

Script reads environment variables but does not require specific CI platform:
- Detects GitHub Actions via `$GITHUB_ACTIONS`
- Detects GitLab CI via `$GITLAB_CI`
- Detects Jenkins via `$JENKINS_HOME`
- Falls back to generic mode for unknown platforms

**Platform Detection**:
```bash
if [ -n "$GITHUB_ACTIONS" ]; then
  PLATFORM="github"
elif [ -n "$GITLAB_CI" ]; then
  PLATFORM="gitlab"
elif [ -n "$JENKINS_HOME" ]; then
  PLATFORM="jenkins"
else
  PLATFORM="generic"
fi
```

---

## Script-First Philosophy

Shell script is canonical integration method. CI platform configs (GitHub Actions, GitLab CI, Jenkins) wrap this script.

**Benefits**:
- Single source of truth for analysis logic
- Platform-specific configs become thin wrappers
- Easier testing (run script locally without CI)
- Consistent behavior across platforms

---

## Usage Examples

**PR Analysis**:
```bash
./insight.sh --mode=pr --baseline-ref=origin/main
```

**Main Branch Baseline**:
```bash
./insight.sh --mode=main
```

**Nightly Trend Analysis**:
```bash
./insight.sh --mode=nightly
```

---

## Using insight-ci.config.json

`insight.sh` respects `insight-ci.config.json` if present in workspace root. If absent, built-in defaults apply.

**Pre-Flight Validation**:
```bash
#!/bin/sh
# Validate config before analysis
if [ -f insight-ci.config.json ]; then
  npx @odavl-studio/cli insight ci verify || exit 1
fi

# Run analysis
./insight.sh --mode=pr --baseline-ref=origin/main
```

**Environment Diagnosis** (optional debugging):
```bash
# On analysis failure, diagnose environment
if [ $? -ne 0 ]; then
  npx @odavl-studio/cli insight ci doctor
fi
```

See: `docs/ci/CI_CONFIG_REFERENCE.md` and `docs/ci/CI_DOCTOR.md` for configuration details.

---

## Reference Implementation

See `insight.sh` in this directory for complete POSIX-compliant shell script.
