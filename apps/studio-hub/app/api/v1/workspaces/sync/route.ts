/**
 * Workspace Sync API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-key';
import { prisma } from '@/lib/prisma';
import { StorageService } from '@odavl-studio/storage';
import { S3Provider, AzureBlobProvider, LocalProvider } from '@odavl-studio/storage';

/**
 * Get storage provider
 */
function getStorageProvider() {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 's3') {
    return new S3Provider({
      region: process.env.AWS_REGION!,
      bucket: process.env.S3_BUCKET!,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    });
  }

  if (provider === 'azure') {
    return new AzureBlobProvider({
      accountName: process.env.AZURE_STORAGE_ACCOUNT!,
      accountKey: process.env.AZURE_STORAGE_KEY!,
      container: process.env.AZURE_CONTAINER!,
    });
  }

  return new LocalProvider({ bucket: '.odavl-storage' });
}

/**
 * Create storage service
 */
function createStorageService(userId: string) {
  const provider = getStorageProvider();
  return new StorageService(provider, userId, {
    enableCompression: true,
    enableEncryption: process.env.ENABLE_ENCRYPTION === 'true',
    encryptionKey: process.env.ENCRYPTION_KEY,
  });
}

/**
 * Track usage
 */
async function trackUsage(
  apiKeyId: string,
  endpoint: string,
  durationMs: number,
  bytesTransferred: number
) {
  await prisma.usageRecord.create({
    data: {
      apiKeyId,
      endpoint,
      timestamp: new Date(),
      responseTime: durationMs,
      statusCode: 200,
      metadata: { bytesTransferred },
    },
  });
}

/**
 * POST /api/v1/workspaces/sync
 * Sync workspace (push/pull/both)
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }

    const verification = await verifyApiKey(apiKey, 'workspace:write');
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    const { userId, apiKeyId } = verification;

    // Get sync options
    const body = await req.json();
    const {
      workspaceName,
      workspacePath,
      direction = 'both',
      conflictResolution = 'prompt',
      incremental = true,
    } = body;

    if (!workspaceName || !workspacePath) {
      return NextResponse.json(
        { error: 'Missing workspaceName or workspacePath' },
        { status: 400 }
      );
    }

    // Sync workspace
    const storage = createStorageService(userId);
    const result = await storage.syncWorkspace(workspaceName, workspacePath, {
      direction,
      conflictResolution,
      incremental,
    });

    // Calculate bytes transferred
    const bytesTransferred =
      result.uploaded.reduce((sum, f) => sum + f.size, 0) +
      result.downloaded.reduce((sum, f) => sum + f.size, 0);

    // Track usage
    const durationMs = Date.now() - startTime;
    await trackUsage(apiKeyId, '/api/v1/workspaces/sync', durationMs, bytesTransferred);

    return NextResponse.json({
      success: true,
      result: {
        uploaded: result.uploaded.length,
        downloaded: result.downloaded.length,
        deleted: result.deleted.length,
        conflicts: result.conflicts.length,
        duration: result.duration,
        bytesTransferred,
      },
      details: {
        uploadedFiles: result.uploaded.map((f) => f.path),
        downloadedFiles: result.downloaded.map((f) => f.path),
        deletedFiles: result.deleted,
        conflicts: result.conflicts.map((c) => ({
          path: c.path,
          resolution: c.resolution,
        })),
      },
    });
  } catch (error) {
    console.error('Sync workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to sync workspace' },
      { status: 500 }
    );
  }
}
