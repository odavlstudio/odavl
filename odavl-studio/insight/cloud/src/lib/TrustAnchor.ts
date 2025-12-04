import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function createTrustAnchor() {
    const dir = path.join(process.cwd(), ".odavl/trust");
    fs.mkdirSync(dir, { recursive: true });
    const key = crypto.randomBytes(32).toString("hex");
    const anchor = { id: crypto.randomUUID(), key, createdAt: new Date().toISOString() };
    fs.writeFileSync(path.join(dir, "anchor.json"), JSON.stringify(anchor, null, 2));
    return anchor;
}

export function loadTrustAnchor() {
    const fp = path.join(process.cwd(), ".odavl/trust/anchor.json");
    return fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf8")) : createTrustAnchor();
}
