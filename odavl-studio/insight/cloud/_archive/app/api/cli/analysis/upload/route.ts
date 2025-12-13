/**
 * ODAVL Insight Cloud - CLI Analysis Upload Endpoint
 * Phase 3.0.3 - With JWT Authentication & Plan Binding
 * 
 * POST /api/cli/analysis/upload
 * 
 * Handles direct JSON analysis uploads from CLI with:
 * - JWT authentication required
 * - Real user + plan from database
 * - Quota enforcement based on user plan
 * - Privacy-sanitized payloads
 * - Graceful error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { 
  canUploadAnalysis, 
  remainingUploads, 
  getQuotaExceededMessage,
  type UsageData 
} from '@/lib/quota/insight-quota';
import { type InsightPlanType } from '@/lib/plans/insight-plans';
import { getUsage, incrementUsage as incrementUsageDB } from '@/lib/services/insight-usage.service';
import { withAuth, type AuthenticatedUser } from '@/lib/auth/jwt.middleware';

/**
 * Validation schema for analysis upload payload
 */
const uploadSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    branch: z.string().optional(),
    commit: z.string().optional(),
  }),
  analysis: z.object({
    timestamp: z.string(),
    issuesCount: z.number().int().min(0),
    severityCounts: z.object({
      critical: z.number().int().min(0),
      high: z.number().int().min(0),
      medium: z.number().int().min(0),
      low: z.number().int().min(0),
    }),
    detectorsRun: z.array(z.string()),
  }),
  issues: z.array(z.object({
    file: z.string(),
    line: z.number().int().min(1),
    column: z.number().int().min(0),
    message: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    detector: z.string(),
    ruleId: z.string().optional(),
  })),
  metadata: z.object({
    cliVersion: z.string().optional(),
    platform: z.string().optional(),
    nodeVersion: z.string().optional(),
  }).optional(),
});

type UploadPayload = z.infer<typeof uploadSchema>;

/**
 * Success response type
 */
interface UploadSuccessResponse {
  success: true;
  uploadId: string;
  dashboardUrl: string;
  quotaUsed: number;
  quotaRemaining: number;
  timestamp: string;
}

/**
 * Error response type
 */
interface UploadErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: {
    currentUsage?: number;
    planLimit?: number;
    upgradeUrl?: string;
    currentPlan?: string;
    requiredPlan?: string;
  };
}

/**
 * Real usage data retrieval from database
 */
async function getUserUsage(userId: string): Promise<UsageData> {
  const usage = await getUsage(userId);
  
  const now = new Date();
  const billingStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  return {
    uploadsThisMonth: usage.uploadsUsed,
    billingPeriodStart: billingStart,
    billingPeriodEnd: billingEnd,
  };
}

/**
 * Real usage increment with database persistence
 */
async function incrementUsage(userId: string): Promise<void> {
  await incrementUsageDB(userId);
}

/**
 * POST handler for analysis upload (protected by JWT authentication)
 */
export const POST = withAuth(async (req: NextRequest, user: AuthenticatedUser): Promise<NextResponse> => {
  try {
    // Step 1: Parse and validate payload
    const body = await req.json();
    const validation = uploadSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid upload payload',
          details: {
            errors: validation.error.errors,
          },
        } as any,
        { status: 400 }
      );
    }
    
    const payload = validation.data;
    
    // Step 3: Check quota
    const usage = await getUserUsage(user.userId);
    const quotaCheck = canUploadAnalysis(user.plan, usage);
    
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'QUOTA_EXCEEDED',
          message: quotaCheck.reason || getQuotaExceededMessage(user.plan, usage),
          details: {
            currentUsage: usage.uploadsThisMonth,
            planLimit: quotaCheck.limit,
            upgradeUrl: quotaCheck.upgradeUrl || '/pricing',
            currentPlan: user.plan,
            requiredPlan: quotaCheck.suggestedPlan,
          },
        } as UploadErrorResponse,
        { status: 429 } // 429 Too Many Requests
      );
    }
    
    // Step 4: Store analysis (mock - replace with real DB)
    const uploadId = randomUUID();
    const timestamp = new Date().toISOString();
    
    // TODO: Store in database
    console.log(`[Upload] Stored analysis: ${uploadId} for user: ${user.userId}`);
    console.log(`[Upload] Issues: ${payload.issues.length}, Project: ${payload.project.name}`);
    
    // Step 5: Increment usage counter
    await incrementUsage(user.userId);
    
    // Step 6: Calculate remaining quota
    const remaining = remainingUploads(user.plan, {
      ...usage,
      uploadsThisMonth: usage.uploadsThisMonth + 1,
    });
    
    // Step 7: Return success response
    return NextResponse.json(
      {
        success: true,
        uploadId,
        dashboardUrl: `https://cloud.odavl.com/analysis/${uploadId}`,
        quotaUsed: usage.uploadsThisMonth + 1,
        quotaRemaining: remaining === Infinity ? -1 : remaining, // -1 = unlimited
        timestamp,
      } as UploadSuccessResponse,
      { status: 201 }
    );
    
  } catch (error) {
    console.error('[Upload] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to process analysis upload',
      } as UploadErrorResponse,
      { status: 500 }
    );
  }
});

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
