# ODAVL Configuration Directory

This directory contains configuration files for ODAVL's AI governance systems.

## 📁 Files

### `learning.yml` - Learning System Configuration
Auto-learning system that improves from user behavior and project patterns.

**Key features:**
- Pattern preferences (what to prefer/avoid)
- Trust levels for different pattern types
- Auto-adjustment based on success/failure
- Feedback loop from user actions
- Integration with existing trust scores

**Usage:**
```bash
# Enable learning mode
pnpm autopilot run --with-learning

# Check current trust scores
pnpm autopilot learning:status
```

### `immune.yml` - Immune System Configuration (Coming soon)
Protection system that guards critical resources and blocks dangerous operations.

### `riskmap.yml` - Risk Map Configuration (Coming soon)
Risk zones and automation strategies per code area.

## 🔄 Integration

These config files integrate with existing ODAVL systems:

- **`.odavl/recipes-trust.json`** - Historical trust scores
- **`.odavl/gates.yml`** - Protection rules
- **`.odavl/history.json`** - Run history
- **`.odavl/brain/`** - Project intelligence

## 📊 How Learning Works

1. **Observe**: Track outcomes of automated changes
2. **Analyze**: Calculate success rates per pattern
3. **Adjust**: Update trust scores based on results
4. **Learn**: Incorporate user feedback (undos, overrides)
5. **Improve**: Apply better patterns with higher confidence

## 🎯 Trust Score Evolution

```
Initial → Run 1 → Run 2 → Run 3 → Converged
  0.50      0.55     0.62     0.70      0.85

- Success: +0.05 per successful run
- Failure: -0.10 per failed run
- User Override: -0.15 (user knows better)
- Rollback: -0.20 (user rejected completely)
```

## 🛡️ Safety

All learning respects safety constraints:
- Never violates `gates.yml` rules
- Never exceeds risk budget
- Always requires verification
- Emergency stop at trust < 0.05

## 📝 Customization

You can customize learning per project by editing:
- `code_style.prefer` - Add preferred patterns
- `code_style.avoid` - Add patterns to avoid
- `pattern_trust.*` - Adjust initial trust levels
- `project_overrides.*` - Project-specific rules

## 🔍 Monitoring

Check learning status:
```bash
# View trust evolution
cat .odavl/brain/analytics/trust-evolution.json

# View learning logs
tail -f .odavl/logs/learning.log

# View current trust scores
pnpm autopilot learning:report
```

## 🚀 Next Steps

After learning system is working:
1. Add immune system (protection)
2. Add brain system (reasoning)
3. Add risk map (risk zones)
4. Add recipe intents (documentation)

---

**Part of ODAVL Governance Specification v1.0**
