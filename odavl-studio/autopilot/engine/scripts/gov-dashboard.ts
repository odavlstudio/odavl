import fs from "node:fs";
import path from "node:path";
import { summarizePolicyHistory } from "../src/core/policy-analytics.js";

export async function renderGovDashboard() {
    const root = process.cwd();
    const { count, avgTrust, last } = await summarizePolicyHistory();
    const md = `# ODAVL Governance Dashboard
- Total Adjustments: ${count}
- Average Trust: ${avgTrust}
- Last Limits: ${JSON.stringify(last ?? {}, null, 2)}
`;
    const outDir = path.join(root, ".odavl", "dashboards");
    fs.mkdirSync(outDir, { recursive: true });
    const mdPath = path.join(outDir, "governance-dashboard.md");
    fs.writeFileSync(mdPath, md, "utf8");
    console.log(`[ODAVL] Governance dashboard → ${mdPath}`);
    return mdPath;
}

renderGovDashboard().catch(console.error);
