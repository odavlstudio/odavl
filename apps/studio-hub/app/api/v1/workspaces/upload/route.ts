/**
 * Workspace API Routes - Upload, Download, Sync, List, Delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/auth/api-key';
import { prisma } from '@/lib/prisma';
import { StorageService } from '../../../../../../../packages/storage/src';
import type { StorageConfig } from '../../../../../../../packages/storage/src';

/**
 * Get storage config based on env config
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

  // Default: local (for development)
  return {
    provider: 'local',
    bucket: '.odavl-storage',
  };
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
      action: 'upload',
      endpoint,
      timestamp: new Date(),
    },
  });
}
/**
 * POST /api/v1/workspaces/upload
 * Upload workspace to cloud
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

    // Get workspace data from request
    const body = await req.json();
    const { workspacePath } = body;

    if (!workspacePath) {
      return NextResponse.json(
        { error: 'Missing workspacePath' },
        { status: 400 }
      );
    }

    // Upload workspace
    const storage = createStorageService(userId);
    const metadata = await storage.uploadWorkspace(workspacePath, userId);

    // Track usage
    await trackUsage(userId, apiKeyId, '/api/v1/workspaces/upload');

    return NextResponse.json({
      success: true,
      workspace: {
        name: metadata.workspaceName,
        totalSize: metadata.totalSize,
        fileCount: metadata.files.length,
        version: metadata.version,
        checksum: metadata.checksum,
        uploadedAt: metadata.lastSyncAt,
      },
    });
  } catch (error) {
    console.error('Upload workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to upload workspace' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/workspaces/download/:name
 * Download workspace from cloud
 */
export async function GET(
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

    // Get destination path from query
    const destinationPath = req.nextUrl.searchParams.get('path');
    if (!destinationPath) {
      return NextResponse.json(
        { error: 'Missing destination path' },
        { status: 400 }
      );
    }

    // Download workspace
    const storage = createStorageService(userId);
    const metadata = await storage.downloadWorkspace(name, userId, destinationPath);

    // Track usage
    await trackUsage(userId, apiKeyId, '/api/v1/workspaces/download');

    return NextResponse.json({
      success: true,
      workspace: {
        name: metadata.workspaceName,
        totalSize: metadata.totalSize,
        fileCount: metadata.files.length,
        version: metadata.version,
        checksum: metadata.checksum,
        downloadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Download workspace error:', error);
    return NextResponse.json(
      { error: 'Failed to download workspace' },
      { status: 500 }
    );
  }
}
