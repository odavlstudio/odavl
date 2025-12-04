/**
 * Workspace API Routes - Upload, Download, Sync, List, Delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/api-key';
import { prisma } from '@/lib/prisma';
import { StorageService } from '@odavl-studio/storage';
import { S3Provider, AzureBlobProvider, LocalProvider } from '@odavl-studio/storage';

/**
 * Get storage provider based on env config
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

  // Default: local (for development)
  return new LocalProvider({
    bucket: '.odavl-storage',
  });
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
 * POST /api/v1/workspaces/upload
 * Upload workspace to cloud
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

    // Get workspace data from request
    const body = await req.json();
    const { workspaceName, workspacePath } = body;

    if (!workspaceName || !workspacePath) {
      return NextResponse.json(
        { error: 'Missing workspaceName or workspacePath' },
        { status: 400 }
      );
    }

    // Upload workspace
    const storage = createStorageService(userId);
    const metadata = await storage.uploadWorkspace(workspaceName, workspacePath);

    // Track usage
    const durationMs = Date.now() - startTime;
    await trackUsage(apiKeyId, '/api/v1/workspaces/upload', durationMs, metadata.totalSize);

    return NextResponse.json({
      success: true,
      workspace: {
        name: metadata.name,
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
  { params }: { params: { name: string } }
) {
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
    const metadata = await storage.downloadWorkspace(params.name, destinationPath);

    // Track usage
    const durationMs = Date.now() - startTime;
    await trackUsage(apiKeyId, '/api/v1/workspaces/download', durationMs, metadata.totalSize);

    return NextResponse.json({
      success: true,
      workspace: {
        name: metadata.name,
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
