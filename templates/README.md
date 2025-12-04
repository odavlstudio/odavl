# ODAVL Insight - CI/CD Templates

Integrate ODAVL Insight code quality analysis into your CI/CD pipelines with these ready-to-use templates.

## 📋 Available Templates

| Platform | File | Features |
|----------|------|----------|
| **GitHub Actions** | [`github-actions/odavl-insight.yml`](./github-actions/odavl-insight.yml) | PR comments, Quality gates, Artifact upload, Check runs, Scheduled analysis |
| **GitLab CI** | [`gitlab-ci/odavl-insight.yml`](./gitlab-ci/odavl-insight.yml) | MR comments, Quality gates, Artifact upload, Issue creation, Scheduled pipelines |
| **Jenkins** | [`jenkins/Jenkinsfile`](./jenkins/Jenkinsfile) | Email/Slack notifications, HTML report publishing, Quality gates, Parameterized builds |
| **CircleCI** | [`circleci/config.yml`](./circleci/config.yml) | Parallel execution, Quality gates, Artifact storage, Scheduled workflows |

---

## 🚀 Quick Start

### GitHub Actions

1. **Copy template** to your repository:

   ```bash
   mkdir -p .github/workflows
   cp templates/github-actions/odavl-insight.yml .github/workflows/
   ```

2. **Install ODAVL CLI** in your project:

   ```bash
   pnpm add -D @odavl/cli
   # or: npm install -D @odavl/cli
   # or: yarn add -D @odavl/cli
   ```

3. **Add scripts** to `package.json`:

   ```json
   {
     "scripts": {
       "odavl:insight": "odavl insight --all --format=json",
       "odavl:generate-html-report": "odavl insight --all --format=html",
       "odavl:generate-pdf-report": "odavl insight --all --format=pdf"
     }
   }
   ```

4. **Commit and push** - Analysis will run automatically on PRs and pushes!

**Result:** Every PR will get a comment like this:

```markdown
## 🟢 ODAVL Insight Analysis

**Status**: Excellent code quality!

### 📊 Summary
| Severity | Count |
|----------|-------|
| **Total Issues** | 12 |
| 🔴 **Critical** | **0** |
| 🟠 **High** | 3 |
| 🟡 **Medium** | 5 |
| 🔵 **Low** | 4 |

### ⚙️ Quality Gates
✅ Quality gates passed
- ✅ Critical issues: 0 / 10 (max)
- ✅ Total issues: 12 / 100 (max)

[Download Full Report](https://github.com/your-org/your-repo/actions/runs/123456)
```

---

### GitLab CI

1. **Copy template** to repository root:

   ```bash
   cp templates/gitlab-ci/odavl-insight.yml .gitlab-ci.yml
   ```

2. **Install ODAVL CLI** (same as GitHub Actions above)

3. **Configure CI/CD variables** (optional):
   - Go to **Settings > CI/CD > Variables**
   - Add `ODAVL_API_KEY` if using cloud features

4. **Commit and push** - Pipeline will run automatically!

**Result:** Merge requests get detailed comments with quality metrics.

---

### Jenkins

1. **Create new Pipeline job** in Jenkins:
   - Job Type: **Pipeline**
   - Definition: **Pipeline script from SCM**
   - Repository URL: `https://github.com/your-org/your-repo`
   - Script Path: `Jenkinsfile`

2. **Copy template**:

   ```bash
   cp templates/jenkins/Jenkinsfile ./Jenkinsfile
   ```

3. **Install required Jenkins plugins**:
   - Pipeline
   - NodeJS
   - HTML Publisher
   - Warnings Next Generation (optional)
   - Slack Notification (optional)

4. **Configure NodeJS** in Jenkins:
   - Manage Jenkins > Tools > NodeJS
   - Add NodeJS 20 installation (name: "Node 20")

5. **Commit and run** - Jenkins will execute the pipeline!

**Result:** Build page shows ODAVL Insight report with pass/fail status.

---

### CircleCI

1. **Copy template** to your repository:

   ```bash
   mkdir -p .circleci
   cp templates/circleci/config.yml .circleci/config.yml
   ```

2. **Install ODAVL CLI** (same as above)

3. **Enable project** in CircleCI dashboard

4. **Commit and push** - Workflow will run automatically!

**Result:** Parallel execution of analysis + reports, with quality gates.

---

## ⚙️ Configuration

### Customize Quality Gates

Edit the quality gates thresholds in your CI/CD template:

**GitHub Actions** (`odavl-insight.yml`):

```yaml
- name: 🚦 Quality Gates Check
  run: |
    CRITICAL=${{ steps.insight.outputs.critical }}
    TOTAL=${{ steps.insight.outputs.total }}
    
    # Customize thresholds here
    if [ "$CRITICAL" -gt 10 ]; then  # Change 10 to your threshold
      exit 1
    fi
    
    if [ "$TOTAL" -gt 100 ]; then    # Change 100 to your threshold
      exit 1
    fi
```

**GitLab CI** (`.gitlab-ci.yml`):

```yaml
variables:
  MAX_CRITICAL: 0      # Change to your threshold
  MAX_HIGH: 20         # Change to your threshold
  MIN_HEALTH_SCORE: 60 # Change to your threshold
```

**Jenkins** (`Jenkinsfile`):

```groovy
parameters {
  booleanParam(
    name: 'FAIL_ON_CRITICAL',
    defaultValue: true,  // Change to false to make warnings only
    description: 'Fail build if critical issues detected'
  )
}
```

---

### Customize Analysis Scope

Run specific detectors instead of all 12:

```bash
# Run only security detector
pnpm odavl:insight --security --format=json

# Run multiple detectors
pnpm odavl:insight --security --typescript --eslint --format=json

# Run all detectors (default)
pnpm odavl:insight --all --format=json
```

Available detectors:

- `--typescript` - TypeScript errors & strict mode violations
- `--eslint` - Code style & best practices
- `--security` - Hardcoded secrets, XSS, SQL injection
- `--performance` - Inefficient loops, memory leaks
- `--import` - Broken imports, circular dependencies
- `--package` - Outdated packages, security vulnerabilities
- `--runtime` - Null pointer risks, uncaught exceptions
- `--build` - Build failures, misconfigured scripts
- `--circular` - Module dependency cycles
- `--network` - Missing error handling, timeout issues
- `--complexity` - Cyclomatic complexity, code smells
- `--component-isolation` - React/Vue component violations

---

### Add Notifications

#### Slack (GitHub Actions)

Uncomment the Slack notification section in `odavl-insight.yml`:

```yaml
- name: 📱 Notify Slack
  if: failure() && github.event_name == 'push'
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🔴 ODAVL Insight found ${{ steps.insight.outputs.critical }} critical issues"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

Add `SLACK_WEBHOOK_URL` to GitHub Secrets.

#### Email (Jenkins)

Email notifications are already configured in `Jenkinsfile`:

```groovy
emailext(
  subject: "🚨 ODAVL Insight: ${env.ODAVL_CRITICAL} Critical Issue(s) Detected",
  body: "...",
  to: '${DEFAULT_RECIPIENTS}'
)
```

Configure default recipients in Jenkins system settings.

---

## 📊 Report Formats

ODAVL Insight supports multiple output formats:

| Format | Use Case | Command |
|--------|----------|---------|
| **JSON** | CI/CD parsing, automation | `--format=json --output=report.json` |
| **HTML** | Human-readable, shareable | `--format=html --output=report.html` |
| **PDF** | Executive reports, archives | `--format=pdf --output=report.pdf` |
| **Markdown** | GitHub/GitLab wikis | `--format=markdown --output=report.md` |

---

## 🔒 Security Best Practices

### Protect Secrets

Never commit API keys or tokens to your repository. Use CI/CD secrets:

- **GitHub Actions**: Settings > Secrets and variables > Actions
- **GitLab CI**: Settings > CI/CD > Variables (mark as "Masked")
- **Jenkins**: Credentials > Add Credentials
- **CircleCI**: Project Settings > Environment Variables

### Limit Permissions

Use minimal required permissions in CI/CD:

```yaml
# GitHub Actions
permissions:
  contents: read        # Read repository
  pull-requests: write  # Comment on PRs
  checks: write         # Create check runs
```

### Secure Artifacts

Reports may contain sensitive information. Set appropriate retention periods:

```yaml
# GitHub Actions
- uses: actions/upload-artifact@v4
  with:
    retention-days: 30  # Auto-delete after 30 days
```

---

## 🛠️ Troubleshooting

### "Command not found: odavl"

**Solution**: Install ODAVL CLI in your project:

```bash
pnpm add -D @odavl/cli
```

### "No results file generated"

**Solution**: Check if scripts are defined in `package.json`:

```json
{
  "scripts": {
    "odavl:insight": "odavl insight --all --format=json"
  }
}
```

### "Quality gates failed"

**Solution**: View the full report to see which issues were detected. Either:

1. Fix the issues
2. Adjust quality gate thresholds (see Configuration section above)

### "HTML report not showing in Jenkins"

**Solution**: Install **HTML Publisher** plugin:

- Manage Jenkins > Plugins > Available
- Search for "HTML Publisher"
- Install and restart Jenkins

---

## 📚 Additional Resources

- [ODAVL Insight Documentation](https://odavl.dev/docs/insight)
- [CLI Reference](https://odavl.dev/docs/cli)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=odavl.odavl-studio)
- [Troubleshooting Guide](https://odavl.dev/docs/troubleshooting)
- [Community Discord](https://discord.gg/odavl)

---

## 🤝 Contributing

Have a CI/CD platform not listed here? We'd love your contribution!

1. Fork the repository
2. Create template in `templates/<platform>/`
3. Add documentation to this README
4. Submit a Pull Request

Platforms we'd like to support:

- Azure Pipelines
- Travis CI
- Bitbucket Pipelines
- TeamCity
- Drone CI

---

## 📄 License

MIT License - See [LICENSE](../LICENSE) for details.

---

<p align="center">
  <strong>🤖 Powered by ODAVL - Autonomous Code Quality Platform</strong><br>
  <a href="https://odavl.dev">Website</a> •
  <a href="https://odavl.dev/docs">Documentation</a> •
  <a href="https://github.com/odavl/odavl">GitHub</a> •
  <a href="https://discord.gg/odavl">Discord</a>
</p>
