export interface GridPacket {
    nodeId: string;
    timestamp: string;
    type: string;
    payload: unknown;
    signature: string;
}

export class GridProtocol {
    async signMessage(data: string, privateKeyBase64: string): Promise<string> {
        const privateKeyBuffer = Buffer.from(privateKeyBase64, "base64");
        const privateKey = await crypto.subtle.importKey(
            "pkcs8",
            privateKeyBuffer,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256",
            },
            false,
            ["sign"]
        );

        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", privateKey, dataBuffer);

        return Buffer.from(signature).toString("base64");
    }

    async verifyMessage(signature: string, data: string, publicKeyBase64: string): Promise<boolean> {
        try {
            const publicKeyBuffer = Buffer.from(publicKeyBase64, "base64");
            const publicKey = await crypto.subtle.importKey(
                "spki",
                publicKeyBuffer,
                {
                    name: "RSASSA-PKCS1-v1_5",
                    hash: "SHA-256",
                },
                false,
                ["verify"]
            );

            const signatureBuffer = Buffer.from(signature, "base64");
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);

            return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signatureBuffer, dataBuffer);
        } catch {
            return false;
        }
    }

    async createPacket(
        type: string,
        payload: unknown,
        nodeId: string,
        privateKey: string
    ): Promise<GridPacket> {
        const timestamp = new Date().toISOString();
        const dataToSign = JSON.stringify({ nodeId, timestamp, type, payload });
        const signature = await this.signMessage(dataToSign, privateKey);

        return {
            nodeId,
            timestamp,
            type,
            payload,
            signature,
        };
    }
}
