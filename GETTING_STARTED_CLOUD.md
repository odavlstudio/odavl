# ODAVL Insight Cloud - Getting Started (5 Minutes)

> **Beta Release** - Internal testing phase  
> **Privacy First** - Zero Code Cloud (ZCC) - Only metadata, never source code

## Quick Start (3 Steps)

### 1️⃣ Install CLI

```bash
# Global installation (recommended)
npm install -g @odavl/cli

# Verify installation
odavl --version
```

### 2️⃣ Sign In to Insight Cloud

```bash
# Open browser for GitHub/Google OAuth
odavl insight auth login

# Check connection status
odavl insight auth status
```

**What happens:**
- Browser opens to Insight Cloud
- Sign in with GitHub or Google
- Session token saved securely (OS keychain on macOS/Windows)
- 30-day session (auto-refresh)

### 3️⃣ Run Your First Analysis

```bash
# Local-only analysis (no cloud)
cd /path/to/your/project
odavl insight analyze

# With cloud upload (metadata only)
odavl insight analyze --upload
```

**First Upload Consent:**
On your first `--upload`, you'll see:

```
📊 Insight Cloud - First Upload

ODAVL Insight can send analysis snapshots to the cloud for:
  • Historical tracking
  • Team collaboration
  • Trend analysis

Privacy Guarantee (ZCC - Zero Code Cloud):

We send ONLY metadata:
  ✓ Issue counts by severity
  ✓ Detector names used
  ✓ Risk scores (calculated)
  ✓ Analysis timing

We NEVER send:
  ✗ Source code
  ✗ File paths
  ✗ Error messages
  ✗ Variable names
  ✗ Any identifiable information

Full ZCC specification: https://docs.odavl.com/zcc

How to Opt-Out:
  • Don't use the --upload flag
  • Run: odavl insight auth logout
  • Set: ODAVL_NO_CLOUD=true (environment variable)

Allow cloud uploads? (y/N):
```

Type `y` and press Enter to enable cloud uploads.

---

## What Gets Analyzed?

ODAVL Insight runs **11 stable detectors** (local-only by default):

| Detector | What It Finds |
|----------|---------------|
| **TypeScript** | Type errors, `any` usage, strict mode violations |
| **Security** | Hardcoded secrets, SQL injection, XSS vulnerabilities |
| **Performance** | Blocking operations, memory leaks, inefficient loops |
| **Complexity** | High cyclomatic complexity, deep nesting |
| **Circular** | Circular dependencies between modules |
| **Import** | Unused imports, missing dependencies |
| **Package** | Outdated packages, security vulnerabilities |
| **Runtime** | Potential runtime errors, null access |
| **Build** | Build configuration issues |
| **Network** | Inefficient API calls, race conditions |
| **Isolation** | Test isolation issues, shared state |

---

## Privacy & Security (ZCC)

### Zero Code Cloud (ZCC) - Our Privacy Promise

**What We Send:**
```json
{
  "snapshotVersion": "1.0.0",
  "snapshotId": "abc123...",
  "projectName": "my-app",
  "counts": {
    "critical": 2,
    "high": 5,
    "medium": 12,
    "low": 8,
    "info": 3
  },
  "uniqueFiles": 45,
  "riskScore": 42,
  "detectorsUsed": ["typescript", "security", "performance"],
  "analysisTimeMs": 2340,
  "environment": {
    "os": "darwin",
    "nodeVersion": "v20.10.0",
    "cliVersion": "2.0.0"
  }
}
```

**What We NEVER Send:**
- ❌ Source code
- ❌ File paths (not even filenames)
- ❌ Error messages (not even snippets)
- ❌ Variable names
- ❌ Function names
- ❌ Comments
- ❌ Any string literals from your code

**Why ZCC?**
- **Privacy:** Your code stays on your machine
- **Security:** No risk of code leaks
- **Compliance:** Meets enterprise security requirements
- **Efficiency:** 95% smaller payloads (faster uploads)

### How Authentication Works

1. **Browser OAuth Flow:**
   - Click "Sign in with GitHub" or "Sign in with Google"
   - Authorize ODAVL Insight Cloud
   - Session token saved locally

2. **Token Storage:**
   - **macOS:** Keychain Access (encrypted, requires password)
   - **Windows:** Credential Manager (DPAPI encryption)
   - **Linux:** Encrypted file with AES-256-GCM

3. **Token Lifespan:**
   - 30-day sessions
   - Auto-refresh when expired
   - Manual refresh: `odavl insight auth login`

4. **Revocation:**
   ```bash
   odavl insight auth logout
   ```
   - Deletes local credentials
   - Revokes consent
   - No server-side revocation needed (stateless JWT)

---

## How to Opt-Out

### Option 1: Don't Upload
```bash
# Local-only analysis (default)
odavl insight analyze

# NO --upload flag = no cloud communication
```

### Option 2: Sign Out
```bash
# Remove credentials and consent
odavl insight auth logout
```

### Option 3: Environment Variable
```bash
# Disable cloud permanently
export ODAVL_NO_CLOUD=true

# Or in .env file
ODAVL_NO_CLOUD=true
```

### Option 4: Delete Consent File
```bash
# Manually delete consent
rm ~/.odavl/consent.json
```

---

## Common Workflows

### Local Development (No Cloud)
```bash
# Fast local analysis
odavl insight analyze --detectors typescript,security

# Export to SARIF for GitHub Code Scanning
odavl insight analyze --sarif --output report.sarif

# Generate HTML report
odavl insight analyze --html --output report.html
```

### Team Collaboration (With Cloud)
```bash
# Sign in once
odavl insight auth login

# Daily workflow
odavl insight analyze --upload

# Check cloud status
odavl insight auth status
```

### CI/CD Integration
```bash
# In .github/workflows/odavl.yml
- run: odavl insight analyze --upload --strict
  env:
    ODAVL_NO_CLOUD: false  # Explicitly enable cloud
```

---

## Troubleshooting

### "Not authenticated" Error

**Symptom:**
```
✗ Error: No auth cookie found
💡 Sign in with: odavl insight auth login
```

**Solution:**
```bash
odavl insight auth login
```

### "Session expired" Error

**Symptom:**
```
✗ Error: Session expired. Please sign in again.
```

**Solution:**
```bash
# Re-authenticate
odavl insight auth login
```

### "ZCC Violation" Error

**Symptom:**
```
✗ Error: ZCC Violation: Payload contains forbidden field 'filePath'
```

**Cause:** Internal bug in snapshot creation

**Solution:**
1. Report issue: https://github.com/odavlstudio/odavl/issues
2. Temporary workaround: Use local-only mode (remove `--upload`)

### "Cannot reach cloud server" Error

**Symptom:**
```
⚠ Offline: Cannot reach cloud server (check network connection)
```

**Causes:**
- No internet connection
- Firewall blocking requests
- Cloud backend not deployed

**Solution:**
1. Check internet connection
2. Try again in a few minutes
3. Use local-only mode: `odavl insight analyze` (no `--upload`)

---

## FAQ

### Q: Is my code sent to the cloud?
**A:** No. Only metadata (counts, scores, detector names). See [ZCC specification](#privacy--security-zcc).

### Q: Can I see what data is sent?
**A:** Yes. Run with `--debug`:
```bash
odavl insight analyze --upload --debug
```

### Q: How do I delete my data?
**A:** Contact support. We store only metadata, but you can request deletion.

### Q: Is this free?
**A:** Yes, the beta is free. Future plans:
- **Free:** 100 snapshots/month, 1 project
- **Pro:** Unlimited snapshots, unlimited projects
- **Team:** +Collaboration features

### Q: What happens if I exceed limits?
**A:** During beta, no limits enforced. After launch, uploads will be rate-limited.

### Q: Can I self-host the cloud backend?
**A:** Not yet. Enterprise self-hosting planned for Q2 2026.

### Q: Does this work offline?
**A:** Yes! Local analysis works offline. Cloud uploads require internet.

### Q: How fast is analysis?
**A:** Typical speeds:
- Small project (10 files): ~2 seconds
- Medium project (100 files): ~10 seconds
- Large project (1000 files): ~60 seconds
- Use `--file-parallel` for 4-16x speedup on large projects

---

## Next Steps

✅ **You're all set!**

### Learn More:
- [Detector Reference](./DETECTOR_REGISTRY.md) - All 11 detectors explained
- [ZCC Specification](./ZCC_SPECIFICATION.md) - Full privacy technical spec
- [CLI Reference](./CLI_REFERENCE.md) - All commands and options
- [VS Code Extension](./VSCODE_EXTENSION.md) - Real-time analysis in editor

### Join the Beta:
- GitHub Discussions: https://github.com/odavlstudio/odavl/discussions
- Report Issues: https://github.com/odavlstudio/odavl/issues
- Discord: https://discord.gg/odavl (invite-only during beta)

### Share Feedback:
We'd love to hear from you!
- What works well?
- What's confusing?
- What features do you need?

**Thank you for being an early adopter!** 🙏
