import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface Vulnerability {
    pkg: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    id?: string;
    desc?: string;
}

export interface SecurityReport {
    scanned: number;
    vulnerabilities: Vulnerability[];
    timestamp: string;
}


// Exported function for use in extension and intelligence engine
export async function runSecurityScan(workspacePath: string): Promise<SecurityReport> {
    const lockFiles = ['pnpm-lock.yaml', 'package-lock.json'];
    const lockfilePath = await findFirstAccessibleLockfile(workspacePath, lockFiles);
    if (!lockfilePath) {
        return { scanned: 0, vulnerabilities: [], timestamp: new Date().toISOString() };
    }
    const content = await fs.readFile(lockfilePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const { vulnerabilities, scanned } = analyzeSecurityLines(lines);
    return {
        scanned,
        vulnerabilities,
        timestamp: new Date().toISOString(),
    };
}

function isVulnerabilityLine(line: string): boolean {
    return /CVE-\d{4}-\d+/i.test(line) || /critical|high|vulnerab/i.test(line);
}

function isScannedLine(line: string): boolean {
    return /version:/i.test(line) || /resolved:/i.test(line);
}

function extractVulnerability(line: string): Vulnerability {
    const pkgMatch = /name: ['"]?([\w\-@/]+)['"]?/i.exec(line);
    const idMatch = /CVE-\d{4}-\d+/i.exec(line);
    let severity: Vulnerability['severity'] = 'medium';
    if (/critical/i.test(line)) severity = 'critical';
    else if (/high/i.test(line)) severity = 'high';
    else if (/low/i.test(line)) severity = 'low';
    return {
        pkg: pkgMatch ? pkgMatch[1] : 'unknown',
        severity,
        id: idMatch ? idMatch[0] : undefined,
        desc: line.trim(),
    };
}

function analyzeSecurityLines(lines: string[]): { vulnerabilities: Vulnerability[]; scanned: number } {
    let scanned = 0;
    const vulnerabilities: Vulnerability[] = [];
    for (const line of lines) {
        if (isVulnerabilityLine(line)) {
            vulnerabilities.push(extractVulnerability(line));
        }
        if (isScannedLine(line)) scanned++;
    }
    return { vulnerabilities, scanned };
}

async function findFirstAccessibleLockfile(workspacePath: string, lockFiles: string[]): Promise<string> {
    for (const lf of lockFiles) {
        const candidate = path.join(workspacePath, lf);
        try {
            await fs.access(candidate);
            return candidate;
        } catch {
            // continue
        }
    }
    return '';
}
