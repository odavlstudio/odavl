#!/usr/bin/env tsx

/**
 * ODAVL Studio - Snapshot Testing Demo
 * 
 * Tests snapshot functionality with various scenarios:
 * - Component snapshots
 * - API response snapshots
 * - Configuration snapshots
 * - Inline snapshots
 * 
 * Usage:
 *   tsx scripts/test-snapshots.ts
 *   pnpm test:snapshots
 */

import { describe, it, expect } from 'vitest';

console.log('🧪 ODAVL Snapshot Testing Demo\n');

// Mock component render (simplified)
function renderButton(props: { variant: string; disabled?: boolean; children: string }) {
  return {
    type: 'button',
    props: {
      className: `btn btn-${props.variant}${props.disabled ? ' btn-disabled' : ''}`,
      disabled: props.disabled || false,
      children: props.children
    }
  };
}

// Mock API response
function createInsightRunResponse() {
  return {
    id: '<dynamic>',
    projectId: 'test-project',
    detectors: ['typescript', 'eslint'],
    status: 'completed',
    issuesFound: 12,
    timestamp: '<dynamic>',
    duration: 2340
  };
}

// Mock configuration loader
function loadGatesConfig() {
  return {
    risk_budget: 100,
    max_files_per_cycle: 10,
    max_loc_per_file: 40,
    forbidden_paths: ['security/**', 'auth/**', '**/*.spec.*'],
    enforcement: ['block_if_risk_exceeded', 'rollback_on_failure'],
    thresholds: {
      max_risk_per_action: 25,
      min_success_rate: 0.75,
      max_consecutive_failures: 3
    }
  };
}

describe('Snapshot Testing Demo', () => {
  console.log('Running Component Snapshots...');

  it('matches snapshot - primary button', () => {
    const button = renderButton({ variant: 'primary', children: 'Click Me' });
    expect(button).toMatchSnapshot();
  });

  it('matches snapshot - secondary button', () => {
    const button = renderButton({ variant: 'secondary', children: 'Cancel' });
    expect(button).toMatchSnapshot();
  });

  it('matches snapshot - disabled button', () => {
    const button = renderButton({ 
      variant: 'primary', 
      disabled: true, 
      children: 'Disabled' 
    });
    expect(button).toMatchSnapshot();
  });

  console.log('Running API Response Snapshots...');

  it('matches snapshot - insight run response', () => {
    const response = createInsightRunResponse();
    expect(response).toMatchSnapshot();
  });

  it('matches inline snapshot - insight run status', () => {
    const response = createInsightRunResponse();
    expect(response.status).toMatchInlineSnapshot(`"completed"`);
  });

  console.log('Running Configuration Snapshots...');

  it('matches snapshot - gates configuration', () => {
    const config = loadGatesConfig();
    expect(config).toMatchSnapshot();
  });

  it('matches snapshot - gates thresholds only', () => {
    const config = loadGatesConfig();
    expect(config.thresholds).toMatchSnapshot();
  });

  console.log('Running Array Snapshots...');

  it('matches snapshot - detector list', () => {
    const detectors = [
      { name: 'typescript', enabled: true, priority: 1 },
      { name: 'eslint', enabled: true, priority: 2 },
      { name: 'security', enabled: true, priority: 3 }
    ];
    expect(detectors).toMatchSnapshot();
  });

  console.log('Running Property Matcher Snapshots...');

  it('matches snapshot with property matchers', () => {
    const response = {
      id: 'dynamic-id-12345',
      timestamp: new Date().toISOString(),
      status: 'success',
      data: { count: 42 }
    };

    // Use property matchers for dynamic values
    expect(response).toMatchSnapshot({
      id: expect.any(String),
      timestamp: expect.any(String)
    });
  });
});

console.log('\n✅ Snapshot tests complete!');
console.log('\nℹ️  Snapshot files created in:');
console.log('   tests/__snapshots__/test-snapshots.ts.snap');
console.log('\n📝 To update snapshots after changes:');
console.log('   pnpm test -- -u');
console.log('   pnpm test:snapshots -- -u');
