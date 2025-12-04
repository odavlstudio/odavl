# ODAVL Workshop Checklist

## Pre-Flight (24 hours before workshop)

### Technical Prerequisites

- [ ] Node.js v18+ installed and verified
- [ ] pnpm package manager available
- [ ] VS Code latest version installed
- [ ] Git client configured with participant's credentials
- [ ] Sample repository prepared with known ESLint warnings
- [ ] ODAVL Studio extension file (.vsix) accessible

### Repository Setup

- [ ] Sample repo cloned and tested locally
- [ ] ESLint configuration verified (5-10 warnings present)
- [ ] TypeScript compilation confirmed working
- [ ] Branch protection rules configured (if using real repo)
- [ ] Backup repositories prepared for fallback scenarios

### Environment Validation

- [ ] Network connectivity to npm registry confirmed
- [ ] VS Code extensions can be installed (not blocked by corporate policy)
- [ ] Screen sharing software tested and working
- [ ] Recording capability enabled (if required)
- [ ] Backup communication channel established

## Pre-Session (30 minutes before start)

### Presenter Setup

- [ ] All demo repositories in clean state (no uncommitted changes)
- [ ] Terminal windows prepared with correct working directories
- [ ] VS Code workspace configured with ODAVL extension
- [ ] Demo script reviewed and commands validated
- [ ] Fallback scenarios mentally rehearsed

### Participant Readiness

- [ ] Confirm participant has required Node.js/pnpm versions
- [ ] Verify VS Code installation and update if needed
- [ ] Test screen sharing capabilities
- [ ] Exchange contact information for troubleshooting
- [ ] Review any corporate security constraints

## During Workshop

### Phase 1: Installation & Setup (10-25 min)

- [ ] Environment check completed successfully
- [ ] Repository cloned without issues
- [ ] Dependencies installed (npm/pnpm install passed)
- [ ] ODAVL CLI responds to basic commands
- [ ] VS Code extension loaded and activated

### Phase 2: First ODAVL Cycle (25-45 min)

- [ ] Observe phase: baseline metrics collected
- [ ] Decide phase: recipe selection demonstrated
- [ ] Act phase: automated fixes applied successfully
- [ ] Verify phase: shadow testing passed
- [ ] Complete cycle run without errors

### Phase 3: Safety Demo (45-65 min)

- [ ] Shadow verification logs reviewed
- [ ] Undo system demonstrated successfully
- [ ] Quality gates functionality shown
- [ ] Evidence collection scripts executed
- [ ] Before/after reports generated

### Phase 4: Live Repository (65-80 min)

- [ ] Participant's repository assessed for safety
- [ ] Supervised ODAVL cycle completed
- [ ] Changes reviewed and approved by participant
- [ ] Pull request created (if applicable)
- [ ] Evidence documentation generated

### Phase 5: Wrap-up & Next Steps (80-90 min)

- [ ] Technical questions addressed satisfactorily
- [ ] Pilot timeline explained and agreed upon
- [ ] Support contact information exchanged
- [ ] Follow-up meeting scheduled

## Post-Session Actions

### Immediate (within 1 hour)

- [ ] Session recording shared (if applicable)
- [ ] Generated evidence reports sent to participant
- [ ] Two-week pilot plan document provided
- [ ] Support contact information confirmed
- [ ] Any technical issues documented for improvement

### Follow-up (within 24 hours)

- [ ] Thank you email sent with session summary
- [ ] Pilot kick-off meeting scheduled
- [ ] Repository access permissions verified
- [ ] Custom requirements documented
- [ ] Internal team briefed on pilot specifics

## Troubleshooting Checklist

### Common Installation Issues

- [ ] Node.js version conflicts: Guide to nvm/nodist usage
- [ ] Corporate firewall blocking npm: Alternative registry setup
- [ ] Permission errors: Admin access or alternative installation
- [ ] Missing dependencies: Manual installation procedures

### Runtime Problems

- [ ] ESLint configuration errors: Fallback to simpler config
- [ ] TypeScript compilation failures: Simplified tsconfig.json
- [ ] Git repository issues: Clean state reset procedures
- [ ] VS Code extension not loading: Reload window or manual install

### Network/Access Issues

- [ ] Repository access denied: Use local sample repository
- [ ] Package registry unavailable: Offline installation packages
- [ ] Screen sharing failures: Alternative communication methods
- [ ] Recording software problems: Alternative documentation methods

## Success Metrics

### Technical Success

- [ ] ODAVL successfully executed at least one complete cycle
- [ ] No breaking changes introduced to participant's code
- [ ] Evidence reports generated with meaningful metrics
- [ ] All safety mechanisms (undo, gates, shadow) demonstrated

### Engagement Success

- [ ] Participant actively engaged throughout session
- [ ] Questions answered satisfactorily
- [ ] Confidence level high for proceeding with pilot
- [ ] Clear understanding of ODAVL capabilities and limitations

### Process Success

- [ ] Workshop completed within 90-minute timeframe
- [ ] No technical issues that prevented core demonstration
- [ ] Pilot next steps clearly defined and agreed upon
- [ ] Follow-up actions scheduled and documented

## Emergency Procedures

### Complete System Failure

1. Switch to pre-recorded demo video
2. Use backup presentation slides
3. Schedule follow-up technical session
4. Provide alternative evaluation options

### Partial Functionality Issues

1. Continue with working components
2. Demonstrate limitations transparently
3. Adjust pilot scope if needed
4. Document issues for resolution

### Participant Emergency (technical issues)

1. Offer screen sharing assistance
2. Switch to observer mode for participant  
3. Schedule one-on-one technical setup session
4. Provide alternative pilot entry points
