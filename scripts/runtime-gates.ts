// runtime-gates.ts
// ODAVL 100/10 Wave 2: Runtime Gates Sync
// Dynamically enforces gates from .odavl/gates.yml at runtime

import fs from 'node:fs';
import yaml from 'js-yaml';

export interface GateConfig {
    [key: string]: any;
}

export function loadGatesConfig(path = '.odavl/gates.yml'): GateConfig {
    const file = fs.readFileSync(path, 'utf8');
    return yaml.load(file) as GateConfig;
}

export function checkGate(gate: string, value: number, config?: GateConfig): boolean {
    const gates = config || loadGatesConfig();
    const rule = gates[gate];
    if (!rule) return true;
    if (typeof rule.absoluteMax === 'number' && value > rule.absoluteMax) return false;
    if (typeof rule.deltaMax === 'number' && value > rule.deltaMax) return false;
    if (typeof rule.minPercent === 'number' && value < rule.minPercent) return false;
    return true;
}

// Example usage (to be replaced by CI integration):
// const gates = loadGatesConfig();
// if (!checkGate('eslint', 0, gates)) throw new Error('ESLint gate failed');
