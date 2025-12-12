# Troubleshooting Guide

**Common issues and solutions for ODAVL users.**

---

## Installation Issues

### "Command not found: odavl"

**Symptoms**: Running `odavl` in terminal returns "command not found"

**Cause**: CLI not in PATH

**Solution**:

```bash
# Check if installed
npm list -g @odavl-studio/cli

# If installed, add to PATH
export PATH=$PATH:$(npm config get prefix)/bin

# Permanent fix (Linux/Mac)
echo 'export PATH=$PATH:$(npm config get prefix)/bin' >> ~/.bashrc
source ~/.bashrc

# Windows (PowerShell)
$env:Path += ";$(npm config get prefix)"
```

---

### "Permission denied" on install

**Symptoms**: `EACCES` error when installing globally

**Solution**:

```bash
# Option 1: Use sudo (Linux/Mac)
sudo npm install -g @odavl-studio/cli

# Option 2: Fix npm permissions (better)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Now install without sudo
npm install -g @odavl-studio/cli
```

---

## Detection Issues

### "No issues detected" (but you know there are)

**Symptoms**: Analysis returns 0 issues on codebase with obvious problems

**Cause**: Language not detected correctly

**Solution**:

```bash
# Check detected language
cat .odavl/config.yml | grep language

# Force specific language
odavl init --language typescript --force

# Or manually edit config
# .odavl/config.yml
language: typescript  # Change this
```

---

### Too many false positives

**Symptoms**: Detector flagging valid code as issues

**Solution 1: Adjust thresholds**
```yaml
# .odavl/config.yml
detectors:
  complexity:
    max_cognitive: 20  # Increase from default 15
    max_cyclomatic: 15  # Increase from default 10
```

**Solution 2: Suppression list**
```yaml
# .odavl/suppression.yml
- rule: TS001  # Suppress specific rule
  paths:
    - "tests/**"  # Only in tests directory
- rule: SEC005  # Suppress globally
```

**Solution 3: Per-file ignore**
```typescript
// In code file
// odavl-disable-next-line TS001
const anyValue: any = legacyAPI();
```

---

### Detector not running

**Symptoms**: Expected detector missing from results

**Solution**:

```bash
# List enabled detectors
odavl config get detectors

# Enable specific detector
odavl config set detectors.security.enabled true

# Or edit manually
# .odavl/config.yml
detectors:
  security:
    enabled: true
    rules: all
```

---

## Autopilot Issues

### "Autopilot made things worse"

**Symptoms**: Code broke after Autopilot run

**Solution 1: Immediate undo**
```bash
# Restore to pre-Autopilot state
odavl autopilot undo

# Or restore specific run
odavl autopilot undo --run <run-id>
```

**Solution 2: Prevent in future**
```yaml
# .odavl/gates.yml - Stricter constraints
risk_budget: 50  # Lower from 100
actions:
  max_files_per_cycle: 5  # Lower from 10
  max_loc_per_file: 20  # Lower from 40
```

**Solution 3: Review mode**
```bash
# Autopilot suggests, you approve each fix
odavl autopilot run --interactive
```

---

### "Trust scores too low, nothing executes"

**Symptoms**: Autopilot runs but says "No recipes with trust >0.8"

**Cause**: ML model being cautious (good!) or insufficient training data

**Solution 1: Lower threshold temporarily**
```bash
odavl autopilot run --trust-threshold 0.6
```

**Solution 2: Retrain model**
```bash
# Collect more data from successful fixes
odavl ml collect
odavl ml train

# Or use global model
odavl ml use-global
```

**Solution 3: Manual trust adjustment**
```yaml
# .odavl/recipes-trust.json - Boost specific recipe
{
  "recipe-unused-imports": {
    "trust": 0.9,  # Manually set
    "manual_override": true
  }
}
```

---

## Performance Issues

### Analysis taking too long

**Symptoms**: `odavl insight analyze` takes 10+ minutes

**Solution 1: Exclude unnecessary files**
```yaml
# .odavl/config.yml
exclude:
  - node_modules/**
  - dist/**
  - build/**
  - .next/**
  - coverage/**
```

**Solution 2: Run specific detectors**
```bash
# Only run fast detectors
odavl insight analyze --detectors typescript,imports
```

**Solution 3: Incremental analysis**
```bash
# Only analyze changed files
odavl insight analyze --changed

# Or specific directory
odavl insight analyze --path src/
```

---

### High memory usage

**Symptoms**: System slows down, OOM errors

**Solution**:

```bash
# Limit memory usage
NODE_OPTIONS='--max-old-space-size=4096' odavl insight analyze

# Or smaller batch size
odavl config set analysis.batch_size 50  # Default: 100
```

---

## CI/CD Issues

### GitHub Actions failing

**Symptoms**: Workflow errors with ODAVL steps

**Solution 1: Check Node version**
```yaml
# .github/workflows/odavl.yml
- uses: actions/setup-node@v4
  with:
    node-version: '20'  # Ensure 18+ (min requirement)
```

**Solution 2: Fix permissions**
```yaml
jobs:
  quality:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # Add this
      pull-requests: write  # If posting comments
```

**Solution 3: Cache dependencies**
```yaml
- name: Cache ODAVL
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ~/.odavl
    key: odavl-${{ hashFiles('package-lock.json') }}
```

---

### "Rate limit exceeded" on API

**Symptoms**: Cloud sync failing with 429 error

**Solution**:

```bash
# Use CLI-only mode (no cloud sync)
odavl config set cloud.sync false

# Or upgrade plan (higher rate limits)
# Free: 100 req/hour
# Pro: 1000 req/hour
# Enterprise: Unlimited
```

---

## VS Code Extension Issues

### Extension not detecting issues

**Symptoms**: Problems Panel empty despite known issues

**Solution 1: Reload window**
```
Ctrl+Shift+P → "Developer: Reload Window"
```

**Solution 2: Check extension enabled**
```
Ctrl+Shift+P → "Extensions: Show Installed Extensions"
Search "ODAVL" → Ensure enabled
```

**Solution 3: Force re-analysis**
```
Ctrl+Shift+P → "ODAVL: Analyze Workspace"
```

---

### "Extension causes lag"

**Symptoms**: Typing feels slow with extension active

**Solution**:

```json
// .vscode/settings.json
{
  "odavl.autoAnalyze": false,  // Disable auto-analysis
  "odavl.analysisDelay": 1000   // Increase debounce (ms)
}
```

---

## Integration Issues

### ESLint conflicts

**Symptoms**: ODAVL and ESLint reporting different issues

**Solution**:

```yaml
# .odavl/config.yml - Use ESLint as source
detectors:
  typescript:
    use_eslint: true  # Delegate to ESLint
    eslint_config: .eslintrc.json
```

---

### Prisma schema not detected

**Symptoms**: Database issues not found

**Cause**: ODAVL needs explicit database detector

**Solution**:

```bash
# Enable database detector
odavl config set detectors.database.enabled true

# Specify Prisma schema
odavl config set detectors.database.schema prisma/schema.prisma
```

---

## Data & Privacy Issues

### "Where is my data stored?"

**Answer**:

- **CLI mode**: 100% local (`.odavl/` directory)
- **Cloud mode**: Metadata only (file paths, error counts, NOT code content)
- **Extension**: Local, syncs settings only (opt-in)

**Verify**:
```bash
# Check sync status
odavl config get cloud.sync

# Disable sync
odavl config set cloud.sync false
```

---

### "Can I delete my data?"

**Answer**: Yes, two types:

```bash
# Delete local data only
rm -rf .odavl/

# Delete cloud data (account required)
odavl cloud delete-account
```

---

## Getting Help

If issue not listed here:

1. **Search docs**: odavl.com/docs
2. **Discord**: discord.gg/odavl (#troubleshooting channel)
3. **GitHub Issues**: github.com/odavlstudio/odavl/issues
4. **Email support**: support@odavl.com (Pro/Enterprise)

**When reporting issues, include**:
- ODAVL version (`odavl --version`)
- OS and Node version
- Error messages (full output)
- Config file (`.odavl/config.yml`)
- Steps to reproduce
