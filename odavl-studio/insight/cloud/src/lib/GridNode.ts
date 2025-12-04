import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface GridNodeIdentity {
    nodeId: string;
    publicKey: string;
    privateKey: string;
    trustScore: number;
    lastSync: string;
}

export class GridNode {
    private identity: GridNodeIdentity | null = null;
    private readonly identityPath: string;

    constructor(basePath: string = ".odavl/grid") {
        this.identityPath = path.join(process.cwd(), basePath, "node.json");
    }

    async generateIdentity(): Promise<GridNodeIdentity> {
        const nodeId = randomUUID();
        const keyPair = await crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        );

        const publicKey = await crypto.subtle.exportKey("spki", keyPair.publicKey);
        const privateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

        this.identity = {
            nodeId,
            publicKey: Buffer.from(publicKey).toString("base64"),
            privateKey: Buffer.from(privateKey).toString("base64"),
            trustScore: 1,
            lastSync: new Date().toISOString(),
        };

        await this.saveIdentity();
        return this.identity;
    }

    async loadIdentity(): Promise<GridNodeIdentity | null> {
        try {
            const data = await fs.readFile(this.identityPath, "utf-8");
            this.identity = JSON.parse(data);
            return this.identity;
        } catch {
            return null;
        }
    }

    async saveIdentity(): Promise<void> {
        if (!this.identity) return;
        const dir = path.dirname(this.identityPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.identityPath, JSON.stringify(this.identity, null, 2));
    }

    getIdentity(): GridNodeIdentity | null {
        return this.identity;
    }
}
