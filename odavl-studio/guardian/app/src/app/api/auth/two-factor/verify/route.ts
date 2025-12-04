/**
 * Verify Two-Factor Authentication Setup API Route
 * 
 * POST /api/auth/two-factor/verify
 * 
 * Verifies that user can generate valid TOTP tokens before fully enabling 2FA.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/two-factor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const verifySchema = z.object({
    token: z.string().length(6, 'Token must be 6 digits').regex(/^\d{6}$/, 'Token must be numeric'),
});

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userEmail = request.headers.get('x-user-email');
        if (!userEmail) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = verifySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid token format', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { token } = validation.data;

        // Get member with 2FA secret
        const member = await prisma.member.findFirst({
            where: { email: userEmail },
            select: {
                id: true,
                twoFactorSecret: true,
                twoFactorEnabled: true,
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (!member.twoFactorSecret) {
            return NextResponse.json(
                { error: '2FA setup not initiated. Call /api/auth/two-factor/enable first' },
                { status: 400 }
            );
        }

        // Verify the token
        const isValid = verifyToken(token, member.twoFactorSecret);

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        // Token is valid - fully enable 2FA
        await prisma.member.update({
            where: { id: member.id },
            data: {
                twoFactorEnabled: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Two-factor authentication enabled successfully',
        });
    } catch (error) {
        console.error('Verify 2FA error:', error);
        return NextResponse.json(
            { error: 'Failed to verify 2FA token' },
            { status: 500 }
        );
    }
}
