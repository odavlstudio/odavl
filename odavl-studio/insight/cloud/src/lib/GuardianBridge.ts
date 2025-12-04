import crypto from "node:crypto";
import { loadTrustAnchor } from "./TrustAnchor";

export function guardianSign(data: any) {
    const { key } = loadTrustAnchor();
    const sig = crypto.createHmac("sha256", key).update(JSON.stringify(data)).digest("hex");
    return { ...data, guardianSig: sig };
}

export function guardianVerify(packet: any) {
    const { key } = loadTrustAnchor();
    const sig = crypto.createHmac("sha256", key).update(JSON.stringify({ ...packet, guardianSig: undefined })).digest("hex");
    return sig === packet.guardianSig;
}
