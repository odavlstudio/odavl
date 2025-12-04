export function aggregateTrust(peers: any[]) {
    const all = peers.flatMap(p => p.data ?? []);
    const avg = all.reduce((a, e) => a + (e.trustScore ?? 1), 0) / (all.length || 1);
    return Number(avg.toFixed(2));
}
