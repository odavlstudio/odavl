# ODAVL Insight: Jenkins Integration

**Version**: 1.0.0  
**Last Updated**: December 2025

---

## Why Jenkins Still Matters

Jenkins dominates in:
- Regulated industries (finance, healthcare) with compliance requirements
- On-premise deployments with no cloud connectivity
- Air-gapped environments (defense, critical infrastructure)
- Legacy systems requiring gradual modernization

Insight's local-first architecture fits Jenkins perfectly: no external dependencies, deterministic execution, POSIX-compliant.

---

## Declarative vs Scripted Pipeline

**Use Declarative Pipeline** for Insight integration:
- Structured, readable syntax
- Built-in error handling and retry logic
- Better IDE support and validation
- Easier maintenance and debugging

Scripted pipeline offers more flexibility but increases complexity unnecessarily for analysis workflows.

---

## Determinism and Reproducibility

**Version Pinning**:
```groovy
sh 'npm install @odavl-studio/cli@1.2.3'
```

**Configuration Locking**:
- `.odavl/config.json` version-controlled
- `.odavl/gates.yml` version-controlled
- No environment-specific overrides

**Reproducibility**:
Same commit + same Insight version → identical results, regardless of execution time or Jenkins node.

---

## No Reliance on Jenkins Plugins

Insight uses CLI-only integration. No Jenkins plugins required:
- No plugin version conflicts
- No security vulnerabilities from outdated plugins
- Works on any Jenkins installation (2.x+)
- Air-gapped compatible

---

## PR-Like Behavior via Environment Variables

Jenkins does not have native "pull request" concept. Use parameters or environment variables:

```groovy
parameters {
  string(name: 'TARGET_BRANCH', defaultValue: 'main')
  string(name: 'SOURCE_BRANCH', defaultValue: '')
}
```

**Delta Analysis**:
```groovy
sh """
  npx @odavl-studio/cli insight analyze \
    --fail-on-critical \
    --delta-mode \
    --baseline-ref origin/${params.TARGET_BRANCH}
"""
```

---

## Using insight-ci.config.json

Jenkins pipelines respect `insight-ci.config.json` for centralized CI behavior. If absent, built-in defaults apply.

**Pre-Flight Validation Stage**:
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

**Environment Diagnosis** (optional debugging):
```groovy
post {
    failure {
        script {
            sh 'npx @odavl-studio/cli insight ci doctor'
        }
    }
}
```

See: `docs/ci/CI_CONFIG_REFERENCE.md` and `docs/ci/CI_DOCTOR.md` for configuration details.

---

## Reference Pipeline

See `Jenkinsfile` in this directory for complete declarative pipeline configuration.
