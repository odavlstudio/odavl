import crypto from "node:crypto";

export function signPacket(data: any, key: string) {
    const sig = crypto.createHmac("sha256", key).update(JSON.stringify(data)).digest("hex");
    return { ...data, signature: sig };
}

export async function postPacket(url: string, packet: any) {
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(packet) });
}
