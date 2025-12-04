/**
 * S3 Presigned URL Generation API
 * Generate upload URLs for direct client-to-S3 uploads
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { cloudStorage, CloudStorageService } from '@odavl-studio/core/services/cloud-storage';
import { requireQuota } from '@odavl-studio/core/middleware/quota-check';
import { usageTrackingService } from '@odavl-studio/core/services/usage-tracking';
import { prisma } from '@/lib/prisma';

interface GenerateUploadUrlRequest {
  product: 'insight' | 'autopilot' | 'guardian';
  filename: string;
  contentType: string;
  metadata?: Record<string, string>;
}

/**
 * POST /api/v1/storage/upload-url
 * Generate presigned URL for direct S3 upload
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
    }

    // Get user and org
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, orgId: true },
    });

    if (!user?.orgId) {
      return NextResponse.json({ error: 'User not associated with organization' }, { status: 404 });
    }

    // Parse request body
    const body: GenerateUploadUrlRequest = await request.json();
    const { product, filename, contentType, metadata = {} } = body;

    // Validate required fields
    if (!product || !filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing required fields: product, filename, contentType' },
        { status: 400 }
      );
    }

    // Validate product
    if (!['insight', 'autopilot', 'guardian'].includes(product)) {
      return NextResponse.json(
        { error: 'Invalid product. Must be: insight, autopilot, or guardian' },
        { status: 400 }
      );
    }

    // Check quota before generating URL
    const quotaCheck = await requireQuota(
      { ...request, headers: new Headers({ 'x-organization-id': user.orgId }) } as any,
      { product }
    );

    if (quotaCheck) {
      // Quota exceeded
      return quotaCheck;
    }

    // Generate S3 key
    const s3Key = CloudStorageService.generateKey(user.orgId, product, user.id, filename);

    // Add metadata
    const enhancedMetadata = {
      ...metadata,
      userId: user.id,
      orgId: user.orgId,
      product,
      uploadedAt: new Date().toISOString(),
    };

    // Generate presigned upload URL (valid for 1 hour)
    const uploadUrl = await cloudStorage.generateUploadUrl({
      key: s3Key,
      contentType,
      expiresIn: 3600, // 1 hour
      metadata: enhancedMetadata,
    });

    // Track usage
    await usageTrackingService.trackOperation(
      user.orgId,
      user.id,
      product,
      'storage.upload-url-generated',
      { filename, s3Key }
    );

    // Return presigned URL and key
    return NextResponse.json({
      uploadUrl,
      s3Key,
      expiresIn: 3600,
      instructions: {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        note: 'Upload file directly to this URL using PUT request. No additional auth needed.',
      },
    });
  } catch (error) {
    console.error('[Storage API] Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
