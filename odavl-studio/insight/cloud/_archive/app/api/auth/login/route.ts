import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@odavl-studio/auth';
import { createPrismaAdapter } from '@/lib/auth-adapter';
import { withValidation } from '@/lib/validation/middleware';
import { loginSchema } from '@/lib/validation/schemas';
import { withRateLimit, authLimiter } from '@/lib/rate-limit';

/**
 * POST /api/auth/login
 * Login with email and password
 * Rate limited: 5 requests per 15 minutes
 */
export const POST = withRateLimit(
  authLimiter,
  withValidation(loginSchema, async (data, req) => {
  try {
    const { email, password } = data;

    // Use AuthService for login
    const adapter = createPrismaAdapter(prisma);
    const authService = new AuthService(adapter);

    const result = await authService.login({ email, password });
    const user = result.user;
    const tokens = { accessToken: result.accessToken, refreshToken: result.refreshToken };

    // Store session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookies
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken: tokens.accessToken,
    });

    response.cookies.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    });

    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
  })
);
