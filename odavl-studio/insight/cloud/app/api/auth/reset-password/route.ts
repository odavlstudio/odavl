/**
 * Reset Password Endpoint
 * POST /api/auth/reset-password
 * Resets user password with valid token
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword } from '@odavl-studio/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join('. ') },
        { status: 400 }
      );
    }

    // Find user by reset token
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token expired
    if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Reset token has expired. Please request a new one' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return NextResponse.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
