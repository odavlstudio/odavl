# ODAVL Operating Agreement
**Copilot Autonomous Mode Governance | Version 1.0**

## Core Process: ODAVL Cycle

Every autonomous session follows the structured **Observe → Decide → Act → Verify → Learn** cycle:

### 1. OBSERVE
- **Action**: Deep repository analysis and evidence gathering
- **Deliverable**: `reports/observations/<task-id>.json` with structured findings
- **Output**: Comprehensive assessment of current state, gaps, and opportunities
- **Duration**: As long as needed for complete understanding

### 2. DECIDE
- **Action**: Generate A/B strategic options with pros/cons analysis
- **Deliverable**: `reports/decisions/<task-id>.md` with evidence-based recommendations
- **Output**: Clear strategic choices with implementation paths
- **Approval**: Human decision required (`APPROVED: <option>` confirmation)

### 3. ACT
- **Action**: Execute approved changes within safety constraints
- **Constraints**: ≤40 lines changed, ≤10 files modified, no destructive operations
- **Branch**: Create feature branch with appropriate prefix (core-*/web-*)
- **Output**: Pull Request with targeted, safe modifications

### 4. VERIFY
- **Action**: Validate changes through testing and quality checks
- **Tests**: Build success, type checking, linting, functionality verification
- **Deliverable**: Verification report confirming success metrics
- **Gate**: All checks must pass before human review request

### 5. LEARN
- **Action**: Document outcomes and update patterns
- **Deliverable**: `reports/learning/<task-id>.md` with insights and improvements
- **Purpose**: Continuous improvement of autonomous decision-making
- **Storage**: Update `.copilot/knowledge-base.json` with new patterns

## Safety Constraints

### Protected Paths (NEVER MODIFY)
- `/security/` - Security configurations and secrets
- `**/*.spec.*` - Test files and specifications
- `/public-api/` - Public API contracts
- `.git/` - Version control internals

### Change Limits (PER BATCH)
- **Lines**: Maximum 40 lines changed total
- **Files**: Maximum 10 files modified
- **Operations**: No destructive operations (no file deletion, no breaking changes)
- **Scope**: Stay within assigned profile boundaries (core vs website)

### Branch Strategy
- **Core Profile**: `odavl/core-<task>-<YYYYMMDD>`
- **Website Profile**: `odavl/web-<task>-<YYYYMMDD>`
- **Emergency**: `odavl/hotfix-<issue>-<YYYYMMDD>`

## Human Interaction Points

### Required Approvals
1. **Strategic Decision**: After DECIDE phase, human must confirm option
2. **Pull Request**: After ACT phase, human LGTM required for merge
3. **Major Changes**: Any breaking changes require explicit human design

### Optional Consultations
- **Technical Questions**: Can request human input during OBSERVE
- **Ambiguous Requirements**: Can ask for clarification during DECIDE
- **Risk Assessment**: Can escalate high-risk scenarios for review

## Quality Gates

### Pre-Act Validation
- [ ] All constraints verified (≤40 lines, ≤10 files)
- [ ] No protected paths affected
- [ ] Human approval received for strategic option
- [ ] Implementation plan is clear and specific

### Post-Act Validation
- [ ] Build succeeds without errors
- [ ] Type checking passes
- [ ] Linting passes with zero warnings
- [ ] No regression in functionality
- [ ] All tests continue to pass

### Pre-Merge Requirements
- [ ] Verification report shows all green
- [ ] Human LGTM on pull request
- [ ] CI/CD pipeline passes completely
- [ ] Documentation updated as needed

## Escalation Procedures

### Immediate Stop Conditions
- Any protected path modification detected
- Change limits exceeded (>40 lines or >10 files)
- Build failure that cannot be resolved
- Human intervention requested

### Human Escalation Triggers
- **Technical Blocker**: Cannot complete task within constraints
- **Ambiguous Requirements**: Multiple valid interpretations possible
- **Risk Assessment**: Change might affect production systems
- **Breaking Change**: Modification would break existing functionality

## Continuous Improvement

### Learning Capture
- Document successful patterns in knowledge base
- Record failed approaches for future avoidance
- Update constraint limits based on evidence
- Refine decision-making criteria over time

### Metrics Tracking
- Success rate of autonomous changes
- Time from OBSERVE to merged PR
- Human intervention frequency
- Quality gate pass rates

---

**Agreement Acknowledgment**: By operating in autonomous mode, Copilot agrees to strictly follow this operating agreement, respect all safety constraints, and escalate appropriately when human guidance is needed.