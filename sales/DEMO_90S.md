# ODAVL 90-Second Demo Script
**Target Duration**: 90 seconds (1:30)  
**Format**: Screen recording with voiceover  
**Audience**: Enterprise developers and engineering managers

## Pre-Recording Setup
- Clean VS Code workspace
- Terminal ready with ODAVL project
- Browser with ODAVL website open
- Stopwatch running for timing verification

## Script Timeline

**[0:00-0:10] Hook & Problem (10 seconds)**
> "Every developer knows this pain: you fix one ESLint warning, run your code, and suddenly there are three TypeScript errors. Manual code quality fixes are expensive and error-prone."

*Visual*: Show messy code with multiple ESLint warnings in VS Code

**[0:10-0:25] Solution Introduction (15 seconds)**
> "ODAVL is autonomous code quality. It continuously monitors your codebase and makes safe, automated fixes within enterprise safety constraints."

*Visual*: Show ODAVL logo/website hero section

**[0:25-0:45] Live Demo - Installation (20 seconds)**
> "Installation takes 30 seconds. Install the VS Code extension, then the CLI."

*Visual*: 
- Browser: Navigate to VS Code Marketplace, click install
- Terminal: `npm install -g @odavl/cli`
- VS Code: Show extension installed, "ODAVL: Doctor Mode" command

**[0:45-1:10] Live Demo - ODAVL Cycle (25 seconds)**
> "Watch ODAVL's Observe-Decide-Act-Verify cycle. It observes 23 ESLint warnings, decides to remove unused imports, acts automatically, then verifies the changes are safe."

*Visual*: 
- Terminal: `pnpm odavl:run`
- Show JSON output: warnings go from 23 → 0
- VS Code: Show cleaned code diff
- Terminal: Final verification passes

**[1:10-1:25] Enterprise Safety (15 seconds)**
> "Enterprise safety gates prevent breaking changes. If ODAVL ever introduces TypeScript errors or test failures, it automatically rolls back. Your production stays safe."

*Visual*: 
- Show `.odavl/gates.yml` configuration
- Terminal: Show rollback scenario (optional, if time permits)

**[1:25-1:30] Call to Action (5 seconds)**
> "Start your free pilot at odavl.studio. Autonomous code quality, enterprise-ready."

*Visual*: 
- Browser: Show odavl.studio/pilot page
- End screen with URL prominent

## Exact Commands Sequence

### Setup (Pre-demo)
```bash
# Ensure project has ESLint warnings
git checkout main
# Create sample file with unused imports and style issues
```

### Demo Commands (In Order)
```bash
# 1. Show current state
pnpm odavl:observe
# Expected output: {"eslintWarnings": 23, "typeErrors": 0, "timestamp": "..."}

# 2. Run full ODAVL cycle
pnpm odavl:run
# Expected output: 
# - Decision: "remove-unused" 
# - Action: ESLint fixes applied
# - Verification: Quality gates passed
# - Final: {"eslintWarnings": 0, "typeErrors": 0, "timestamp": "..."}

# 3. Show rollback capability (if time)
pnpm odavl:run undo
```

### Expected Outputs
```json
// Initial observation
{
  "eslintWarnings": 23,
  "typeErrors": 0,
  "timestamp": "2025-10-09T19:43:11.002Z"
}

// Post-action observation  
{
  "eslintWarnings": 0,
  "typeErrors": 0,
  "timestamp": "2025-10-09T19:43:45.123Z"
}
```

## Timing Checkpoints
- **0:10** - Problem established
- **0:25** - Solution introduced  
- **0:45** - Installation complete
- **1:10** - Core demo complete
- **1:25** - Enterprise safety covered
- **1:30** - CTA delivered

## Key Messages
1. **Pain Point**: Manual code quality is expensive
2. **Solution**: Autonomous fixes with safety
3. **Proof**: Live demo showing 23→0 warnings
4. **Trust**: Enterprise safety gates
5. **Action**: Start pilot at odavl.studio

## Success Criteria
- ✅ Demo completes in exactly 90 seconds
- ✅ All commands execute successfully 
- ✅ Key value proposition communicated
- ✅ Clear call-to-action delivered
- ✅ Professional production quality

**Next Step**: Use `sales/RECORDING_CHECKLIST.md` for production guidelines