import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    // Try to find .odavl/guardian/handoff-to-autopilot.json
    const possiblePaths = [
      join(process.cwd(), '.odavl', 'guardian', 'handoff-to-autopilot.json'),
      join(process.cwd(), '..', '..', '.odavl', 'guardian', 'handoff-to-autopilot.json'),
      join(process.cwd(), '..', '..', '..', '.odavl', 'guardian', 'handoff-to-autopilot.json'),
    ];

    let handoffPath: string | null = null;

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        handoffPath = path;
        break;
      }
    }

    if (!handoffPath) {
      return NextResponse.json(
        { error: 'No handoff file found' },
        { status: 404 }
      );
    }

    const content = await readFile(handoffPath, 'utf8');
    const handoff = JSON.parse(content);

    return NextResponse.json(handoff);
  } catch (error) {
    console.error('Error loading handoff:', error);
    return NextResponse.json(
      { error: 'Failed to load handoff file' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Trigger a new Guardian analysis
    // This would integrate with the Guardian CLI
    
    const body = await request.json();
    const { path, options } = body;

    // TODO: Execute Guardian analysis
    // For now, return mock response
    return NextResponse.json({
      message: 'Analysis started',
      runId: Date.now().toString(),
    });
  } catch (error) {
    console.error('Error starting analysis:', error);
    return NextResponse.json(
      { error: 'Failed to start analysis' },
      { status: 500 }
    );
  }
}
