# ODAVL Studio - 90-Minute Workshop Agenda

**Duration**: 90 minutes  
**Participants**: 2-6 technical stakeholders (developers, DevOps, tech leads)  
**Pre-requisites**: Node.js 18+, Git, VS Code, repository access  

## Session Structure

### Phase 1: Context & Safety (0-10 minutes)
**Objective**: Establish ODAVL's autonomous approach and safety framework

**Topics**:
- ODAVL philosophy: Observe→Decide→Act→Verify→Learn cycle
- Safety gates: Quality thresholds, rollback protection, trust learning
- Shadow verification: Changes tested in isolation before commit
- Undo system: One-command rollback for any ODAVL changes

**Deliverable**: Participants understand autonomous vs. traditional tooling

### Phase 2: Environment Setup (10-25 minutes)
**Objective**: Install and validate ODAVL toolchain

**Activities**:
- Install ODAVL CLI: `npm install -g @odavl/cli`
- Install VS Code extension: Load provided `.vsix` file
- Verify setup: `odavl --version` and VS Code "ODAVL: Doctor Mode"
- Repository setup: Clone workshop demo repo or prepare their own

**Deliverable**: Working ODAVL installation with VS Code integration

### Phase 3: First ODAVL Cycle (25-45 minutes)
**Objective**: Run complete cycle on sample codebase with guided explanation

**Demo Flow**:
- **Observe**: `odavl observe` - show ESLint warnings, TypeScript errors
- **Decide**: `odavl decide` - explain recipe selection and trust scoring
- **Act**: `odavl act` - demonstrate autonomous fixes (eslint --fix)
- **Verify**: `odavl verify` - show quality gates validation
- **Learn**: Review generated reports and trust score updates

**Deliverable**: Completed first autonomous code improvement cycle

### Phase 4: Shadow Verify & Undo Demo (45-65 minutes)
**Objective**: Demonstrate enterprise safety features

**Activities**:
- Shadow verification walkthrough: isolated testing environment
- Evidence capture: before/after metrics with JSON reports
- Undo demonstration: `odavl undo` - instant rollback to previous state
- Safety gates validation: show what happens when gates fail

**Deliverable**: Confidence in ODAVL's safety and control mechanisms

### Phase 5: Real Repository Application (65-80 minutes)
**Objective**: Apply ODAVL to participant's actual codebase

**Process**:
- Repository selection: Choose low-risk branch or feature branch
- Initial observation: Run `odavl observe` on their code
- Governed PR creation: Generate small, controlled improvement
- Review process: Walk through PR template and approval workflow

**Deliverable**: Live ODAVL improvement on their actual code

### Phase 6: Q&A & Next Steps (80-90 minutes)
**Objective**: Address concerns and establish pilot execution plan

**Discussion Points**:
- Integration with existing CI/CD pipelines
- Scaling from pilot to team/organization adoption
- Customization options: recipes, gates, trust thresholds
- Success metrics and ROI measurement

**Deliverable**: Clear path forward for pilot program execution

## Success Criteria

- [ ] All participants successfully run complete ODAVL cycle
- [ ] At least one real repository improvement demonstrated  
- [ ] Safety mechanisms understood and validated
- [ ] Next steps and pilot timeline agreed upon