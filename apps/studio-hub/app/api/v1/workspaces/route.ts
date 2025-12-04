/**
 * Workspace List & Delete API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/auth/api-key';
import { prisma } from '@/lib/prisma';
import { StorageService } from '../../../../../../packages/storage/src';
import type { StorageConfig } from '../../../../../../packages/storage/src';

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
      action: 'api',
      endpoint,
      timestamp: new Date(),
    },
  });
}

/**
 * GET /api/v1/workspaces
 * List all user workspaces
 */
export async function GET(req: NextRequest) {
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

    // List workspaces
    const storage = createStorageService(userId);
    const workspaces = await storage.listWorkspaces(userId);

    // Track usage
    await trackUsage(userId, apiKeyId, '/api/v1/workspaces');

    return NextResponse.json({
      success: true,
      workspaces: workspaces.map((w) => ({
        name: w.workspaceName,
        totalSize: w.totalSize,
        fileCount: w.files.length,
        version: w.version,
        checksum: w.checksum,
        lastSyncAt: w.lastSyncAt,
        createdAt: w.files[0]?.lastModified,
      })),
      totalCount: workspaces.length,
    });
  } catch (error) {
    console.error('List workspaces error:', error);
    return NextResponse.json(
      { error: 'Failed to list workspaces' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/workspaces/:name
 * Delete workspace from cloud
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

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

    // Delete workspace
    const storage = createStorageService(userId);
    await storage.deleteWorkspace(name, userId);

    // Track usage
    await trackUsage(userId, apiKeyId, '/api/v1/workspaces/delete');

    return NextResponse.json({
      success: true,
      message: `Workspace '${name}' deleted successfully`,
    });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
