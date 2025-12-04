/**
 * GDPR Right to Deletion API
 *
 * Provides users with right to be forgotten (GDPR Article 17 - Right to Erasure)
 * Implements soft delete with 30-day grace period
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sender';
import { createAuditLog, AuditAction } from '@/lib/security/audit-logger';
import { z } from 'zod';
import { withErrorHandler, ApiErrors, validateRequestBody } from '@/lib/api';
import { scheduleUserDataDeletion } from '@/lib/gdpr/data-fetcher';

const deleteSchema = z.object({
  confirmEmail: z.string().email(),
  reason: z.string().optional(),
});

/**
 * POST /api/gdpr/delete
 *
 * Request account deletion (soft delete with 30-day grace period)
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return ApiErrors.unauthorized('Authentication required');
  }

  const validated = await validateRequestBody(req, deleteSchema);

  // Check if validation returned an error response
  if (validated instanceof NextResponse) {
    return validated;
  }

  const { confirmEmail, reason } = validated.data;

  // Verify email confirmation
  if (confirmEmail !== session.user.email) {
    return ApiErrors.badRequest('Email confirmation does not match');
  }

  // Check if already marked for deletion
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, deletedAt: true },
  });

  if (!user) {
    return ApiErrors.notFound('User not found');
  }

  if (user.deletedAt) {
    return NextResponse.json(
      {
        error: {
          code: 'CONFLICT',
          message: 'Account already scheduled for deletion',
          details: { deletionDate: user.deletedAt },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 409 }
    );
  }

  // Schedule deletion with 30-day grace period
  const deletionDate = await scheduleUserDataDeletion(session.user.id, 30);

  // Create audit log
  await createAuditLog({
    action: AuditAction.USER_DELETED,
    userId: session.user.id,
    metadata: {
      reason,
      gracePeriod: '30 days',
      permanentDeletionDate: deletionDate.toISOString(),
    },
  });

  // Send confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Account Deletion Scheduled - ODAVL Studio',
      html: generateDeletionEmailHTML(user.name || user.email, deletionDate),
    });
  } catch (emailError) {
    logger.error('Failed to send deletion confirmation email', {
      userId: session.user.id,
      error: emailError,
    });
    // Continue even if email fails
  }

  logger.info('Account deletion scheduled', {
    userId: session.user.id,
    email: user.email,
    deletionDate: deletionDate.toISOString(),
    reason,
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Account deletion scheduled',
      deletionDate: deletionDate.toISOString(),
      gracePeriodDays: 30,
      cancellationInstructions:
        'To cancel this deletion, contact support@odavl.studio within 30 days',
    },
    { status: 200 }
  );
}, 'POST /api/gdpr/delete');

/**
 * Generate deletion confirmation email HTML
 */
function generateDeletionEmailHTML(userName: string, deletionDate: Date): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { padding: 30px; background: #f9fafb; border-radius: 0 0 8px 8px; }
      .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .info-box { background: #fff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
      .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⚠️ Account Deletion Scheduled</h1>
      </div>
      <div class="content">
        <p>Hello ${userName},</p>

        <p>We've received your request to delete your ODAVL Studio account. Your data deletion has been scheduled.</p>

        <div class="warning-box">
          <strong>⏰ Deletion Date:</strong> ${deletionDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}<br/>
          <strong>📅 Grace Period:</strong> 30 days
        </div>

        <div class="info-box">
          <h3>What This Means:</h3>
          <ul>
            <li>Your account will be permanently deleted after 30 days</li>
            <li>All personal data will be erased (GDPR compliant)</li>
            <li>API keys and integrations will be revoked</li>
            <li>Projects and data will be permanently removed</li>
          </ul>
        </div>

        <div class="info-box">
          <h3>Changed Your Mind?</h3>
          <p>You can cancel this deletion request within the 30-day grace period by contacting our support team:</p>
          <a href="mailto:support@odavl.studio" class="button">Contact Support</a>
        </div>

        <p>If you have any questions, please don't hesitate to reach out.</p>

        <p>Best regards,<br/>The ODAVL Studio Team</p>
      </div>
      <div class="footer">
        <p>ODAVL Studio | Autonomous Code Quality Platform</p>
        <p>This is an automated message. Please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}
