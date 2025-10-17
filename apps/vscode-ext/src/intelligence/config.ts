import * as path from 'node:path';
import { promises as fs } from 'node:fs';

export interface EnterpriseConfig {
    enableSecurityScan: boolean;
    blockOnCritical: boolean;
    includeGatesInReports: boolean;
    riskBudget: number;
}

const CONFIG_FILE = 'config-enterprise.json';
const ENTERPRISE_DEFAULTS: EnterpriseConfig = {
    enableSecurityScan: true,
    blockOnCritical: false,
    includeGatesInReports: true,
    riskBudget: 75,
};

export async function readEnterpriseConfig(workspacePath: string): Promise<EnterpriseConfig> {
    const configPath = path.join(workspacePath, '.odavl', CONFIG_FILE);
    try {
        const raw = await fs.readFile(configPath, 'utf8');
        const parsed = JSON.parse(raw);
        return { ...ENTERPRISE_DEFAULTS, ...parsed };
    } catch {
        // File missing or unreadable, use defaults
        return { ...ENTERPRISE_DEFAULTS };
    }
}

export async function writeEnterpriseConfig(workspacePath: string, config: EnterpriseConfig): Promise<void> {
    const configPath = path.join(workspacePath, '.odavl', CONFIG_FILE);
    // Write atomically: write to temp, then rename
    const tmpPath = configPath + '.tmp';
    await fs.writeFile(tmpPath, JSON.stringify(config, null, 2), 'utf8');
    await fs.rename(tmpPath, configPath);
}
