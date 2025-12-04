/**
 * Storage Management API
 * List and manage files in S3 storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Lazy import to avoid AWS initialization at build time
// import { cloudStorage, CloudStorageService } from "../../../../../../../packages/core/src/services/cloud-storage";
import { prisma } from '@/lib/prisma';

// Add runtime config to skip static generation
export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/storage/files?product={product}&maxKeys={100}
 * List files for user's organization
 */
export async function GET(request: NextRequest) {
  try {
    // Lazy import cloudStorage at runtime
    const { cloudStorage, CloudStorageService } = await import("../../../../../../../packages/core/src/services/cloud-storage");

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and org
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true },
    });

    if (!user?.orgId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 404 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const product = searchParams.get('product');
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100', 10);
    const continuationToken = searchParams.get('continuationToken') || undefined;

    // Build prefix
    let prefix = `${user.orgId}/`;
    if (product) {
      if (!['insight', 'autopilot', 'guardian'].includes(product)) {
        return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
      }
      prefix += `${product}/`;
    }

    // List files
    const result = await cloudStorage.listFiles({
      prefix,
      maxKeys,
      continuationToken,
    });

    // Parse metadata for each file
    const filesWithMetadata = result.files.map((file) => {
      const parsed = CloudStorageService.parseKey(file.key);
      return {
        ...file,
        parsed,
      };
    });

    return NextResponse.json({
      files: filesWithMetadata,
      nextToken: result.nextToken,
      isTruncated: result.isTruncated,
      count: filesWithMetadata.length,
    });
  } catch (error) {
    console.error('[Storage API] Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/storage/files?key={s3Key}
 * Delete file from S3
 */
export async function DELETE(request: NextRequest) {
  try {
    // Lazy import cloudStorage at runtime
    const { cloudStorage, CloudStorageService } = await import("../../../../../../../packages/core/src/services/cloud-storage");

    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and org
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true },
    });

    if (!user?.orgId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 404 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const s3Key = searchParams.get('key');

    if (!s3Key) {
      return NextResponse.json({ error: 'Missing required parameter: key' }, { status: 400 });
    }

    // Parse S3 key to verify ownership
    const keyMetadata = CloudStorageService.parseKey(s3Key);
    if (!keyMetadata) {
      return NextResponse.json({ error: 'Invalid S3 key format' }, { status: 400 });
    }

    // Verify user has access to this file
    if (keyMetadata.orgId !== user.orgId) {
      return NextResponse.json({ error: 'Access denied: File belongs to different organization' }, { status: 403 });
    }

    // Delete file
    await cloudStorage.deleteFile(s3Key);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
      key: s3Key,
    });
  } catch (error) {
    console.error('[Storage API] Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
