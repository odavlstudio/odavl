/**
 * Email Verification Endpoint
 * GET /api/auth/verify-email?token=xxx
 * Verifies user's email address and sends welcome email
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find user by verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      // Redirect to success page anyway
      return NextResponse.redirect(new URL('/auth/verified?already=true', request.url));
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null, // Clear token after use
      },
    });

    // Send welcome email (optional - can be done in background)
    try {
      const { EmailService } = await import('@odavl-studio/email');
      
      const emailService = new EmailService({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASSWORD || '',
        },
        from: {
          name: 'ODAVL Studio',
          email: process.env.SMTP_FROM || 'noreply@odavl.com',
        },
      });

      await emailService.sendWelcomeEmail(user.email, user.name || 'User');
    } catch (emailError) {
      // Log error but don't fail verification
      console.error('Failed to send welcome email:', emailError);
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verified', request.url));
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
