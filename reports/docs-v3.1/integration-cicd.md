# 🔄 CI/CD Integration Guide

Integrate ODAVL Insight into your CI/CD pipeline for automated quality checks.

## GitHub Actions

### Setup

Create `.github/workflows/odavl-insight.yml`:

```yaml
name: ODAVL Insight

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  detect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Detection
        run: odavl insight analyze --format sarif --output results.sarif
      
      - name: Upload Results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
```

## GitLab CI

### Setup

Add to `.gitlab-ci.yml`:

```yaml
odavl_insight:
  stage: test
  image: node:18
  script:
    - npm install -g @odavl-studio/cli
    - odavl insight analyze --format json --output results.json
  artifacts:
    reports:
      codequality: results.json
```

## Jenkins

### Pipeline

```groovy
pipeline {
  agent any
  stages {
    stage('Detect') {
      steps {
        sh 'npm install -g @odavl-studio/cli'
        sh 'odavl insight analyze'
      }
    }
  }
}
```

## Azure DevOps

### Pipeline

```yaml
steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
  
  - script: |
      npm install -g @odavl-studio/cli
      odavl insight analyze
    displayName: 'Run ODAVL Insight'
```

## Quality Gates

### Block PR on Issues

```yaml
- name: Check Issues
  run: |
    ISSUES=$(odavl insight analyze --format json | jq '.stats.totalIssues')
    if [ $ISSUES -gt 10 ]; then
      echo "Too many issues: $ISSUES"
      exit 1
    fi
```

## Best Practices

✅ Run on every PR  
✅ Block merges with critical issues  
✅ Generate SARIF for GitHub Security  
✅ Cache detection results  
✅ Send notifications to Slack  

---

**Next**: [API Documentation](./api-reference.md)
