# Autopilot Demo Script (120 seconds)

**Goal**: Show O-D-A-V-L cycle fixing issues autonomously

## Setup
- Workspace with 50 fixable issues
- Autopilot ready to run
- Before/after metrics prepared

## Script (120s)

**[0-20s] Opening**
"ODAVL Autopilot doesn't just detect problems - it fixes them. Watch the O-D-A-V-L cycle in action."

**[20-40s] Observe Phase**
*Run `odavl autopilot observe`*
"First, Observe analyzes the codebase. ESLint shows 50 warnings, TypeScript has 12 errors. Metrics captured."

**[40-60s] Decide Phase**
*Show recipe selection*
"Decide uses ML trust scoring. Each recipe has success rate: 0.92 (excellent), 0.78 (good), 0.45 (risky - skip)."
"Autopilot selects 'Remove unused imports' - trust score 0.94, fixes 18 files safely."

**[60-85s] Act Phase**
*Show parallel execution*
"Act executes in parallel. Before any change, snapshot saved. Watch files update... 18 files cleaned."

**[85-105s] Verify Phase**
*Show quality gates*
"Verify re-runs checks. TypeScript: 0 errors. ESLint: 32 warnings (down from 50). Quality gates passed."

**[105-120s] Learn Phase + Results**
"Learn updates trust scores. Recipe succeeded → trust goes from 0.94 to 0.96."
"40% faster reviews, all changes reversible. Try odavl.com"
