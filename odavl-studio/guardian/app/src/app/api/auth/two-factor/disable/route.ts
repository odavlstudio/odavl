/**
 * Disable Two-Factor Authentication API Route
 * 
 * POST /api/auth/two-factor/disable
 * 
 * Disables 2FA for authenticated user after password verification.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const disableSchema = z.object({
    password: z.string().min(1, 'Password is required for verification'),
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
        const validation = disableSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { password } = validation.data;

        // Get member
        const member = await prisma.member.findFirst({
            where: { email: userEmail },
            select: {
                id: true,
                password: true,
                twoFactorEnabled: true,
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (!member.twoFactorEnabled) {
            return NextResponse.json(
                { error: '2FA is not enabled' },
                { status: 400 }
            );
        }

        // Verify password
        if (!member.password) {
            return NextResponse.json(
                { error: 'Password authentication not configured' },
                { status: 400 }
            );
        }

        const bcrypt = await import('bcrypt');
        const passwordValid = await bcrypt.compare(password, member.password);

        if (!passwordValid) {
            return NextResponse.json(
                { error: 'Invalid password' },
                { status: 401 }
            );
        }

        // Disable 2FA and clear secrets
        await prisma.member.update({
            where: { id: member.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorBackupCodes: [],
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Two-factor authentication disabled successfully',
        });
    } catch (error) {
        console.error('Disable 2FA error:', error);
        return NextResponse.json(
            { error: 'Failed to disable 2FA' },
            { status: 500 }
        );
    }
}
