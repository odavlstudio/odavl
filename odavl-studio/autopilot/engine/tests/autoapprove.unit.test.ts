import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import {
    evaluateCommandApproval,
    validatePolicy,
    logApprovalDecision
} from '../src/policies/autoapprove';

const TEST_POLICY_PATH = path.join(process.cwd(), '.odavl', 'autoapprove.yml');
const TEST_POLICY_BACKUP = path.join(process.cwd(), '.odavl', 'autoapprove.yml.bak');

function writePolicy(policy: object) {
    fs.mkdirSync(path.dirname(TEST_POLICY_PATH), { recursive: true });
    fs.writeFileSync(TEST_POLICY_PATH, yaml.dump(policy), 'utf8');
}

describe('autoapprove policy engine', () => {
    afterEach(() => {
        if (fs.existsSync(TEST_POLICY_BACKUP)) {
            fs.renameSync(TEST_POLICY_BACKUP, TEST_POLICY_PATH);
        } else if (fs.existsSync(TEST_POLICY_PATH)) {
            fs.unlinkSync(TEST_POLICY_PATH);
        }
    });

    it('denies dangerous commands by default', async () => {
        if (fs.existsSync(TEST_POLICY_PATH)) {
            fs.renameSync(TEST_POLICY_PATH, TEST_POLICY_BACKUP);
        }
        // No policy file: should deny everything
        const result = await evaluateCommandApproval('rm -rf /');
        expect(result.approved).toBe(false);
        expect(result.safetyReason).toBe('unknown');
        expect(result.defaultApplied).toBe(true);
    });

    it('allows safe commands if allow rule exists', async () => {
        writePolicy({
            version: '1.0',
            safetyLevel: 'enterprise',
            allow: [{ pattern: '^pnpm list$', reason: 'Safe', safetyLevel: 'low' }],
            deny: [],
            default: { action: 'deny', reason: 'Default', safetyLevel: 'unknown', requireApproval: true },
            logging: { includeReason: true, logLevel: 'info', auditTrail: false }
        });
        const result = await evaluateCommandApproval('pnpm list');
        expect(result.approved).toBe(true);
        expect(result.safetyReason).toBe('allow');
        expect(result.defaultApplied).toBe(false);
    });

    it('applies deny rule if pattern matches', async () => {
        writePolicy({
            version: '1.0',
            safetyLevel: 'enterprise',
            allow: [],
            deny: [{ pattern: 'rm', reason: 'Dangerous', safetyLevel: 'critical' }],
            default: { action: 'allow', reason: 'Default', safetyLevel: 'low', requireApproval: false },
            logging: { includeReason: true, logLevel: 'info', auditTrail: false }
        });
        const result = await evaluateCommandApproval('rm -rf /');
        expect(result.approved).toBe(false);
        expect(result.safetyReason).toBe('deny');
        expect(result.defaultApplied).toBe(false);
    });

    it('applies default policy for unknown commands', async () => {
        writePolicy({
            version: '1.0',
            safetyLevel: 'enterprise',
            allow: [],
            deny: [],
            default: { action: 'deny', reason: 'Default', safetyLevel: 'unknown', requireApproval: true },
            logging: { includeReason: true, logLevel: 'info', auditTrail: false }
        });
        const result = await evaluateCommandApproval('unknown-cmd');
        expect(result.approved).toBe(false);
        expect(result.safetyReason).toBe('unknown');
        expect(result.defaultApplied).toBe(true);
    });

    it('validatePolicy detects dangerous allow rules', async () => {
        writePolicy({
            version: '1.0',
            safetyLevel: 'enterprise',
            allow: [
                { pattern: '.*', reason: 'Too broad', safetyLevel: 'low' },
                { pattern: 'rm', reason: 'Bad', safetyLevel: 'low' }
            ],
            deny: [],
            default: { action: 'deny', reason: 'Default', safetyLevel: 'unknown', requireApproval: true },
            logging: { includeReason: true, logLevel: 'info', auditTrail: false }
        });
        const result = await validatePolicy();
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.includes('Overly permissive'))).toBe(true);
        expect(result.issues.some(i => i.includes('dangerous pattern'))).toBe(true);
    });

    it('validatePolicy detects missing deny rules', async () => {
        writePolicy({
            version: '1.0',
            safetyLevel: 'enterprise',
            allow: [],
            deny: [],
            default: { action: 'deny', reason: 'Default', safetyLevel: 'unknown', requireApproval: true },
            logging: { includeReason: true, logLevel: 'info', auditTrail: false }
        });
        const result = await validatePolicy();
        expect(result.valid).toBe(false);
        expect(result.issues.some(i => i.includes('Missing critical deny rule'))).toBe(true);
    });

    it('logApprovalDecision does not throw', () => {
        writePolicy({
            version: '1.0',
            safetyLevel: 'enterprise',
            allow: [],
            deny: [],
            default: { action: 'deny', reason: 'Default', safetyLevel: 'unknown', requireApproval: true },
            logging: { includeReason: true, logLevel: 'info', auditTrail: false }
        });
        const result = evaluateCommandApproval('unknown-cmd');
        expect(() => logApprovalDecision('unknown-cmd', result, 'TEST')).not.toThrow();
    });
});
