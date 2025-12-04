/**
 * Upload Endpoint for Guardian
 * POST /api/v1/upload/guardian
 *
 * Receives and stores Guardian test results and screenshots
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

    // Create upload record
    const uploadId = `guardian_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in database based on type
    switch (type) {
      case 'test-results': {
        const parsedData = JSON.parse(resultData);

        // Create Guardian test run
        const test = await prisma.guardianTest.create({
          data: {
            projectId: metadata.projectId || null,
            userId: apiKeyRecord.userId,
            testRunId: metadata.testRunId || uploadId,
            timestamp: new Date(metadata.timestamp || Date.now()),
            url: metadata.url || '',
            environment: metadata.environment || 'production',
            testsCount: metadata.testsCount || 0,
            passed: metadata.passed || 0,
            failed: metadata.failed || 0,
            results: parsedData,
            status: 'completed',
          },
        });

        return NextResponse.json({
          uploadId,
          testId: test.id,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/guardian/tests/${test.id}`,
        });
      }

      case 'screenshot': {
        // Store screenshot (base64)
        await prisma.guardianScreenshot.create({
          data: {
            userId: apiKeyRecord.userId,
            projectId: metadata.projectId || null,
            testRunId: metadata.testRunId || uploadId,
            fileName: metadata.fileName || 'screenshot.png',
            data: resultData, // base64 image data
            timestamp: new Date(metadata.timestamp || Date.now()),
          },
        });

        return NextResponse.json({
          uploadId,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/guardian/screenshots/${uploadId}`,
        });
      }

      case 'lighthouse-report':
      case 'accessibility-report': {
        const parsedData = JSON.parse(resultData);

        // Store report
        await prisma.guardianReport.create({
          data: {
            userId: apiKeyRecord.userId,
            projectId: metadata.projectId || null,
            testRunId: metadata.testRunId || uploadId,
            type: metadata.type || type.replace('-report', ''),
            timestamp: new Date(metadata.timestamp || Date.now()),
            data: parsedData,
          },
        });

        return NextResponse.json({
          uploadId,
          url: `${process.env.NEXT_PUBLIC_APP_URL}/guardian/reports/${uploadId}`,
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
