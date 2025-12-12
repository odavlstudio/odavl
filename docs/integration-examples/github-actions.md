# Integration Example: GitHub Actions

**Goal**: Run ODAVL on every push and PR with quality gates.

---

## Basic Workflow

```yaml
# .github/workflows/odavl-quality.yml
name: ODAVL Quality Check

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for accurate analysis
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run ODAVL Analysis
        run: |
          odavl insight analyze \
            --fail-on critical,high \
            --format json \
            --output .odavl/report.json
      
      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: odavl-report
          path: .odavl/report.json
```

---

## Advanced Workflow (with Autopilot)

```yaml
# .github/workflows/odavl-autopilot.yml
name: ODAVL Autonomous Fix

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  workflow_dispatch:  # Manual trigger

jobs:
  autopilot:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install ODAVL CLI
        run: npm install -g @odavl-studio/cli
      
      - name: Run Autopilot
        run: |
          odavl autopilot run \
            --max-files 10 \
            --max-loc 40 \
            --format json
      
      - name: Check for changes
        id: changes
        run: |
          if [ -n "$(git status --porcelain)" ]; then
            echo "has_changes=true" >> $GITHUB_OUTPUT
          fi
      
      - name: Create Pull Request
        if: steps.changes.outputs.has_changes == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: 'fix: ODAVL Autopilot fixes'
          title: '🤖 ODAVL Autopilot: Automated code quality improvements'
          body: |
            ## Autopilot Run Summary
            
            This PR contains automated fixes from ODAVL Autopilot.
            
            **Changes**:
            - Issues fixed: See commit details
            - Risk budget: Within limits
            - Verification: All quality gates passed
            
            **Safety**:
            - All changes are reversible
            - Protected paths were not modified
            - Ledger: `.odavl/ledger/run-*.json`
            
            Review and merge if changes look good.
          branch: odavl/autopilot-fixes-${{ github.run_number }}
          delete-branch: true
```

---

## PR Comment with Results

```yaml
# .github/workflows/odavl-pr-comment.yml
name: ODAVL PR Comment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  comment:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install ODAVL
        run: npm install -g @odavl-studio/cli
      
      - name: Run Analysis
        id: analysis
        run: |
          odavl insight analyze --format json > report.json
          
          # Parse results
          CRITICAL=$(jq '.summary.critical' report.json)
          HIGH=$(jq '.summary.high' report.json)
          MEDIUM=$(jq '.summary.medium' report.json)
          TOTAL=$(jq '.summary.total' report.json)
          
          echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
          echo "high=$HIGH" >> $GITHUB_OUTPUT
          echo "medium=$MEDIUM" >> $GITHUB_OUTPUT
          echo "total=$TOTAL" >> $GITHUB_OUTPUT
      
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const critical = ${{ steps.analysis.outputs.critical }};
            const high = ${{ steps.analysis.outputs.high }};
            const medium = ${{ steps.analysis.outputs.medium }};
            const total = ${{ steps.analysis.outputs.total }};
            
            const body = `## 🔍 ODAVL Quality Report
            
            | Severity | Count |
            |----------|-------|
            | 🔴 Critical | ${critical} |
            | 🟠 High | ${high} |
            | 🟡 Medium | ${medium} |
            | **Total** | **${total}** |
            
            ${critical > 0 ? '❌ **Critical issues found!** Please fix before merging.' : '✅ No critical issues detected.'}
            
            <details>
            <summary>View detailed report</summary>
            
            Download the full report from workflow artifacts.
            
            </details>
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

---

## Matrix Testing (Multiple Languages)

```yaml
# .github/workflows/odavl-matrix.yml
name: ODAVL Multi-Language Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        language: [typescript, python, java]
        include:
          - language: typescript
            setup: |
              npm ci
          - language: python
            setup: |
              pip install -r requirements.txt
          - language: java
            setup: |
              mvn install -DskipTests
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup ${{ matrix.language }}
        run: ${{ matrix.setup }}
      
      - name: Install ODAVL
        run: npm install -g @odavl-studio/cli
      
      - name: Run Analysis
        run: |
          odavl insight analyze \
            --language ${{ matrix.language }} \
            --fail-on critical
```

---

## Caching for Speed

```yaml
# Add caching to speed up repeated runs
- name: Cache ODAVL Models
  uses: actions/cache@v4
  with:
    path: ~/.odavl/ml-models
    key: odavl-models-${{ hashFiles('.odavl/config.yml') }}

- name: Cache Node Modules
  uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ hashFiles('package-lock.json') }}
```

---

## Secrets Management

```yaml
# Store ODAVL Cloud API key (optional, for cloud sync)
- name: Sync to ODAVL Cloud
  env:
    ODAVL_API_KEY: ${{ secrets.ODAVL_API_KEY }}
  run: odavl cloud sync
```

**Setup secrets**:
1. Go to repo Settings → Secrets → Actions
2. Add `ODAVL_API_KEY` (get from odavl.com/settings/api-keys)

---

## Status Checks

**Require ODAVL before merge**:

1. Go to repo Settings → Branches
2. Select branch (e.g., `main`)
3. Enable "Require status checks to pass before merging"
4. Search for "ODAVL Quality Check"
5. Save

Now PRs must pass ODAVL before merging.

---

## Composite Action (Reusable)

```yaml
# .github/actions/odavl-check/action.yml
name: 'ODAVL Quality Check'
description: 'Run ODAVL analysis with configurable options'

inputs:
  fail-on:
    description: 'Severity levels to fail on (e.g., critical,high)'
    required: false
    default: 'critical'
  language:
    description: 'Language to analyze'
    required: false
    default: 'auto'

runs:
  using: 'composite'
  steps:
    - name: Install ODAVL
      shell: bash
      run: npm install -g @odavl-studio/cli
    
    - name: Run Analysis
      shell: bash
      run: |
        odavl insight analyze \
          --fail-on ${{ inputs.fail-on }} \
          --language ${{ inputs.language }}
```

**Usage**:
```yaml
- name: Quality Check
  uses: ./.github/actions/odavl-check
  with:
    fail-on: critical,high
    language: typescript
```

---

## Resources

- **GitHub Actions Docs**: docs.github.com/actions
- **ODAVL CI/CD Guide**: odavl.com/docs/ci-cd
- **Example Workflows**: github.com/odavlstudio/examples
- **Troubleshooting**: discord.gg/odavl #ci-cd
