# ODAVL Core - Autonomous Code Quality Agent

## 🎯 Vision & Mission

**Mission Statement:**  
ODAVL Core is an autonomous code quality agent that operates in a continuous 5-phase loop (Observe → Decide → Act → Verify → Learn) to automatically detect, prioritize, fix, and learn from code quality issues without manual intervention.

**Vision:**  
Transform software development by creating the first truly autonomous code improvement system that learns from every action, adapts to team preferences, and consistently improves code quality while maintaining safety and transparency.

---

## 🏗️ Architecture Overview

### The ODAVL Loop (5-Phase Cycle)

```
┌─────────────┐
│  OBSERVE    │ ──► Detect issues using ODAVL Insight detectors
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  DECIDE     │ ──► Select best recipe based on trust scores
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  ACT        │ ──► Execute recipe with safety guards + undo
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  VERIFY     │ ──► Re-run checks, enforce gates, attest
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  LEARN      │ ──► Update trust scores, improve recipes
└──────┬──────┘
       │
       └──► Loop back to OBSERVE
```

---

## 🎯 Key Objectives

### Primary Goals

1. **Autonomous Operation**: Run continuously without human intervention
2. **Safety First**: Never break working code (risk budget, undo, gates)
3. **Learning System**: Improve recipe selection through trust scoring
4. **Transparency**: Complete audit trail of all changes
5. **Integration**: Seamless integration with existing workflows

### Success Metrics

- **Fix Rate**: 80%+ of detected issues fixed automatically
- **Safety**: 0% breaking changes (all protected by undo)
- **Trust**: Recipe trust scores converge to 0.8+ after 10 runs
- **Performance**: Complete cycle in < 5 minutes for typical codebase
- **Adoption**: 100+ teams using Core in production by end of Year 1

---

## 📋 Development Roadmap

### **Week 1: OBSERVE Phase Implementation**

#### Objectives

- Replace stub `observe()` function with real detection
- Integrate all 12 ODAVL Insight detectors
- Save metrics to `.odavl/metrics/`
- Ensure accurate issue counts

#### Tasks

```typescript
// File: apps/cli/src/phases/observe.ts

// Current State (stub):
export function observe(..._args: any[]): Metrics {
    return {
        eslintWarnings: 0,  // ❌ Always 0!
        typeErrors: 0,      // ❌ Always 0!
        timestamp: new Date().toISOString(),
    };
}

// Target State (real detection):
import { runAllDetectors } from '@odavl/insight-core';

export async function observe(targetDir: string): Promise<Metrics> {
    const results = await runAllDetectors(targetDir);
    
    const metrics: Metrics = {
        typescript: results.typescript || 0,
        eslint: results.eslint || 0,
        security: results.security || 0,
        performance: results.performance || 0,
        complexity: results.complexity || 0,
        runtime: results.runtime || 0,
        build: results.build || 0,
        isolation: results.isolation || 0,
        circular: results.circular || 0,
        network: results.network || 0,
        imports: results.imports || 0,
        packages: results.packages || 0,
        timestamp: new Date().toISOString(),
    };
    
    // Save metrics
    await saveMetrics(metrics);
    
    return metrics;
}
```

#### Deliverables

- ✅ Real metrics from all 12 detectors
- ✅ Metrics saved to `.odavl/metrics/run-{timestamp}.json`
- ✅ Test command: `pnpm odavl:observe`
- ✅ Expected output: "Found 20 issues" (not 0)

#### Testing Criteria

```bash
# Test 1: Run observe on apps/cli
pnpm odavl:observe --target=apps/cli

# Expected output:
# ✅ TypeScript issues: 3
# ✅ ESLint warnings: 8
# ✅ Security issues: 2
# ✅ Performance suggestions: 3
# ✅ Total: 16 issues detected

# Test 2: Verify metrics file created
ls .odavl/metrics/
# Should show: run-2025-01-09T10-30-00.json

# Test 3: Validate metrics structure
cat .odavl/metrics/run-*.json
# Should be valid JSON with all detector results
```

---

### **Week 2: DECIDE + ACT Phases**

#### Objectives

- Create recipe system with JSON-based recipes
- Implement recipe selection logic (trust score based)
- Build ACT phase with undo snapshot system
- Enforce risk budget constraints

#### Recipe System Design

**Recipe Structure:**

```json
{
    "id": "fix-eslint-warnings",
    "name": "Auto-fix ESLint Warnings",
    "description": "Automatically fixes ESLint warnings using eslint --fix",
    "version": "1.0.0",
    "trust": 0.8,
    "successCount": 12,
    "failureCount": 3,
    "conditions": {
        "eslint": { "min": 1 }
    },
    "actions": [
        {
            "type": "shell",
            "command": "pnpm eslint . --fix",
            "description": "Run ESLint auto-fix"
        }
    ],
    "safety": {
        "maxFiles": 10,
        "maxLinesPerFile": 40,
        "protectedPaths": ["security/**", "**/*.spec.*"]
    }
}
```

**Initial Recipes (5 core recipes):**

1. `fix-eslint-warnings.json` - ESLint auto-fix
2. `fix-import-order.json` - Organize imports
3. `remove-unused-imports.json` - Clean unused imports
4. `fix-typescript-simple.json` - Simple TS fixes (add types)
5. `optimize-performance.json` - Apply performance optimizations

#### Recipe Selection Algorithm

```typescript
// File: apps/cli/src/core/recipe-selector.ts

export async function selectBestRecipe(
    metrics: Metrics,
    recipes: Recipe[]
): Promise<Recipe | null> {
    // 1. Filter recipes by conditions
    const eligible = recipes.filter(recipe => 
        meetsConditions(recipe.conditions, metrics)
    );
    
    // 2. Sort by trust score (highest first)
    eligible.sort((a, b) => b.trust - a.trust);
    
    // 3. Check blacklist (trust < 0.2 or 3 consecutive failures)
    const notBlacklisted = eligible.filter(recipe => 
        recipe.trust >= 0.2 && !isBlacklisted(recipe.id)
    );
    
    // 4. Return highest trust recipe
    return notBlacklisted[0] || null;
}
```

#### ACT Phase Implementation

```typescript
// File: apps/cli/src/phases/act.ts

export async function act(
    recipe: Recipe,
    ctx: PhaseContext
): Promise<PhaseContext> {
    // 1. Save undo snapshot BEFORE any changes
    const snapshot = await saveUndoSnapshot(ctx);
    
    // 2. Check risk budget
    const riskGuard = new RiskBudgetGuard(recipe.safety);
    if (!riskGuard.canProceed()) {
        throw new Error('Risk budget exceeded');
    }
    
    // 3. Execute recipe actions
    for (const action of recipe.actions) {
        const result = await executeAction(action);
        
        if (!result.success) {
            // Rollback on failure
            await restoreSnapshot(snapshot);
            throw new Error(`Action failed: ${result.error}`);
        }
        
        ctx.edits.push({
            action: action.description,
            result: result.output
        });
    }
    
    // 4. Record ledger
    await saveLedger(ctx);
    
    return ctx;
}
```

#### Deliverables

- ✅ 5 core recipes in `.odavl/recipes/`
- ✅ Recipe selector with trust scoring
- ✅ ACT phase with undo system
- ✅ Risk budget enforcement
- ✅ Test command: `pnpm odavl:decide && pnpm odavl:act`

#### Testing Criteria

```bash
# Test 1: Recipe selection
pnpm odavl:decide --target=apps/cli

# Expected output:
# ✅ Found 5 eligible recipes
# ✅ Selected: fix-eslint-warnings (trust: 0.8)
# ✅ Reason: 8 ESLint warnings detected

# Test 2: Execute recipe
pnpm odavl:act --recipe=fix-eslint-warnings

# Expected output:
# ✅ Undo snapshot created: .odavl/undo/2025-01-09-10-30-00.json
# ✅ Running: pnpm eslint . --fix
# ✅ Modified 3 files
# ✅ Ledger saved: .odavl/ledger/run-abc123.json

# Test 3: Verify undo works
pnpm odavl:undo --snapshot=2025-01-09-10-30-00

# Expected output:
# ✅ Restored 3 files from snapshot
# ✅ Rollback complete
```

---

### **Week 3: VERIFY + LEARN Phases**

#### Objectives

- Implement VERIFY phase (re-run checks, compare metrics)
- Enforce gates.yml policies
- Generate attestations for successful improvements
- Build LEARN phase (update trust scores)
- Complete full loop integration

#### VERIFY Phase Implementation

```typescript
// File: apps/cli/src/phases/verify.ts

export async function verify(ctx: PhaseContext): Promise<PhaseContext> {
    // 1. Re-run observe to get new metrics
    const afterMetrics = await observe(ctx.targetDir);
    
    // 2. Compare before/after
    const improvement = calculateImprovement(
        ctx.metrics, // before
        afterMetrics  // after
    );
    
    // 3. Check gates.yml policies
    const gates = await loadGates('.odavl/gates.yml');
    const gatesPassed = enforceGates(gates, afterMetrics);
    
    if (!gatesPassed) {
        // Rollback if gates failed
        await restoreSnapshot(ctx.undoSnapshot);
        throw new Error('Gates failed - changes rolled back');
    }
    
    // 4. Generate attestation if improved
    if (improvement.improved) {
        const attestation = await generateAttestation({
            recipeId: ctx.recipe.id,
            beforeMetrics: ctx.metrics,
            afterMetrics: afterMetrics,
            improvement: improvement,
            timestamp: new Date().toISOString()
        });
        
        await saveAttestation(attestation);
    }
    
    ctx.verification = {
        improved: improvement.improved,
        gatesPassed: gatesPassed,
        attestation: improvement.improved ? attestation : null
    };
    
    return ctx;
}
```

#### LEARN Phase Implementation

```typescript
// File: apps/cli/src/phases/learn.ts

export async function learn(ctx: PhaseContext): Promise<PhaseContext> {
    // 1. Load recipe trust data
    const trustData = await loadTrustData('.odavl/recipes-trust.json');
    
    // 2. Update trust score based on outcome
    const recipe = ctx.recipe;
    const success = ctx.verification.improved && ctx.verification.gatesPassed;
    
    if (success) {
        recipe.successCount++;
    } else {
        recipe.failureCount++;
    }
    
    // 3. Calculate new trust score
    const totalRuns = recipe.successCount + recipe.failureCount;
    recipe.trust = Math.max(0.1, Math.min(1.0, 
        recipe.successCount / totalRuns
    ));
    
    // 4. Check for blacklisting
    if (recipe.trust < 0.2 || hasConsecutiveFailures(recipe, 3)) {
        await blacklistRecipe(recipe.id);
    }
    
    // 5. Save updated trust data
    await saveTrustData(trustData);
    
    // 6. Update history.json
    await appendToHistory({
        timestamp: new Date().toISOString(),
        recipeId: recipe.id,
        success: success,
        trustScore: recipe.trust,
        improvement: ctx.verification.improvement
    });
    
    ctx.learning = {
        trustUpdated: true,
        newTrustScore: recipe.trust,
        blacklisted: recipe.trust < 0.2
    };
    
    return ctx;
}
```

#### Full Loop Integration

```typescript
// File: apps/cli/src/core/odavl-loop.ts

export async function runOdavlLoop(targetDir: string): Promise<void> {
    let ctx: PhaseContext = {
        targetDir,
        metrics: null,
        recipe: null,
        edits: [],
        verification: null,
        learning: null
    };
    
    try {
        // Phase 1: OBSERVE
        console.log('🔍 [OBSERVE] Detecting issues...');
        ctx.metrics = await observe(targetDir);
        console.log(`   Found ${getTotalIssues(ctx.metrics)} issues`);
        
        // Phase 2: DECIDE
        console.log('🤔 [DECIDE] Selecting recipe...');
        const recipes = await loadRecipes('.odavl/recipes/');
        ctx.recipe = await selectBestRecipe(ctx.metrics, recipes);
        
        if (!ctx.recipe) {
            console.log('   No eligible recipes found');
            return;
        }
        console.log(`   Selected: ${ctx.recipe.name} (trust: ${ctx.recipe.trust})`);
        
        // Phase 3: ACT
        console.log('⚡ [ACT] Executing recipe...');
        ctx = await act(ctx.recipe, ctx);
        console.log(`   Modified ${ctx.edits.length} files`);
        
        // Phase 4: VERIFY
        console.log('✅ [VERIFY] Checking results...');
        ctx = await verify(ctx);
        
        if (ctx.verification.improved) {
            console.log('   ✅ Improvement verified!');
            console.log(`   Attestation: ${ctx.verification.attestation.hash}`);
        } else {
            console.log('   ❌ No improvement - rolling back');
        }
        
        // Phase 5: LEARN
        console.log('🧠 [LEARN] Updating trust scores...');
        ctx = await learn(ctx);
        console.log(`   New trust score: ${ctx.learning.newTrustScore}`);
        
        console.log('\n✨ ODAVL Loop completed successfully!');
        
    } catch (error) {
        console.error('❌ ODAVL Loop failed:', error.message);
        
        // Restore from snapshot if available
        if (ctx.undoSnapshot) {
            console.log('⏮️  Rolling back changes...');
            await restoreSnapshot(ctx.undoSnapshot);
        }
        
        throw error;
    }
}
```

#### Deliverables

- ✅ VERIFY phase with before/after comparison
- ✅ Gates enforcement (`.odavl/gates.yml`)
- ✅ Attestation generation (SHA-256 proofs)
- ✅ LEARN phase with trust score updates
- ✅ Full loop integration (O→D→A→V→L)
- ✅ Test command: `pnpm odavl:run`

#### Testing Criteria

```bash
# Test 1: Full loop execution
pnpm odavl:run --target=apps/cli

# Expected output:
# 🔍 [OBSERVE] Detecting issues...
#    Found 16 issues
# 🤔 [DECIDE] Selecting recipe...
#    Selected: fix-eslint-warnings (trust: 0.8)
# ⚡ [ACT] Executing recipe...
#    Modified 3 files
# ✅ [VERIFY] Checking results...
#    ✅ Improvement verified!
#    Attestation: sha256:abc123...
# 🧠 [LEARN] Updating trust scores...
#    New trust score: 0.83
# ✨ ODAVL Loop completed successfully!

# Test 2: Verify attestation created
ls .odavl/attestation/
# Should show: run-abc123-attestation.json

# Test 3: Verify trust score updated
cat .odavl/recipes-trust.json
# Should show updated trust score for fix-eslint-warnings

# Test 4: Verify history updated
cat .odavl/history.json
# Should show new entry with success=true
```

---

## 🛡️ Safety Mechanisms

### Triple-Layer Safety System

#### 1. Risk Budget Guard

```typescript
// Max constraints per cycle
const RISK_BUDGET = {
    maxFiles: 10,          // Max 10 files modified per cycle
    maxLinesPerFile: 40,   // Max 40 LOC changed per file
    protectedPaths: [
        'security/**',
        '**/*.spec.*',
        '**/*.test.*',
        'public-api/**',
        'auth/**'
    ]
};
```

#### 2. Undo System

- Automatic snapshot before ANY file modification
- Timestamped snapshots in `.odavl/undo/`
- `latest.json` always points to most recent
- One-command rollback: `pnpm odavl:undo`

#### 3. Governance Gates

```yaml
# .odavl/gates.yml
risk_budget: 100
forbidden_paths:
  - security/**
  - public-api/**
actions:
  max_auto_changes: 10
enforcement:
  - block_if_risk_exceeded
  - rollback_on_failure
  - require_attestation
thresholds:
  max_risk_per_action: 25
  min_success_rate: 0.75
```

---

## 📊 Success Metrics

### Technical Metrics

- **Fix Rate**: % of detected issues successfully fixed
- **Safety**: % of cycles with zero rollbacks
- **Trust Convergence**: Time for recipes to reach 0.8+ trust
- **Cycle Time**: Average time for full O→D→A→V→L cycle
- **Attestation Rate**: % of cycles producing valid attestations

### Business Metrics

- **Adoption Rate**: Teams using Core in production
- **Time Saved**: Developer hours saved per week
- **Code Quality**: Reduction in production bugs
- **Developer Satisfaction**: NPS score from users

### Target KPIs (End of Week 3)

```
✅ Fix Rate: 80%+
✅ Safety: 100% (zero breaking changes)
✅ Cycle Time: < 5 minutes
✅ Trust Scores: 0.7+ average across all recipes
✅ Test Coverage: 90%+
```

---

## 🔌 Integration Points

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run ODAVL Core
  run: pnpm odavl:run --target=.
  
- name: Commit improvements
  if: success()
  run: |
    git config user.name "ODAVL Bot"
    git commit -am "chore: ODAVL Core improvements"
    git push
```

### VS Code Extension Integration

- Real-time loop status in status bar
- Dashboard showing last cycle results
- Manual trigger from command palette
- Ledger viewer for audit trail

### API Integration (Future)

```typescript
// REST API for remote execution
POST /api/v1/core/run
{
    "repository": "github.com/org/repo",
    "target": "apps/cli",
    "config": { ... }
}
```

---

## 🎯 Post-Launch Roadmap

### Month 1-3: Stability & Learning

- Monitor recipe performance in production
- Add 10 more recipes based on user feedback
- Improve trust scoring algorithm
- Add ML-powered recipe recommendation

### Month 4-6: Advanced Features

- Multi-repository support
- Parallel recipe execution
- Custom recipe creation UI
- Team collaboration features

### Month 7-12: Enterprise Features

- Private recipe marketplace
- Compliance reporting
- Advanced governance controls
- On-premise deployment option

---

## 💼 Market Strategy

### Target Audience

1. **Primary**: Development teams with 5-50 developers
2. **Secondary**: Large enterprises (50+ developers)
3. **Tertiary**: Individual developers (free tier)

### Pricing

- **Starter**: $199/mo - 3 repositories, 50 fixes/month
- **Pro**: $499/mo - 10 repositories, unlimited fixes
- **Enterprise**: $999/mo - Unlimited repos, priority support

### Competitive Advantage

- **Only** truly autonomous code fixing system
- **Only** system with learning/trust scoring
- **Only** system with cryptographic attestations
- Complete safety guarantees (undo + risk budget)

---

## 📚 Documentation Requirements

### User Documentation

- ✅ Quick Start Guide
- ✅ Recipe Creation Guide
- ✅ Configuration Reference
- ✅ Safety Best Practices
- ✅ Troubleshooting Guide

### Developer Documentation

- ✅ Architecture Deep Dive
- ✅ API Reference
- ✅ Contributing Guide
- ✅ Recipe Development Kit
- ✅ Testing Guide

---

## 🚀 Launch Checklist

### Technical Readiness

- [ ] All 5 phases working correctly
- [ ] 90%+ test coverage
- [ ] Zero known critical bugs
- [ ] Performance benchmarks met
- [ ] Security audit completed

### Product Readiness

- [ ] Documentation complete
- [ ] Video tutorials recorded
- [ ] Landing page live
- [ ] Pricing page finalized
- [ ] Beta users onboarded (10+ teams)

### Marketing Readiness

- [ ] Launch blog post written
- [ ] Social media scheduled
- [ ] Product Hunt submission ready
- [ ] Email campaign prepared
- [ ] Press kit available

---

## 📞 Contact & Support

**Project Lead**: ODAVL Team  
**Email**: <core@odavl.com>  
**Docs**: <https://docs.odavl.com/core>  
**Status**: <https://status.odavl.com>

---

*Last Updated: January 9, 2025*  
*Version: 1.0.0*  
*Status: In Development (Week 1-3)*
