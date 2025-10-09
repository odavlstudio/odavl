# ODAVL Studio Workshop - 90-Minute Agenda

## Pre-Workshop Setup (5 minutes before start)
- [ ] VS Code with latest extensions
- [ ] Node.js v18+ with pnpm installed
- [ ] Git repository access (sample or client repo)
- [ ] Screen sharing and recording enabled

## Session Structure

### 0-10 minutes: Context & Safety Overview
**Objective**: Set expectations and establish safety protocols

- Welcome & introductions (2 min)
- ODAVL autonomous AI code quality overview (3 min)
- Safety gates demonstration: quality thresholds, shadow verification (3 min)
- Undo system: automatic rollback capabilities (2 min)

### 10-25 minutes: Environment Check & Installation
**Objective**: Get ODAVL running in participant's environment

- Node.js version validation (2 min)
- Repository clone and setup (5 min)
- VS Code ODAVL Doctor extension installation (3 min)
- CLI verification: `pnpm odavl:observe` test run (5 min)

### 25-45 minutes: First ODAVL Cycle - Sample Repository
**Objective**: Live demonstration on known-good sample

- Observe phase: ESLint warnings and TypeScript errors baseline (5 min)
- Decide phase: trust-based recipe selection explanation (5 min)
- Act phase: automated fix execution with real-time monitoring (5 min)
- Verify phase: shadow testing and quality gate validation (5 min)

### 45-65 minutes: Shadow Verify + Undo Demo + Evidence Capture
**Objective**: Demonstrate safety mechanisms and proof generation

- Shadow verification deep dive: isolated environment testing (7 min)
- Intentional failure scenario and automatic undo (5 min)
- Before/After evidence collection and report generation (8 min)

### 65-80 minutes: Live Run on Participant Repository
**Objective**: Real-world application with governed PR creation

- Repository analysis and risk assessment (5 min)
- Supervised ODAVL cycle execution (7 min)
- Generated PR review and safety validation (3 min)

### 80-90 minutes: Q&A + Next Steps
**Objective**: Address concerns and establish pilot timeline

- Technical questions and troubleshooting (5 min)
- Two-week pilot plan overview (3 min)
- Support contacts and escalation paths (2 min)

## Success Criteria
- [ ] ODAVL successfully installed and running
- [ ] At least one successful autonomous fix demonstrated
- [ ] Safety mechanisms (gates, shadow, undo) validated
- [ ] Evidence report generated with before/after metrics
- [ ] Participant comfortable proceeding with pilot
