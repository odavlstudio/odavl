import { SecurityReport } from './security';
import * as path from 'node:path';
export interface VerificationSummary {
    gates: GovernanceGate[];
    compliance: number;
}

// Evaluate gates based on security report and policy
export async function evaluateGates(securityReport: SecurityReport, policy: any): Promise<VerificationSummary> {
    // Example: map gates from .odavl/gates.yml and .odavl.policy.yml
    // For demo, hardcode a few gates. In real use, parse YAML and policy.
    const gates: GovernanceGate[] = [];
    // Gate: No high/critical vulnerabilities
    const hasHigh = securityReport.vulnerabilities.some(v => v.severity === 'high' || v.severity === 'critical');
    gates.push({
        name: 'Security Review',
        condition: 'no_high_vulns',
        status: hasHigh ? 'fail' : 'pass',
        riskWeight: 1,
    });
    // Add more gates as needed, e.g., riskScore, custom policy
    // ...
    const passed = gates.filter(g => g.status === 'pass').length;
    const compliance = gates.length ? (passed / gates.length) * 100 : 100;
    return { gates, compliance };
}
import yaml from 'yaml';

export interface GovernanceGate {
    name: string;
    condition: string;
    status: 'pass' | 'fail' | 'warn';
    riskWeight: number;
}

export interface GovernanceSummary {
    gates: GovernanceGate[];
    compliance: number;
    riskScore: number;
}

import { promises as fs } from 'node:fs';

export async function readGovernanceFiles(workspacePath: string): Promise<GovernanceSummary> {
    const gatesPath = path.join(workspacePath, '.odavl', 'gates.yml');
    let gates: GovernanceGate[] = [];
    try {
        const gatesRaw = await fs.readFile(gatesPath, 'utf8');
        gates = yaml.parse(gatesRaw) || [];
    } catch {
        // If file missing or unreadable, treat as empty (ignore error)
        gates = [];
    }
    // Optionally merge policy gates if needed
    // ...
    // Compute compliance and risk
    let totalWeight = 0;
    let riskScore = 0;
    let passed = 0;
    for (const gate of gates) {
        totalWeight += gate.riskWeight || 0;
        if (gate.status === 'pass') passed++;
        if (gate.status === 'fail') riskScore += (gate.riskWeight || 0) * 100;
        if (gate.status === 'warn') riskScore += (gate.riskWeight || 0) * 50;
    }
    const compliance = gates.length ? (passed / gates.length) * 100 : 0;
    return { gates, compliance, riskScore };
}
