/**
 * Request Password Reset Endpoint
 * POST /api/auth/request-password-reset
 * Generates reset token and sends email with reset link
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive a password reset link',
      });
    }

    // Generate password reset token (random 32 bytes hex)
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    });

    // Send password reset email
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

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
      await emailService.sendPasswordResetEmail(
        user.email,
        user.name || 'User',
        resetToken,
        baseUrl
      );
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Return error if email fails
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to request password reset' },
      { status: 500 }
    );
  }
}
