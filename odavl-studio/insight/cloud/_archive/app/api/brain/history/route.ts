/**
 * Brain History API - GET /api/brain/history
 * Phase Ω-P1: Fetch recent Brain training history
 */

import { NextRequest, NextResponse } from 'next/server';
import { BrainHistoryStore } from '@odavl-studio/brain/learning';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);

    const store = new BrainHistoryStore(process.cwd());
    const samples = await store.getRecentSamples(limit);

    return NextResponse.json({
      samples,
      count: samples.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Brain API] Failed to load history:', error);
    return NextResponse.json(
      { error: 'Failed to load history', message: String(error) },
      { status: 500 }
    );
  }
}
