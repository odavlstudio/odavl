# Migration Guide: From SonarQube to ODAVL

**Goal**: Transition from SonarQube to ODAVL with minimal disruption.

---

## Why Migrate?

| Feature | SonarQube | ODAVL |
|---------|-----------|-------|
| **Detection** | ✅ Excellent | ✅ Excellent |
| **Auto-Fix** | ❌ None | ✅ ML-powered |
| **Speed** | Slow (5-10 min) | Fast (30s-2 min) |
| **Setup** | Complex (server) | Simple (CLI) |
| **Languages** | 25+ | 8 (growing) |
| **Cost** | $12K+/year | $348/year |

**Bottom line**: ODAVL is faster, cheaper, and fixes issues (not just detects).

---

## Side-by-Side Comparison

### Detection Coverage

**SonarQube Quality Gates**:
- Bugs
- Vulnerabilities
- Code Smells
- Coverage
- Duplications

**ODAVL Detectors** (16+):
- TypeScript/JavaScript
- Security (Snyk-like)
- Performance
- Complexity
- Circular dependencies
- Imports
- Package health
- Runtime errors
- Build issues
- Network patterns
- Test isolation
- **+ Autopilot fixes**

**Verdict**: Similar coverage, ODAVL adds auto-fixing.

---

## Migration Steps

### Phase 1: Parallel Run (Week 1)

Keep SonarQube, add ODAVL.

**Install ODAVL**:
```bash
npm install -g @odavl-studio/cli
odavl init
```

**Run both**:
```bash
# SonarQube (keep existing)
sonar-scanner

# ODAVL (new, parallel)
odavl insight analyze
```

**Compare reports**: Which tool finds what?

---

### Phase 2: Configure ODAVL (Week 2)

**Map SonarQube rules to ODAVL**:

```yaml
# .odavl/config.yml - Match SonarQube quality gate
thresholds:
  security:
    critical: 0  # SonarQube: blocker
    high: 5      # SonarQube: critical
  complexity:
    max_cognitive: 15  # SonarQube default
  coverage:
    min_percentage: 80  # SonarQube gate
```

**Import SonarQube exclusions**:
```yaml
# sonar-project.properties
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.test.ts

# → .odavl/config.yml
exclude:
  - node_modules/**
  - dist/**
  - "**/*.test.ts"
```

---

### Phase 3: Train Team (Week 3)

**Onboarding checklist**:

- [ ] Install CLI for all devs
- [ ] Install VS Code extension (optional)
- [ ] Run first scan together (Zoom/Slack huddle)
- [ ] Show auto-fix with Autopilot
- [ ] Explain undo/rollback
- [ ] Add to pre-commit hooks

**Demo script** (15 min):
```bash
# 1. Show detection (2 min)
odavl insight analyze

# 2. Show AI fix suggestion (3 min)
odavl insight fix --issue TS001

# 3. Show autonomous fix (5 min)
odavl autopilot run --max-files 3

# 4. Show undo (2 min)
odavl autopilot undo

# 5. Q&A (3 min)
```

---

### Phase 4: CI/CD Integration (Week 4)

**SonarQube CI**:
```yaml
# Before
- name: SonarQube Scan
  run: sonar-scanner
```

**ODAVL CI** (add alongside):
```yaml
# After (parallel)
- name: ODAVL Quality Check
  run: |
    npm install -g @odavl-studio/cli
    odavl insight analyze --fail-on critical,high
```

**Gradually shift weight**:
- Week 4: Both run, SonarQube blocks deploys
- Week 5-6: Both run, ODAVL blocks deploys
- Week 7: Remove SonarQube

---

### Phase 5: Full Cutover (Week 8)

**Remove SonarQube**:
```bash
# Delete SonarQube config
rm sonar-project.properties

# Remove from CI
# (delete SonarQube step from workflows)

# Cancel subscription
# (SonarQube admin panel)
```

**ODAVL becomes primary**:
```yaml
# .github/workflows/quality.yml
- name: Code Quality Gate
  run: odavl insight analyze --fail-on critical
```

---

## Feature Mapping

### SonarQube → ODAVL Equivalents

| SonarQube Feature | ODAVL Equivalent |
|-------------------|------------------|
| Quality Gate | `.odavl/gates.yml` |
| Quality Profile | `.odavl/config.yml` detectors |
| Issues Dashboard | `odavl dashboard` or Cloud Console |
| Pull Request Decoration | GitHub App (coming Q2) |
| Security Hotspots | `odavl insight report --detector security` |
| Code Coverage | Integrated (vitest/jest) |
| Duplications | `odavl insight report --detector duplication` |
| Technical Debt | Autopilot cleaning |

---

## Cost Comparison

### SonarQube Enterprise

- **Pricing**: $12,000/year (10 devs)
- **Server costs**: $200/month (AWS EC2)
- **Maintenance**: 4 hrs/month ($200 eng time)
- **Total**: ~$15K/year

### ODAVL Pro

- **Pricing**: $29/user/month × 10 = $290/month
- **Server costs**: $0 (cloud included, or self-hosted free)
- **Maintenance**: 0 hrs (fully managed)
- **Total**: ~$3,500/year

**Savings**: $11,500/year (77% reduction)

---

## Migration Checklist

**Before Migration**:
- [ ] Export SonarQube rules and thresholds
- [ ] Document current quality gate settings
- [ ] Backup SonarQube historical data (optional)
- [ ] Get team buy-in (demo ODAVL)

**During Migration** (8 weeks):
- Week 1: [ ] Parallel run (SonarQube + ODAVL)
- Week 2: [ ] Configure ODAVL to match SonarQube
- Week 3: [ ] Team training and onboarding
- Week 4: [ ] Add ODAVL to CI/CD (alongside SonarQube)
- Week 5-6: [ ] Shift quality gate to ODAVL
- Week 7: [ ] Monitoring period (ODAVL only)
- Week 8: [ ] Remove SonarQube completely

**After Migration**:
- [ ] Monitor false positive rate (first 30 days)
- [ ] Tune detector thresholds
- [ ] Enable Autopilot (after trust established)
- [ ] Add Guardian for pre-deploy checks

---

## FAQs

**Q: Can ODAVL analyze as many languages as SonarQube?**  
A: Not yet. ODAVL supports 8 languages (TypeScript, Python, Java, Go, Rust, Ruby, PHP, JavaScript). SonarQube has 25+. We're adding more quarterly.

**Q: What about SonarQube's historical data?**  
A: ODAVL doesn't import SonarQube history. Start fresh. Historical trends rebuild in 30-60 days.

**Q: Does ODAVL have a UI like SonarQube?**  
A: Yes. Cloud Console (web dashboard) or local dashboard (`odavl dashboard`). Less feature-rich than SonarQube but improving fast.

**Q: Can I run ODAVL on-premise like SonarQube?**  
A: Yes. Enterprise plan includes self-hosted option. CLI is always local-first.

**Q: What if ODAVL doesn't detect something SonarQube does?**  
A: Report it: github.com/odavlstudio/odavl/issues. We prioritize gaps in coverage. Custom detectors coming Q3 2025.

---

## Support During Migration

**Need help?** We offer free migration assistance:

- **Migration call** (60 min): Book at odavl.com/migrate
- **Slack channel**: Direct line to eng team
- **Custom rules**: We'll help port SonarQube rules
- **Training**: Free team onboarding session

Contact: migrate@odavl.com
