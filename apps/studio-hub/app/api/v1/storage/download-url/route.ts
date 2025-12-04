/**
 * S3 Download URL Generation API
 * Generate presigned URLs for downloading files from S3
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
 * GET /api/v1/storage/download-url?key={s3Key}&expiresIn={seconds}
 * Generate presigned URL for downloading file from S3
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
    const s3Key = searchParams.get('key');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600', 10);

    if (!s3Key) {
      return NextResponse.json({ error: 'Missing required parameter: key' }, { status: 400 });
    }

    // Parse S3 key to verify ownership
    const keyMetadata = CloudStorageService.parseKey(s3Key);
    if (!keyMetadata) {
      return NextResponse.json({ error: 'Invalid S3 key format' }, { status: 400 });
    }

    // Verify user has access to this file (belongs to their org)
    if (keyMetadata.orgId !== user.orgId) {
      return NextResponse.json({ error: 'Access denied: File belongs to different organization' }, { status: 403 });
    }

    // Check if file exists
    const exists = await cloudStorage.fileExists(s3Key);
    if (!exists) {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 });
    }

    // Generate presigned download URL
    const downloadUrl = await cloudStorage.generateDownloadUrl(s3Key, expiresIn);

    // Get file metadata
    const metadata = await cloudStorage.getFileMetadata(s3Key);

    return NextResponse.json({
      downloadUrl,
      expiresIn,
      metadata: {
        filename: keyMetadata.filename,
        size: metadata.size,
        contentType: metadata.contentType,
        lastModified: metadata.lastModified,
      },
    });
  } catch (error) {
    console.error('[Storage API] Error generating download URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
