// ODAVL Insight Phase 12 – Batch 12.1 completed
// Normalizer for anonymizing and fingerprinting insight events

import type { InsightEvent } from './insightSchema';

/**
 * Normalizes an insight event by anonymizing paths and creating a unique signature
 */
export async function normalizeEvent(e: InsightEvent) {
    const shortMessage = e.error.message.toLowerCase();

    // Strip absolute paths from stack frames
    const frames = e.error.stack
        .slice(0, 5)
        .map(frame => frame.replace(/[A-Z]:[\\\/].+?[\\\/]/g, '').replace(/\/[^\/]+\//g, ''));

    // Create SHA-256 signature
    const signatureInput = `${e.error.type}|${shortMessage}|${frames.join('|')}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
        signature,
        type: e.error.type,
        shortMessage,
        frames,
        projectId: e.projectId,
        timestamp: e.timestamp,
    };
}
