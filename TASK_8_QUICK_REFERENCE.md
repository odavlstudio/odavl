# TASK 8: Beta Onboarding - Quick Reference

## Commands

```bash
# Sign in (opens browser)
odavl insight auth login

# Check connection status
odavl insight auth status
odavl insight auth status --json

# Sign out (clears credentials + consent)
odavl insight auth logout

# First upload (triggers consent prompt)
odavl insight analyze --upload

# Subsequent uploads (silent)
odavl insight analyze --upload --debug
```

## Opt-Out Methods

| Method | Command | Effect |
|--------|---------|--------|
| Don't upload | `odavl insight analyze` | No --upload flag |
| Sign out | `odavl insight auth logout` | Deletes credentials |
| Environment | `export ODAVL_NO_CLOUD=true` | Blocks all uploads |
| Delete consent | `rm ~/.odavl/consent.json` | Requires re-consent |

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `apps/studio-cli/src/commands/insight-auth.ts` | Auth commands | 384 |
| `apps/studio-cli/src/utils/consent-manager.ts` | Consent system | 254 |
| `GETTING_STARTED_CLOUD.md` | 5-min guide | 350 |
| `ZCC_SPECIFICATION.md` | Privacy spec | 600+ |

## Files Modified

| File | Change | Lines |
|------|--------|-------|
| `apps/studio-cli/src/index.ts` | Add auth commands | +3 |
| `apps/studio-cli/src/utils/snapshot-uploader.ts` | Real auth tokens | +20 |
| `apps/studio-cli/src/commands/insight-v2.ts` | Consent check | +15 |

## Token Storage

| Platform | Method | Location |
|----------|--------|----------|
| macOS | Keychain Access | System keychain |
| Windows | Credential Manager | DPAPI encrypted |
| Linux | Encrypted file | `~/.odavl/credentials.enc` |

## Build Status

```bash
✓ TypeScript compilation: PASS
✓ CLI build: PASS (4.13 MB)
✓ No errors or warnings
```

## Testing Checklist

- [ ] Deploy cloud backend (TASK 6)
- [ ] Create GitHub OAuth app
- [ ] Create Google OAuth client
- [ ] Test: `odavl insight auth login`
- [ ] Test: First upload consent
- [ ] Test: Subsequent uploads (no prompt)
- [ ] Test: `odavl insight auth logout`
- [ ] Test: `ODAVL_NO_CLOUD=true` opt-out
- [ ] Verify token expiration handling
- [ ] Verify ZCC payload structure

## What's Sent to Cloud (ZCC)

```json
{
  "counts": { "critical": 2, "high": 5, ... },
  "riskScore": 42,
  "detectorsUsed": ["typescript", "security"],
  "analysisTimeMs": 2340,
  "environment": { "os": "darwin", "nodeVersion": "v20", ... }
}
```

**NOT sent:** source code, file paths, error messages, variable names

## Success Metrics

| Metric | Target |
|--------|--------|
| Beta signups | 50+ users |
| Consent rate | >80% |
| Auth success | >95% |
| Friction points | <5 reported |
| ZCC violations | 0 |

## Next Actions

1. **Deploy cloud backend** → Update `DEFAULT_CLOUD_URL`
2. **Create OAuth apps** → Add credentials to Vercel
3. **Test end-to-end** → Verify full flow
4. **Announce beta** → Share Getting Started guide
5. **Monitor usage** → Track metrics above

## Documentation

- [Getting Started (5 min)](./GETTING_STARTED_CLOUD.md)
- [ZCC Specification](./ZCC_SPECIFICATION.md)
- [Full Summary](./TASK_8_BETA_ONBOARDING_SUMMARY.md)

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Browser OAuth (not CLI) | Lower friction, uses existing sessions |
| NextAuth (not custom) | Standard, secure, well-tested |
| Consent on first upload (not login) | Less scary, user sees value first |
| Silent by default | Professional UX, errors only when needed |
| Multiple opt-outs | User control, privacy respect |

---

**Status:** ✅ CLI Complete, ⏳ Cloud deployment pending  
**Date:** December 13, 2025  
**Time:** ~3 hours
