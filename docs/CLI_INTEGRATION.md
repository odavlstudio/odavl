# ODAVL CLI Integration Guide

**Purpose:** Integrate ODAVL CLI into your development workflow, CI/CD pipelines, and automation tools.

---

## Table of Contents

- [CI/CD Integration](#cicd-integration)
  - [GitHub Actions](#github-actions)
  - [GitLab CI](#gitlab-ci)
  - [Azure DevOps](#azure-devops)
  - [Jenkins](#jenkins)
- [IDE Integration](#ide-integration)
  - [VS Code Tasks](#vs-code-tasks)
  - [Custom Scripts](#custom-scripts)
  - [Watch Mode](#watch-mode)
- [Automation Workflows](#automation-workflows)
  - [Pre-Commit Hooks](#pre-commit-hooks)
  - [Scheduled Analysis](#scheduled-analysis)
  - [Continuous Monitoring](#continuous-monitoring)
- [Advanced Configuration](#advanced-configuration)
  - [Custom Gates](#custom-gates)
  - [Recipe Management](#recipe-management)
  - [Risk Budgets](#risk-budgets)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## CI/CD Integration

### GitHub Actions

#### Basic Quality Check Workflow

Create `.github/workflows/odavl-quality.yml`:

```yaml
name: ODAVL Quality Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  insight-analysis:
    name: Run Insight Analysis
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Insight Analysis
        run: odavl insight analyze --detectors typescript,eslint,security
      
      - name: Upload analysis results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: odavl-analysis
          path: .odavl/history.json
```

#### Autopilot Workflow with PR Comments

```yaml
name: ODAVL Autopilot

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: write
  pull-requests: write

jobs:
  autopilot:
    name: Run Autopilot Improvements
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Autopilot
        id: autopilot
        run: |
          odavl autopilot run --max-files 5 --max-loc 20
          echo "run_id=$(ls -t .odavl/ledger/ | head -1 | cut -d'-' -f2 | cut -d'.' -f1)" >> $GITHUB_OUTPUT
      
      - name: Commit changes
        if: success()
        run: |
          git config --local user.email "autopilot@odavl.studio"
          git config --local user.name "ODAVL Autopilot"
          git add .
          git commit -m "chore: autopilot improvements (run ${{ steps.autopilot.outputs.run_id }})" || echo "No changes"
          git push
      
      - name: Comment on PR
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const ledgerPath = `.odavl/ledger/run-${{ steps.autopilot.outputs.run_id }}.json`;
            const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
            
            const comment = `## 🚀 ODAVL Autopilot Results
            
            **Run ID:** \`${{ steps.autopilot.outputs.run_id }}\`
            **Files Modified:** ${ledger.edits?.length || 0}
            **Status:** ✅ Success
            
            <details>
            <summary>View Changes</summary>
            
            ${ledger.edits?.map(e => `- \`${e.path}\` (${e.diffLoc} LOC)`).join('\n') || 'No changes'}
            
            </details>`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

#### Guardian Pre-Deploy Workflow

```yaml
name: ODAVL Guardian Tests

on:
  workflow_dispatch:
    inputs:
      url:
        description: 'URL to test'
        required: true
        default: 'https://staging.example.com'

jobs:
  guardian-tests:
    name: Run Pre-Deploy Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Guardian Tests
        run: odavl guardian test ${{ inputs.url }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: guardian-results
          path: .odavl/guardian/
      
      - name: Fail if tests failed
        if: failure()
        run: |
          echo "❌ Guardian tests failed - deployment blocked"
          exit 1
```

---

### GitLab CI

#### `.gitlab-ci.yml` Configuration

```yaml
stages:
  - analysis
  - improve
  - test

variables:
  NODE_VERSION: "18"

# Insight Analysis Stage
insight:
  stage: analysis
  image: node:${NODE_VERSION}
  before_script:
    - npm install -g @odavl-studio/cli
    - npm ci
  script:
    - odavl insight analyze --detectors all
  artifacts:
    paths:
      - .odavl/history.json
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop

# Autopilot Stage (runs on develop only)
autopilot:
  stage: improve
  image: node:${NODE_VERSION}
  before_script:
    - npm install -g @odavl-studio/cli
    - npm ci
    - git config --global user.email "autopilot@odavl.studio"
    - git config --global user.name "ODAVL Autopilot"
  script:
    - odavl autopilot run --max-files 10
    - |
      if [ -n "$(git status --porcelain)" ]; then
        git add .
        git commit -m "chore: autopilot improvements [skip ci]"
        git push https://oauth2:${CI_JOB_TOKEN}@${CI_SERVER_HOST}/${CI_PROJECT_PATH}.git HEAD:${CI_COMMIT_REF_NAME}
      fi
  only:
    - develop
  when: manual

# Guardian Tests (runs on staging deployment)
guardian:
  stage: test
  image: node:${NODE_VERSION}
  before_script:
    - npm install -g @odavl-studio/cli
  script:
    - odavl guardian test ${STAGING_URL}
  only:
    - merge_requests
  variables:
    STAGING_URL: "https://staging.example.com"
  allow_failure: false
```

---

### Azure DevOps

#### `azure-pipelines.yml` Configuration

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Analysis
    displayName: 'Code Analysis'
    jobs:
      - job: InsightAnalysis
        displayName: 'Run ODAVL Insight'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
            displayName: 'Install Node.js'
          
          - script: npm ci
            displayName: 'Install dependencies'
          
          - script: npm install -g @odavl-studio/cli
            displayName: 'Install ODAVL CLI'
          
          - script: odavl insight analyze --detectors typescript,eslint,security
            displayName: 'Run Insight Analysis'
          
          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: '.odavl/history.json'
              ArtifactName: 'odavl-analysis'
            condition: always()
            displayName: 'Upload analysis results'

  - stage: Improve
    displayName: 'Autopilot Improvements'
    dependsOn: Analysis
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
    jobs:
      - job: Autopilot
        displayName: 'Run ODAVL Autopilot'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
          
          - script: npm ci
            displayName: 'Install dependencies'
          
          - script: npm install -g @odavl-studio/cli
            displayName: 'Install ODAVL CLI'
          
          - script: |
              git config --global user.email "autopilot@odavl.studio"
              git config --global user.name "ODAVL Autopilot"
            displayName: 'Configure git'
          
          - script: odavl autopilot run --max-files 10
            displayName: 'Run Autopilot'
          
          - script: |
              if [ -n "$(git status --porcelain)" ]; then
                git add .
                git commit -m "chore: autopilot improvements [skip ci]"
                git push origin HEAD:$(Build.SourceBranchName)
              fi
            displayName: 'Commit and push changes'
            env:
              SYSTEM_ACCESSTOKEN: $(System.AccessToken)

  - stage: Test
    displayName: 'Pre-Deploy Tests'
    dependsOn: Improve
    condition: and(succeeded(), eq(variables['Build.Reason'], 'PullRequest'))
    jobs:
      - job: Guardian
        displayName: 'Run ODAVL Guardian'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'
          
          - script: npm install -g @odavl-studio/cli
            displayName: 'Install ODAVL CLI'
          
          - script: odavl guardian test $(STAGING_URL)
            displayName: 'Run Guardian Tests'
            env:
              STAGING_URL: 'https://staging.example.com'
```

---

### Jenkins

#### `Jenkinsfile` Configuration

```groovy
pipeline {
    agent {
        docker {
            image 'node:18'
            args '-u root:root'
        }
    }
    
    environment {
        ODAVL_LOG_LEVEL = 'info'
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @odavl-studio/cli'
                sh 'npm ci'
            }
        }
        
        stage('Insight Analysis') {
            steps {
                sh 'odavl insight analyze --detectors all'
            }
            post {
                always {
                    archiveArtifacts artifacts: '.odavl/history.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('Autopilot') {
            when {
                branch 'develop'
            }
            steps {
                sh '''
                    git config --global user.email "autopilot@odavl.studio"
                    git config --global user.name "ODAVL Autopilot"
                    odavl autopilot run --max-files 10
                    if [ -n "$(git status --porcelain)" ]; then
                        git add .
                        git commit -m "chore: autopilot improvements [skip ci]"
                        git push origin HEAD:${BRANCH_NAME}
                    fi
                '''
            }
        }
        
        stage('Guardian Tests') {
            when {
                changeRequest()
            }
            steps {
                sh 'odavl guardian test ${STAGING_URL}'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            mail to: 'team@example.com',
                 subject: "ODAVL Pipeline Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                 body: "Check console output at ${env.BUILD_URL}"
        }
    }
}
```

---

## IDE Integration

### VS Code Tasks

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "ODAVL: Insight Analysis",
      "type": "shell",
      "command": "odavl",
      "args": ["insight", "analyze"],
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "ODAVL: Autopilot Run",
      "type": "shell",
      "command": "odavl",
      "args": ["autopilot", "run", "--max-files", "5"],
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "ODAVL: Autopilot Undo",
      "type": "shell",
      "command": "odavl",
      "args": ["autopilot", "undo"],
      "group": "none",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "ODAVL: Guardian Test Localhost",
      "type": "shell",
      "command": "odavl",
      "args": ["guardian", "test", "http://localhost:3000"],
      "group": "test",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    }
  ]
}
```

**Usage:**

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
2. Type "Tasks: Run Task"
3. Select task (e.g., "ODAVL: Insight Analysis")

**Keyboard Shortcuts:**

Add to `.vscode/keybindings.json`:

```json
[
  {
    "key": "ctrl+shift+i",
    "command": "workbench.action.tasks.runTask",
    "args": "ODAVL: Insight Analysis"
  },
  {
    "key": "ctrl+shift+a",
    "command": "workbench.action.tasks.runTask",
    "args": "ODAVL: Autopilot Run"
  }
]
```

---

### Custom Scripts

#### `package.json` Scripts

```json
{
  "scripts": {
    "odavl:analyze": "odavl insight analyze",
    "odavl:analyze:full": "odavl insight analyze --detectors all",
    "odavl:autopilot": "odavl autopilot run",
    "odavl:autopilot:safe": "odavl autopilot run --max-files 3 --max-loc 15",
    "odavl:undo": "odavl autopilot undo",
    "odavl:guardian": "odavl guardian test http://localhost:3000",
    "precommit": "odavl insight analyze --detectors typescript,eslint",
    "prepush": "npm run odavl:analyze:full"
  }
}
```

**Usage:**

```bash
npm run odavl:analyze
npm run odavl:autopilot:safe
npm run odavl:guardian
```

---

### Watch Mode

#### Continuous Analysis with Nodemon

```json
{
  "scripts": {
    "odavl:watch": "nodemon --watch src --ext ts,tsx,js,jsx --exec 'odavl insight analyze'"
  }
}
```

Install nodemon:

```bash
npm install --save-dev nodemon
```

Run watch mode:

```bash
npm run odavl:watch
```

---

## Automation Workflows

### Pre-Commit Hooks

#### Using Husky

**1. Install Husky:**

```bash
npm install --save-dev husky
npx husky init
```

**2. Create `.husky/pre-commit`:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running ODAVL Insight analysis..."

odavl insight analyze --detectors typescript,eslint,security

if [ $? -ne 0 ]; then
  echo "❌ ODAVL analysis failed - commit blocked"
  exit 1
fi

echo "✅ ODAVL analysis passed"
```

**3. Make executable:**

```bash
chmod +x .husky/pre-commit
```

---

#### Using Git Hooks (Manual)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "🔍 Running ODAVL Insight analysis..."

odavl insight analyze --detectors typescript,eslint

if [ $? -ne 0 ]; then
  echo "❌ ODAVL analysis failed"
  echo "Fix errors or use 'git commit --no-verify' to bypass"
  exit 1
fi

echo "✅ ODAVL analysis passed"
exit 0
```

Make executable:

```bash
chmod +x .git/hooks/pre-commit
```

---

### Scheduled Analysis

#### Using Cron (Linux/macOS)

Edit crontab:

```bash
crontab -e
```

Add daily analysis at 2 AM:

```cron
0 2 * * * cd /path/to/project && /usr/local/bin/odavl insight analyze >> /var/log/odavl.log 2>&1
```

Weekly autopilot run (Sundays at 3 AM):

```cron
0 3 * * 0 cd /path/to/project && /usr/local/bin/odavl autopilot run --max-files 10 >> /var/log/odavl-autopilot.log 2>&1
```

---

#### Using Windows Task Scheduler

**PowerShell Script (`odavl-scheduled.ps1`):**

```powershell
Set-Location "C:\Projects\MyApp"

# Run analysis
Write-Host "Running ODAVL Insight analysis..."
odavl insight analyze --detectors all

# Log results
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path "C:\Logs\odavl.log" -Value "[$timestamp] Analysis complete"
```

**Create Task:**

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `powershell.exe`
6. Arguments: `-File C:\Scripts\odavl-scheduled.ps1`

---

### Continuous Monitoring

#### Docker Container with Cron

**Dockerfile:**

```dockerfile
FROM node:18

# Install ODAVL CLI
RUN npm install -g @odavl-studio/cli

# Install cron
RUN apt-get update && apt-get install -y cron

# Copy project
WORKDIR /app
COPY . .
RUN npm ci

# Add cron job
RUN echo "0 * * * * cd /app && odavl insight analyze >> /var/log/odavl.log 2>&1" | crontab -

# Start cron
CMD ["cron", "-f"]
```

**Build and run:**

```bash
docker build -t odavl-monitor .
docker run -d --name odavl-monitor odavl-monitor
```

---

## Advanced Configuration

### Custom Gates

**`.odavl/gates.yml` - Strict Configuration:**

```yaml
risk_budget: 50  # Lower risk tolerance
forbidden_paths:
  - security/**
  - auth/**
  - billing/**
  - public-api/**
  - "**/*.spec.*"
  - "**/*.test.*"
  - database/migrations/**
  - scripts/deploy/**

actions:
  max_auto_changes: 5  # More conservative
  max_files_per_cycle: 5
  max_loc_per_file: 20  # Smaller changes

enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
  - require_tests_pass

thresholds:
  max_risk_per_action: 15  # Lower risk per action
  min_success_rate: 0.85  # Higher success requirement
  max_consecutive_failures: 2  # Blacklist faster
  min_test_coverage: 0.80  # Require 80% coverage
```

---

**`.odavl/gates.yml` - Permissive Configuration:**

```yaml
risk_budget: 200  # Higher risk tolerance
forbidden_paths:
  - security/core/**
  - "**/*.spec.*"

actions:
  max_auto_changes: 20  # More aggressive
  max_files_per_cycle: 20
  max_loc_per_file: 80  # Larger changes

enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure

thresholds:
  max_risk_per_action: 50
  min_success_rate: 0.60  # Lower requirement
  max_consecutive_failures: 5  # More tolerant
```

---

### Recipe Management

#### Custom Recipe Structure

**`.odavl/recipes/fix-console-logs.json`:**

```json
{
  "id": "fix-console-logs",
  "name": "Remove console.log statements",
  "description": "Replace console.log with proper logging",
  "trust": 0.85,
  "conditions": {
    "patterns": ["console\\.log\\("],
    "fileTypes": [".ts", ".tsx", ".js", ".jsx"],
    "excludePaths": ["**/*.test.*", "scripts/**"]
  },
  "actions": [
    {
      "type": "replace",
      "pattern": "console\\.log\\(([^)]*)\\)",
      "replacement": "logger.info($1)",
      "addImport": "import { logger } from '@/lib/logger';"
    }
  ],
  "validation": {
    "requiresTests": false,
    "maxFiles": 10,
    "maxLoc": 30
  }
}
```

---

#### Recipe Trust Management

**View trust scores:**

```bash
cat .odavl/recipes-trust.json | jq '.'
```

**Manually update trust:**

```json
{
  "fix-console-logs": {
    "trust": 0.95,
    "runs": 120,
    "successes": 114,
    "failures": 6,
    "lastRun": "2025-11-23T10:30:00Z",
    "blacklisted": false
  }
}
```

**Reset blacklisted recipe:**

```bash
# Edit .odavl/recipes-trust.json
# Set "blacklisted": false
# Set "trust": 0.50
```

---

### Risk Budgets

#### Understanding Risk Calculation

**Risk Points:**

- Each file modification: 10 points
- Each LOC changed: 0.5 points
- Protected path: 50 points (blocked)
- Test file: 5 points

**Example Calculation:**

```
3 files modified = 30 points
87 LOC changed = 43.5 points
Total risk = 73.5 points
```

**Budget Check:**

```yaml
risk_budget: 100  # Allowed
73.5 < 100  # ✅ Approved
```

---

#### Dynamic Risk Budgets

**`.odavl/gates.yml` - Time-based:**

```yaml
risk_budget: 100

# Override for off-hours (weekends/nights)
overrides:
  - schedule: "0 0 * * 6,0"  # Weekends
    risk_budget: 200
    max_auto_changes: 20
  
  - schedule: "0 22-23,0-5 * * *"  # Nights
    risk_budget: 150
    max_auto_changes: 15
```

---

## Best Practices

### 1. Start Conservative, Scale Up

```yaml
# Week 1: Observe only
actions:
  max_auto_changes: 0  # No auto-changes

# Week 2: Small changes
actions:
  max_auto_changes: 3
  max_loc_per_file: 10

# Week 3+: Normal operations
actions:
  max_auto_changes: 10
  max_loc_per_file: 40
```

---

### 2. Use Feature Branches for Autopilot

```yaml
# .github/workflows/autopilot.yml
on:
  schedule:
    - cron: '0 2 * * 1'  # Mondays at 2 AM

jobs:
  autopilot:
    steps:
      - name: Create feature branch
        run: |
          git checkout -b autopilot/$(date +%Y%m%d)
          odavl autopilot run
          git push origin autopilot/$(date +%Y%m%d)
      
      - name: Create PR
        uses: peter-evans/create-pull-request@v5
        with:
          branch: autopilot/$(date +%Y%m%d)
          title: "chore: autopilot improvements"
```

---

### 3. Monitor Trust Scores

```bash
# Weekly trust score report
cat .odavl/recipes-trust.json | jq -r '
  to_entries |
  map({
    recipe: .key,
    trust: .value.trust,
    success_rate: (.value.successes / .value.runs * 100 | floor)
  }) |
  sort_by(.trust) |
  reverse |
  .[] |
  "\(.recipe): \(.trust) (\(.success_rate)%)"
'
```

---

### 4. Separate CI Stages

```yaml
stages:
  - analysis     # Always run
  - improve      # Manual/scheduled
  - test         # Always run
```

---

### 5. Use Environment-Specific Configs

```
.odavl/
├── gates.yml              # Default
├── gates.dev.yml          # Development
├── gates.staging.yml      # Staging
└── gates.production.yml   # Production (read-only)
```

Load with:

```bash
export ODAVL_CONFIG=.odavl/gates.dev.yml
odavl autopilot run
```

---

## Troubleshooting

### Issue 1: CI Pipeline Fails with "Command not found: odavl"

**Cause:** CLI not installed in CI environment.

**Solution:**

```yaml
- name: Install ODAVL CLI
  run: npm install -g @odavl-studio/cli
```

Or add to `package.json`:

```json
{
  "devDependencies": {
    "@odavl-studio/cli": "^0.1.0"
  }
}
```

---

### Issue 2: Autopilot Changes Not Committed

**Cause:** Git not configured or no changes made.

**Solution:**

```bash
git config --local user.email "autopilot@odavl.studio"
git config --local user.name "ODAVL Autopilot"

# Check for changes before committing
if [ -n "$(git status --porcelain)" ]; then
  git commit -m "chore: autopilot improvements"
fi
```

---

### Issue 3: Guardian Tests Timeout

**Cause:** URL not accessible from CI environment.

**Solution:**

```yaml
# Use curl to verify URL first
- name: Verify URL accessible
  run: curl -f ${{ env.STAGING_URL }} || exit 1

- name: Run Guardian Tests
  run: odavl guardian test ${{ env.STAGING_URL }}
  timeout-minutes: 5
```

---

### Issue 4: Pre-Commit Hook Blocks Every Commit

**Cause:** Too strict analysis or existing errors.

**Solution:**

```bash
# Bypass for urgent commits
git commit --no-verify -m "urgent: fix production issue"

# Or fix errors first
odavl insight analyze
# Fix reported issues
git commit -m "fix: resolve analysis errors"
```

---

### Issue 5: Cron Job Not Running

**Cause:** Incorrect path or permissions.

**Solution:**

```cron
# Use absolute paths
0 2 * * * /usr/local/bin/node /usr/local/bin/odavl insight analyze

# Check cron logs
tail -f /var/log/cron.log

# Test manually
/usr/local/bin/odavl insight analyze
```

---

## Additional Resources

- **CLI Reference:** [CLI_REFERENCE.md](./CLI_REFERENCE.md)
- **SDK Integration:** [SDK_INTEGRATION.md](./SDK_INTEGRATION.md)
- **GitHub Actions:** https://github.com/features/actions
- **GitLab CI:** https://docs.gitlab.com/ee/ci/
- **Azure DevOps:** https://azure.microsoft.com/en-us/services/devops/
- **Husky:** https://typicode.github.io/husky/

---

**Last Updated:** November 23, 2025  
**CLI Version:** 0.1.0  
**Author:** ODAVL Studio Team
