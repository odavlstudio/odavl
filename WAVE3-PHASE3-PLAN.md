# Wave 3 Phase 3 Implementation Plan

**Date**: 2025-10-12  
**Branch**: `odavl/wave3-phase3-20251012`  
**Objectives**: S1 (Evidence Retention) + S2 (Testing Infrastructure) + S3 (Schema Validation)  
**Commit Strategy**: 3 commits, ≤10 files each, ≤40 lines per file  

## Overview

This phase focuses on enterprise-grade operational improvements: evidence lifecycle management, testing foundation, and configuration validation. All implementations must maintain ODAVL safety protocols while enhancing system reliability and maintainability.

## S1: Evidence Retention Policy Implementation

### Objective
Implement automated evidence lifecycle management to prevent unbounded growth of evidence files while preserving critical audit trails and attestations.

### Current State Analysis
- **Evidence Directory**: `evidence/` contains 150+ files (observation: heavy accumulation)
- **File Types**: Mixed (action, audit, decision, metric, outcome evidence)
- **Size Impact**: Growing evidence directory affects repository performance
- **Critical Files**: Attestations and audit trails must never be deleted

### Implementation Plan

#### File 1: `.odavl/retention.yml` (NEW)
```yaml
# ODAVL Evidence Retention Policy
# Controls automatic cleanup of evidence files while preserving critical data

retention:
  # Maximum age for evidence files (days)
  max_age_days: 30
  
  # Evidence types that are never deleted (critical for compliance)
  exclude_types: 
    - "attestation"
    - "audit"
    - "outcome"
    - "rollback"
  
  # Archive location for old evidence (relative to repo root)
  archive_path: "archive/evidence"
  
  # Batch size for cleanup operations (safety limit)
  batch_size: 50
  
  # Dry run mode (preview cleanup without deletion)
  dry_run: false

# File pattern matching for evidence types
patterns:
  attestation: "**/*attestation*"
  audit: "**/evidence_audit_*"
  outcome: "**/evidence_outcome_*"
  rollback: "**/*rollback*"
  metric: "**/evidence_metric_*"
  action: "**/evidence_action_*"
  decision: "**/evidence_decision_*"
```

#### File 2: `tools/cleanup.ps1` (NEW - 38 lines)
PowerShell script implementing retention policy with safety controls:

**Core Functions**:
- `Get-EvidenceFiles()`: Scan and categorize evidence files by age/type
- `Test-RetentionPolicy()`: Validate retention configuration
- `Invoke-EvidenceCleanup()`: Execute cleanup with safety checks
- `New-EvidenceArchive()`: Archive files before deletion

**Safety Features**:
- Dry-run mode by default
- Batch processing with confirmation prompts
- Archive creation before deletion
- JSON output for integration with ODAVL cycle
- Never delete files matching exclude_types patterns

**Usage Examples**:
```powershell
# Dry run (preview only)
.\tools\cleanup.ps1 -DryRun

# Execute cleanup with confirmation
.\tools\cleanup.ps1 -Confirm

# JSON output for automation
.\tools\cleanup.ps1 -Json
```

#### File 3: `package.json` Enhancement
Add new CLI command:
```json
{
  "scripts": {
    "odavl:cleanup": "powershell -File tools/cleanup.ps1"
  }
}
```

### Expected Outcomes
- **Evidence Directory**: Managed size with automatic cleanup
- **Archive System**: Old evidence preserved in `archive/evidence/`
- **Safety Compliance**: Critical attestations and audits never deleted
- **CLI Integration**: `pnpm odavl:cleanup` command available

## S2: Testing Infrastructure Foundation

### Objective
Establish lightweight testing foundation for ODAVL cycle, website build validation, and PowerShell tool schema verification.

### Current State Analysis
- **Existing**: `apps/cli/src/__tests__/phases.test.ts` (basic phase testing)
- **Missing**: Integration tests, website validation, PowerShell JSON schema tests
- **Vitest**: Already configured in `vitest.config.ts`
- **Test Runner**: Available but underutilized

### Implementation Plan

#### File 1: `apps/cli/src/__tests__/integration.test.ts` (NEW - 35 lines)
ODAVL full cycle integration testing:

**Test Scenarios**:
```typescript
describe('ODAVL Integration Tests', () => {
  test('full cycle execution', async () => {
    // Test: observe → decide → act → verify → learn
    const before = await observe();
    const decision = await decide(before);
    await act(decision);
    const verification = await verify(before);
    const report = { before, after: verification.after, deltas: verification.deltas, 
                    decision, gatesPassed: verification.gatesPassed };
    await learn(report);
    
    expect(verification.gatesPassed).toBe(true);
  });
  
  test('quality gates enforcement', async () => {
    // Test: Gates prevent quality degradation
    const mockBefore = { eslintWarnings: 0, typeErrors: 0, timestamp: new Date().toISOString() };
    const mockAfter = { eslintWarnings: 5, typeErrors: 1, timestamp: new Date().toISOString() };
    // Should fail gates due to increase in warnings/errors
  });
});
```

#### File 2: `odavl-website/tests/build.test.js` (NEW - 25 lines)
Website build and SEO validation testing:

**Test Scenarios**:
```javascript
describe('Website Build Tests', () => {
  test('successful build completion', async () => {
    // Test: Next.js build completes without errors
    const buildResult = await execAsync('npm run build');
    expect(buildResult.stderr).toBe('');
  });
  
  test('SEO metadata generation', () => {
    // Test: generateSEOMetadata function produces valid metadata
    const metadata = generateSEOMetadata('home');
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
  });
});
```

#### File 3: `apps/cli/src/__tests__/powershell.test.ts` (NEW - 30 lines)
PowerShell tools JSON schema validation:

**Test Scenarios**:
```typescript
describe('PowerShell Tools Tests', () => {
  test('golden.ps1 JSON output schema', async () => {
    // Test: PowerShell tool produces valid JSON schema
    const result = await execAsync('powershell -File tools/golden.ps1 -Json');
    const json = JSON.parse(result.stdout);
    
    expect(json).toHaveProperty('data');
    expect(json).toHaveProperty('timestamp');
    expect(json).toHaveProperty('status');
    expect(json).toHaveProperty('tool');
  });
});
```

#### File 4: Update `vitest.config.ts` (3 lines added)
Ensure test configuration includes new test directories:
```typescript
export default defineConfig({
  test: {
    include: ['**/*.{test,spec}.{js,ts}'],
    testTimeout: 30000, // Allow longer timeouts for integration tests
  }
});
```

### Expected Outcomes
- **Integration Tests**: Full ODAVL cycle validation
- **Website Tests**: Build and SEO function verification  
- **PowerShell Tests**: JSON schema compliance validation
- **CI Readiness**: Tests structured for continuous integration

## S3: Configuration Schema Validation

### Objective
Implement JSON Schema validation for ODAVL configuration files with non-destructive validation and readable output.

### Current State Analysis
- **Configuration Files**: `.odavl/gates.yml`, `.odavl/policy.yml` (existing)
- **Validation**: Currently none (configurations trusted)
- **Schema Standards**: JSON Schema Draft 7 recommended
- **TypeScript Integration**: Needed for type safety

### Implementation Plan

#### File 1: `.odavl/schemas/gates.schema.json` (NEW - 35 lines)
JSON Schema for `gates.yml` validation:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ODAVL Quality Gates Configuration",
  "type": "object",
  "properties": {
    "eslint": {
      "type": "object",
      "properties": {
        "deltaMax": { "type": "number", "minimum": 0 },
        "absoluteMax": { "type": "number", "minimum": 0 }
      },
      "required": ["deltaMax", "absoluteMax"]
    },
    "typeErrors": {
      "type": "object", 
      "properties": {
        "deltaMax": { "type": "number", "minimum": 0 },
        "absoluteMax": { "type": "number", "minimum": 0 }
      },
      "required": ["deltaMax", "absoluteMax"]
    },
    "security": {
      "type": "object",
      "properties": {
        "highCVEs": { "type": "number", "minimum": 0 },
        "mediumCVEs": { "type": "number", "minimum": 0 },
        "licenseIssues": { "type": "number", "minimum": 0 }
      }
    }
  },
  "required": ["eslint", "typeErrors"]
}
```

#### File 2: `.odavl/schemas/policy.schema.json` (NEW - 25 lines)
JSON Schema for `policy.yml` validation:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ODAVL Risk Policy Configuration",
  "type": "object",
  "properties": {
    "autonomy": { 
      "type": "number", 
      "minimum": 0, 
      "maximum": 10 
    },
    "riskBudget": {
      "type": "object",
      "properties": {
        "maxLinesPerPatch": { "type": "number", "minimum": 1, "maximum": 100 },
        "maxFilesTouched": { "type": "number", "minimum": 1, "maximum": 50 },
        "maxPatchesPerRun": { "type": "number", "minimum": 1, "maximum": 10 }
      },
      "required": ["maxLinesPerPatch", "maxFilesTouched", "maxPatchesPerRun"]
    },
    "protected": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["autonomy", "riskBudget"]
}
```

#### File 3: `apps/cli/src/utils/schema-validator.ts` (NEW - 38 lines)
TypeScript schema validation utility:

**Core Functions**:
- `loadSchema(schemaPath: string)`: Load JSON schema from file
- `validateConfig(configPath: string, schemaPath: string)`: Validate YAML against schema
- `formatValidationErrors(errors: ValidationError[])`: Human-readable error formatting
- `validateAllConfigs()`: Validate all ODAVL configurations

**Usage Example**:
```typescript
import { validateConfig } from './utils/schema-validator.js';

const result = await validateConfig('.odavl/gates.yml', '.odavl/schemas/gates.schema.json');
if (!result.valid) {
  console.error('Configuration validation failed:', result.errors);
}
```

#### File 4: `apps/cli/src/index.ts` Enhancement (5 lines added)
Add validation command to CLI dispatcher:

```typescript
case "validate": {
  const validator = await import('./utils/schema-validator.js');
  const result = await validator.validateAllConfigs();
  console.log(JSON.stringify(result, null, 2));
  break;
}
```

#### File 5: `package.json` Enhancement
Add validation CLI command:
```json
{
  "scripts": {
    "odavl:validate": "tsx apps/cli/src/index.ts validate"
  }
}
```

### Expected Outcomes
- **Schema Definitions**: JSON Schema files for all configurations
- **Validation Utility**: TypeScript validator with error formatting
- **CLI Command**: `pnpm odavl:validate` for configuration validation
- **JSON Output**: Machine-readable validation results

## Implementation Timeline

### Commit 1: S1 - Evidence Retention System
**Files** (3 total):
1. `.odavl/retention.yml` - Retention policy configuration
2. `tools/cleanup.ps1` - Cleanup automation script  
3. `package.json` - Add odavl:cleanup command

**Safety Verification**:
- Test retention policy with dry-run mode
- Verify critical files (attestations) are excluded
- Confirm archive functionality works correctly

### Commit 2: S2 - Testing Infrastructure Foundation  
**Files** (4 total):
1. `apps/cli/src/__tests__/integration.test.ts` - ODAVL cycle tests
2. `odavl-website/tests/build.test.js` - Website build validation
3. `apps/cli/src/__tests__/powershell.test.ts` - PowerShell JSON schema tests
4. `vitest.config.ts` - Updated test configuration

**Safety Verification**:
- Run test suite to ensure all tests pass
- Verify integration tests don't interfere with actual ODAVL operations
- Confirm website build tests work with current Next.js setup

### Commit 3: S3 - Configuration Schema Validation
**Files** (5 total):
1. `.odavl/schemas/gates.schema.json` - Gates configuration schema
2. `.odavl/schemas/policy.schema.json` - Policy configuration schema  
3. `apps/cli/src/utils/schema-validator.ts` - Validation utility
4. `apps/cli/src/index.ts` - Add validate command (5 lines)
5. `package.json` - Add odavl:validate command

**Safety Verification**:
- Validate current configurations pass schema validation
- Test error reporting with intentionally invalid configurations
- Verify JSON output format for automation integration

## Risk Assessment & Mitigation

### Low Risk Items ✅
- **Evidence Retention**: Read-only policy file, non-destructive by default
- **Testing Infrastructure**: Isolated test environment, no production impact
- **Schema Validation**: Non-destructive validation, no configuration modification

### Medium Risk Items ⚠️
- **PowerShell Cleanup Script**: File deletion capabilities
  - **Mitigation**: Dry-run default, exclude critical files, archive before deletion
  
### Safety Controls
- **File Count**: 12 total files (3+4+5), all under ≤10 per commit limit
- **Line Count**: All files designed for ≤40 lines each
- **Protected Paths**: No modifications to security, spec, or public-api directories
- **Backwards Compatibility**: All additions are opt-in, no breaking changes
- **Rollback**: Git-based rollback available, ODAVL undo system preserved

## Validation Criteria

### S1 Success Criteria
- [ ] Retention policy file loads and parses correctly
- [ ] Cleanup script runs in dry-run mode without errors
- [ ] Critical files (attestations) are never selected for deletion
- [ ] Archive functionality creates proper backup structure
- [ ] `pnpm odavl:cleanup` command executes successfully

### S2 Success Criteria  
- [ ] Integration test completes full ODAVL cycle
- [ ] Website build test validates Next.js compilation
- [ ] PowerShell JSON schema test validates tool output
- [ ] All tests pass in Vitest runner
- [ ] Test execution doesn't interfere with actual ODAVL operations

### S3 Success Criteria
- [ ] Schema files validate current configurations successfully
- [ ] Schema validator utility produces readable error messages
- [ ] `pnpm odavl:validate` command returns structured JSON output
- [ ] Invalid configurations are properly detected and reported
- [ ] CLI integration works seamlessly with existing commands

## Post-Implementation Verification

After each commit, the following verification steps will be performed:

1. **TypeScript Compilation**: `pnpm run typecheck` (0 errors expected)
2. **ESLint Validation**: `pnpm run lint` (0 warnings expected)  
3. **Test Suite Execution**: `pnpm test` (all tests pass)
4. **ODAVL Cycle Test**: Full cycle execution to ensure no regressions
5. **New CLI Commands**: Test all new commands (`cleanup`, `validate`)
6. **Schema Validation**: Validate all configurations against new schemas

## Expected Deliverables

1. **Implementation**: All 12 files implemented according to specifications
2. **Verification Report**: `WAVE3-PHASE3-VERIFY.md` with:
   - Evidence retention test results with file count reduction metrics
   - Test suite execution summary with pass/fail status
   - Schema validation examples with valid/invalid configuration testing
   - Performance impact assessment for new CLI commands
3. **Updated Documentation**: Enhanced CLI help output and usage examples
4. **Evidence Logs**: Automatic generation of evidence for implementation process

---

**Ready for Approval**: This plan follows ODAVL safety protocols with comprehensive risk assessment, safety controls, and validation criteria. All implementations are designed to be non-destructive with proper rollback capabilities.

**Next Steps**: Upon approval, proceed with branch implementation following the 3-commit strategy outlined above.