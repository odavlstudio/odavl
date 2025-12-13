import fs from "node:fs";
import path from "node:path";
import { guardianSign, guardianVerify } from "./GuardianBridge";

export function verifyAllAttestations() {
    const attDirs = [".odavl/attestations/governance", ".odavl/attestations/consensus", ".odavl/attestations/mesh"];
    let verified = 0, total = 0;
    for (const dir of attDirs) {
        const full = path.join(process.cwd(), dir);
        if (!fs.existsSync(full)) continue;
        for (const f of fs.readdirSync(full)) {
            const data = { file: f, dir };
            const signed = guardianSign(data);
            if (guardianVerify(signed)) verified++;
            total++;
        }
    }
    return { verified, total, ratio: total ? verified / total : 0 };
}
