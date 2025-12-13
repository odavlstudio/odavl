import { verifyPacket } from "./PeerVerifier";

export function runConsensus(peers: any[], key: string) {
    const votes = peers.map(p => verifyPacket(p, key));
    const approved = votes.filter(Boolean).length;
    const ratio = approved / peers.length;
    return { approved, total: peers.length, ratio, consensus: ratio > 0.5 };
}
