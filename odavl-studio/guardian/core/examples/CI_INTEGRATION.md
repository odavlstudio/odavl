# Guardian CI/CD Integration

This directory contains CI/CD integration examples for Guardian.

## GitHub Actions

See `.github/workflows/guardian-tests.yml` for a complete GitHub Actions workflow.

### Features
- ✅ Runs on every PR and push to main/develop
- ✅ Tests multiple URLs
- ✅ Quality gates (fail on critical/high issues)
- ✅ Uploads test reports as artifacts
- ✅ Comments PR with test results

### Environment Variables
```bash
GUARDIAN_FAIL_ON_CRITICAL=true   # Fail if critical issues found
GUARDIAN_FAIL_ON_HIGH=false      # Fail if high severity issues found
GUARDIAN_MAX_ISSUES=20           # Maximum total issues allowed
```

## GitLab CI

```yaml
guardian:test:
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  stage: test
  script:
    - pnpm install
    - cd odavl-studio/guardian/core
    - pnpm build
    - pnpm exec playwright install chromium
    - tsx examples/ci-integration.ts
  artifacts:
    when: always
    paths:
      - .odavl/guardian/ci/
    reports:
      junit: .odavl/guardian/ci/*.xml
```

## Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Install') {
            steps {
                sh 'pnpm install'
            }
        }
        
        stage('Build Guardian') {
            steps {
                dir('odavl-studio/guardian/core') {
                    sh 'pnpm build'
                    sh 'pnpm exec playwright install chromium'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('odavl-studio/guardian/core') {
                    sh 'tsx examples/ci-integration.ts'
                }
            }
        }
        
        stage('Publish Reports') {
            steps {
                publishHTML([
                    reportDir: '.odavl/guardian/ci',
                    reportFiles: '*.html',
                    reportName: 'Guardian Reports'
                ])
            }
        }
    }
}
```

## CircleCI

```yaml
version: 2.1

jobs:
  guardian-test:
    docker:
      - image: mcr.microsoft.com/playwright:v1.40.0-focal
    steps:
      - checkout
      - run: pnpm install
      - run:
          name: Build Guardian
          command: |
            cd odavl-studio/guardian/core
            pnpm build
      - run:
          name: Install browsers
          command: |
            cd odavl-studio/guardian/core
            pnpm exec playwright install chromium
      - run:
          name: Run tests
          command: |
            cd odavl-studio/guardian/core
            tsx examples/ci-integration.ts
      - store_artifacts:
          path: .odavl/guardian/ci
```

## Pre-commit Hook

Install the pre-commit hook:

```bash
# Make hook executable
chmod +x .githooks/pre-commit

# Configure git to use .githooks
git config core.hooksPath .githooks
```

The hook will:
- Run Guardian tests on localhost:3000 before commit
- Block commit if critical issues found
- Skip if localhost not running

## Azure DevOps

```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'

- script: |
    npm install -g pnpm
    pnpm install
  displayName: 'Install dependencies'

- script: |
    cd odavl-studio/guardian/core
    pnpm build
    pnpm exec playwright install chromium
  displayName: 'Build Guardian'

- script: |
    cd odavl-studio/guardian/core
    tsx examples/ci-integration.ts
  displayName: 'Run Guardian tests'

- task: PublishPipelineArtifact@1
  inputs:
    targetPath: '.odavl/guardian/ci'
    artifact: 'guardian-reports'
```

## Local Testing

Run CI tests locally:

```bash
cd odavl-studio/guardian/core
pnpm build
tsx examples/ci-integration.ts
```

Configure via environment variables:

```bash
export GUARDIAN_FAIL_ON_CRITICAL=true
export GUARDIAN_MAX_ISSUES=10
tsx examples/ci-integration.ts
```

## Quality Gates

Configure quality gates in `ci-integration.ts`:

```typescript
const config: CIConfig = {
  urls: ['http://localhost:3000'],
  failOnCritical: true,    // Block on critical issues
  failOnHigh: true,        // Block on high severity
  maxIssues: 20,           // Maximum total issues
  outputDir: '.odavl/guardian/ci'
};
```

## Output Files

CI tests generate:
- `summary.json` - Machine-readable summary
- `summary.md` - Human-readable markdown (for PR comments)
- `report-*.json` - Individual test reports
- `report-*.html` - HTML reports with visualizations
