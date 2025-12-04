/**
 * Workspace Sync API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/auth/api-key';
import { prisma } from '@/lib/prisma';
import { StorageService } from '../../../../../../../packages/storage/src';
import type { StorageConfig } from '../../../../../../../packages/storage/src';

/**
 * Get storage config
 */
function getStorageConfig(): StorageConfig {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 's3') {
    return {
      provider: 's3',
      region: process.env.AWS_REGION!,
      bucket: process.env.S3_BUCKET!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    };
  }

  if (provider === 'azure') {
    return {
      provider: 'azure',
      container: process.env.AZURE_CONTAINER!,
      credentials: {
        accountName: process.env.AZURE_STORAGE_ACCOUNT!,
        accountKey: process.env.AZURE_STORAGE_KEY!,
      },
    };
  }

  return { provider: 'local', bucket: '.odavl-storage' };
}

/**
 * Create storage service
 */
function createStorageService(userId: string) {
  const config = getStorageConfig();
  return new StorageService(config);
}

/**
 * Track usage
 */
/**
 * Track usage
 */
async function trackUsage(
  userId: string,
  apiKeyId: string,
  endpoint: string
) {
  await prisma.usageRecord.create({
    data: {
      userId,
      apiKeyId,
      product: 'storage',
      action: 'sync',
      endpoint,
      timestamp: new Date(),
    },
  });
}

/**
 * POST /api/v1/workspaces/sync
 * Sync workspace (push/pull/both)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }

    const verification = await verifyApiKey(apiKey);
    if (!verification.valid || !verification.userId || !verification.apiKeyId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const { userId, apiKeyId } = verification;

    // Get sync options
    const body = await req.json();
    const {
      workspacePath,
      direction = 'both',
      conflictResolution = 'prompt',
      incremental = true,
    } = body;

    if (!workspacePath) {
      return NextResponse.json(
        { error: 'Missing workspacePath' },
        { status: 400 }
      );
    }

    // Sync workspace
    const storage = createStorageService(userId);
    const result = await storage.syncWorkspace(workspacePath, userId, {
      direction,
      conflictResolution,
      incremental,
    });

    // Track usage
    await trackUsage(userId, apiKeyId, '/api/v1/workspaces/sync');

    return NextResponse.json({
      success: true,
      result: {
        uploaded: result.uploaded.length,
        downloaded: result.downloaded.length,
        deleted: result.deleted.length,
        conflicts: result.conflicts.length,
        duration: result.duration,
      },
      details: {
        uploadedFiles: result.uploaded,
        downloadedFiles: result.downloaded,
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
