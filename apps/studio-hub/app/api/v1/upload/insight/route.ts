/**
 * Upload Endpoint for Insight
 * POST /api/v1/upload/insight
 *
 * Receives and stores Insight analysis results
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
    const uploadId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in database based on type
    switch (type) {
      case 'analysis-results': {
        // Create Insight run
        const run = await prisma.insightRun.create({
          data: {
            projectId: metadata.projectId || null,
            userId: apiKeyRecord.userId,
            timestamp: new Date(metadata.timestamp || Date.now()),
            diagnosticsCount: metadata.diagnosticsCount || 0,
            results: parsedData,
            status: 'completed',
          },
        });

        // Create issues
        if (parsedData.diagnostics) {
          for (const [filePath, diagnostics] of Object.entries(parsedData.diagnostics)) {
            for (const diagnostic of (diagnostics as any[])) {
              await prisma.insightIssue.create({
                data: {
                  runId: run.id,
                  projectId: metadata.projectId || null,
                  filePath,
                  severity: diagnostic.severity || 'warning',
                  message: diagnostic.message || '',
                  source: diagnostic.source || 'ODAVL',
                  line: diagnostic.range?.start?.line || 0,
                  column: diagnostic.range?.start?.character || 0,
                  code: diagnostic.code?.toString() || null,
                },
              });
            }
          }
        }

        return NextResponse.json({
          uploadId,
          runId: run.id,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/insight/runs/${run.id}`,
        });
      }

      case 'ml-training': {
        // Store ML training data
        await prisma.insightMLData.create({
          data: {
            userId: apiKeyRecord.userId,
            timestamp: new Date(metadata.timestamp || Date.now()),
            data: parsedData,
          },
        });

        return NextResponse.json({
          uploadId,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/insight/ml-data`,
        });
      }

      default: {
        // Generic storage
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
