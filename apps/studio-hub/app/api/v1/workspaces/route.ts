/**
 * Workspace List & Delete API Routes
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
  durationMs: number
) {
  await prisma.usageRecord.create({
    data: {
      apiKeyId,
      endpoint,
      timestamp: new Date(),
      responseTime: durationMs,
      statusCode: 200,
    },
  });
}

/**
 * GET /api/v1/workspaces
 * List all user workspaces
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 401 });
    }

    const verification = await verifyApiKey(apiKey, 'workspace:read');
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    const { userId, apiKeyId } = verification;

    // List workspaces
    const storage = createStorageService(userId);
    const workspaces = await storage.listWorkspaces();

    // Track usage
    const durationMs = Date.now() - startTime;
    await trackUsage(apiKeyId, '/api/v1/workspaces', durationMs);

    return NextResponse.json({
      success: true,
      workspaces: workspaces.map((w) => ({
        name: w.name,
        totalSize: w.totalSize,
        fileCount: w.files.length,
        version: w.version,
        checksum: w.checksum,
        lastSyncAt: w.lastSyncAt,
        createdAt: w.createdAt,
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
  { params }: { params: { name: string } }
) {
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

    // Delete workspace
    const storage = createStorageService(userId);
    await storage.deleteWorkspace(params.name);

    // Track usage
    const durationMs = Date.now() - startTime;
    await trackUsage(apiKeyId, '/api/v1/workspaces/delete', durationMs);

    return NextResponse.json({
      success: true,
      message: `Workspace '${params.name}' deleted successfully`,
    });
  } catch (error) {
    console.error('Delete workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
