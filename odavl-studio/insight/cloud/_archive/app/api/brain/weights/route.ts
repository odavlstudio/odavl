/**
 * Fusion Weights API - GET /api/brain/weights
 * Phase Ω-P1: Fetch current fusion weights from Brain
 */

import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

export async function GET() {
  try {
    const weightsPath = path.join(
      process.cwd(),
      '.odavl',
      'brain-history',
      'fusion-weights.json'
    );

    let weights = {
      nn: 0.25,
      lstm: 0.15,
      mtl: 0.30,
      bayesian: 0.15,
      heuristic: 0.15,
    };

    if (existsSync(weightsPath)) {
      const data = await readFile(weightsPath, 'utf-8');
      weights = JSON.parse(data);
    }

    return NextResponse.json({
      weights,
      source: existsSync(weightsPath) ? 'learned' : 'default',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Brain API] Failed to load weights:', error);
    return NextResponse.json(
      { error: 'Failed to load weights', message: String(error) },
      { status: 500 }
    );
  }
}
