/**
 * Upload Endpoint for Autopilot
 * POST /api/v1/upload/autopilot
 *
 * Receives and stores Autopilot ledgers and snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { gunzip } from 'zlib';
import { promisify } from 'util';

const gunzipAsync = promisify(gunzip);

export async function POST(request: NextRequest) {
  try {
    // Authenticate with API key
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = authHeader.substring(7);

    // Validate API key
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKey },
      include: { user: true },
    });

    if (!apiKeyRecord || apiKeyRecord.revokedAt) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    // Parse request body
    const { type, data, compressed, metadata } = await request.json();

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Decompress if needed
    let resultData = data;
    if (compressed) {
      const buffer = Buffer.from(data, 'base64');
      const decompressed = await gunzipAsync(buffer);
      resultData = decompressed.toString('utf8');
    }

    // Parse result data
    const parsedData = JSON.parse(resultData);

    // Create upload record
    const uploadId = `autopilot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in database based on type
    switch (type) {
      case 'ledger': {
        // Create Autopilot run
        const run = await prisma.autopilotRun.create({
          data: {
            projectId: metadata.projectId || null,
            userId: apiKeyRecord.userId,
            runId: metadata.runId || uploadId,
            timestamp: new Date(metadata.timestamp || Date.now()),
            phase: metadata.phase || 'completed',
            editsCount: metadata.editsCount || 0,
            ledger: parsedData,
            status: 'completed',
          },
        });

        return NextResponse.json({
          uploadId,
          runId: run.id,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/autopilot/runs/${run.id}`,
        });
      }

      case 'snapshot': {
        // Store snapshot
        await prisma.autopilotSnapshot.create({
          data: {
            userId: apiKeyRecord.userId,
            projectId: metadata.projectId || null,
            snapshotId: metadata.snapshotId || uploadId,
            timestamp: new Date(metadata.timestamp || Date.now()),
            filesCount: metadata.filesCount || 0,
            data: parsedData,
          },
        });

        return NextResponse.json({
          uploadId,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/autopilot/snapshots`,
        });
      }

      case 'recipe-trust': {
        // Store recipe trust scores
        await prisma.autopilotRecipeTrust.create({
          data: {
            userId: apiKeyRecord.userId,
            projectId: metadata.projectId || null,
            timestamp: new Date(metadata.timestamp || Date.now()),
            data: parsedData,
          },
        });

        return NextResponse.json({
          uploadId,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/autopilot/recipes`,
        });
      }

      default: {
        return NextResponse.json({
          uploadId,
          message: 'Data received',
        });
      }
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
