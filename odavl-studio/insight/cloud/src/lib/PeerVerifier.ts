import crypto from "node:crypto";

export function verifyPacket(packet: any, key: string) {
    const { signature, ...data } = packet;
    const sig = crypto.createHmac("sha256", key).update(JSON.stringify(data)).digest("hex");
    return sig === signature;
}
