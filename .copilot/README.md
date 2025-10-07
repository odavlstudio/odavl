# ODAVL Copilot Governance System
**Autonomous Mode with Dual-Profile Context Switching**

## Overview

The ODAVL Copilot system operates in **Governed Autonomous Mode** with strict safety constraints and dual-profile context switching. This system ensures that AI assistance remains productive while maintaining enterprise-grade safety and quality standards.

## 🎯 Available Profiles

### Core Development Profile
**Activation**: `@copilot use profile core`

**Context**: ODAVL Core development (CLI + VS Code Extension + Governance + CI/CD)
- **Scope**: Root directory, `/packages/`, `/infra/`, `/.github/`
- **Forbidden**: Never touches `/odavl-website/` (separate profile)
- **Branch Pattern**: `odavl/core-<task>-<YYYYMMDD>`
- **Tone**: Engineering-focused, technical precision
- **Audience**: Developers, DevOps engineers, technical leads

**Example Tasks**:
- CLI functionality improvements
- VS Code extension features
- CI/CD pipeline optimization
- Governance system updates
- Build tool configuration

### Website Development Profile
**Activation**: `@copilot use profile website`

**Context**: ODAVL Website development (Next.js 15 + TypeScript + Tailwind + next-intl)
- **Scope**: `/odavl-website/` ONLY
- **Forbidden**: Never touches parent directories or sibling projects
- **Branch Pattern**: `odavl/web-<task>-<YYYYMMDD>`
- **Tone**: Designer-Developer hybrid, UX-focused
- **Audience**: Product managers, designers, marketing teams

**Example Tasks**:
- Landing page optimization
- Internationalization improvements
- Component design enhancements
- SEO and performance optimization
- User experience improvements

## 🔒 Safety Constraints (Both Profiles)

### Change Limits (Per PR)
- **Maximum Lines**: 40 lines changed total
- **Maximum Files**: 10 files modified
- **No Destructive Operations**: No file deletion, no breaking changes

### Protected Paths (Never Modified)
- `/security/` - Security configurations and secrets
- `**/*.spec.*` - Test files and specifications
- `/public-api/` - Public API contracts
- `.git/` - Version control internals

### Required Process
1. **OBSERVE** → Deep analysis and evidence gathering
2. **DECIDE** → A/B strategic options with human approval required
3. **ACT** → Execute approved changes within constraints
4. **VERIFY** → Validate through testing and quality checks
5. **LEARN** → Document outcomes and patterns

## 🚀 Usage Examples

### Switching to Core Profile
```
@copilot use profile core

I need to optimize the CLI decision logic to handle more edge cases 
while maintaining the current ODAVL cycle structure.
```

### Switching to Website Profile
```
@copilot use profile website

I want to improve the hero section CTA conversion by making the 
interactive demo more prominent while maintaining the professional design.
```

### Emergency Hotfix (Either Profile)
```
@copilot hotfix

There's a critical production issue with [specific problem]. 
Need immediate fix following governance constraints.

Branch pattern: odavl/hotfix-<issue>-<YYYYMMDD>
```

## 📋 Governance Workflow

### 1. Automatic Profile Detection
The system automatically detects context from:
- File paths in your request
- Keywords (CLI, website, Next.js, etc.)
- Previous conversation context
- Explicit profile activation

### 2. Constraint Enforcement
- **Pre-Act Validation**: Verifies all constraints before making changes
- **CI Integration**: `.github/workflows/odavl-guard.yml` blocks non-compliant PRs
- **Human Gates**: Strategic decisions require explicit approval

### 3. Quality Assurance
- **Build Verification**: TypeScript, ESLint, and build success required
- **Test Integrity**: All existing tests must continue passing
- **i18n Consistency**: Translation keys validated across locales

## 🛡️ Safety Features

### Automatic Escalation
The system automatically escalates to human review when:
- Change limits would be exceeded (>40 lines or >10 files)
- Protected paths are affected
- Build failures cannot be resolved
- Breaking changes are detected
- Ambiguous requirements need clarification

### Branch Protection
- **Naming Convention**: Enforced branch prefixes for clear context
- **Merge Requirements**: Human LGTM required for all PRs
- **CI Gates**: All governance checks must pass before merge

### Rollback Safety
- **Feature Branches**: All work isolated from main branch
- **Atomic Changes**: Small, focused changes for easy rollback
- **Documentation**: Complete change documentation for audit trails

## 🎨 Profile-Specific Features

### Core Profile Specializations
- **CLI Architecture**: Deep understanding of ODAVL cycle implementation
- **Extension Development**: VS Code API expertise and best practices
- **Build Systems**: Advanced knowledge of pnpm workspaces and tooling
- **DevOps Integration**: CI/CD pipeline optimization and monitoring

### Website Profile Specializations
- **Next.js 15**: App Router, internationalization, and performance optimization
- **Design Systems**: Glass morphism, Tailwind CSS, and component libraries
- **UX Optimization**: Conversion flow analysis and user experience improvements
- **SEO & Performance**: Technical SEO, Core Web Vitals, and accessibility

## 📊 Monitoring & Learning

### Success Metrics
- **Autonomous Success Rate**: Percentage of changes completed without human intervention
- **Quality Gate Pass Rate**: Percentage of changes passing all CI checks
- **Time to Merge**: Average time from request to merged PR
- **Human Escalation Rate**: Frequency of escalations for review

### Continuous Improvement
- **Pattern Recognition**: Learning from successful change patterns
- **Constraint Optimization**: Adjusting limits based on evidence
- **Process Refinement**: Improving decision-making criteria over time
- **Knowledge Base**: Building repository-specific expertise

## 🆘 Troubleshooting

### Common Issues

**"Profile not detected"**
→ Explicitly activate: `@copilot use profile core` or `@copilot use profile website`

**"Change limits exceeded"**
→ Break request into smaller, focused tasks within 40-line limit

**"Protected path blocked"**
→ Review protected paths in Operating Agreement, escalate if legitimate need

**"Branch naming violation"**
→ Use correct pattern: `odavl/(core|web|hotfix)-<task>-<YYYYMMDD>`

### Getting Help
- **Documentation**: Check `.copilot/OPERATING_AGREEMENT.md` for detailed governance
- **Profile Specs**: Review `.copilot/profile.core.md` or `.copilot/profile.website.md`
- **CI Logs**: Check failed GitHub Actions for specific constraint violations
- **Human Escalation**: Request human review for complex or ambiguous situations

---

**Ready to optimize your ODAVL development experience with governed AI assistance!** 🚀