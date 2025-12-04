import * as fsp from "node:fs/promises";
import path from "path";

interface LockdownConfig {
    enabled: boolean;
    allowInsightWrite: boolean;
    allowCoreWrite: boolean;
    allowExternalApi: boolean;
    autoAttest: boolean;
    timestamp: string;
    version?: string;
}

export async function checkLockdown(): Promise<LockdownConfig> {
    const lockdownPath = path.join(process.cwd(), ".odavl/security/lockdown.json");

    try {
        await fsp.access(lockdownPath);
    } catch {
        console.log("⚠️  No lockdown config found");
        return {
            enabled: false,
            allowInsightWrite: true,
            allowCoreWrite: true,
            allowExternalApi: true,
            autoAttest: false,
            timestamp: new Date().toISOString()
        };
    }

    const content = await fsp.readFile(lockdownPath, "utf8");
    const cfg: LockdownConfig = JSON.parse(content);

    if (cfg.enabled) {
        console.log("🔐 ODAVL Lockdown Active");
        if (!cfg.allowInsightWrite) console.log("🚫 Insight write disabled");
        if (!cfg.allowCoreWrite) console.log("🚫 Core write disabled");
        if (cfg.autoAttest) console.log("✅ Auto-attestation enabled");
    } else {
        console.log("🔓 Lockdown disabled");
    }

    return cfg;
}

export async function isWriteAllowed(target: "insight" | "core"): Promise<boolean> {
    const cfg = await checkLockdown();
    if (!cfg.enabled) return true;
    return target === "insight" ? cfg.allowInsightWrite : cfg.allowCoreWrite;
}
