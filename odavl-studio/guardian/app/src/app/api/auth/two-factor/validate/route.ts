/**
 * Validate Two-Factor Authentication Token API Route
 * 
 * POST /api/auth/two-factor/validate
 * 
 * Validates TOTP token or backup code during login.
 * This is called AFTER username/password authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, verifyBackupCode } from '@/lib/two-factor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const validateSchema = z.object({
    email: z.string().email('Invalid email'),
    token: z.string().min(6, 'Token must be at least 6 characters'),
    isBackupCode: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validation = validateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { email, token, isBackupCode } = validation.data;

        // Get member with 2FA data
        const member = await prisma.member.findFirst({
            where: { email },
            select: {
                id: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
                twoFactorBackupCodes: true,
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (!member.twoFactorEnabled || !member.twoFactorSecret) {
            return NextResponse.json(
                { error: '2FA is not enabled for this user' },
                { status: 400 }
            );
        }

        let isValid = false;

        if (isBackupCode) {
            // Validate backup code
            const backupCodes = member.twoFactorBackupCodes as string[];

            for (const hashedCode of backupCodes) {
                if (await verifyBackupCode(token, hashedCode)) {
                    isValid = true;

                    // Remove used backup code
                    const updatedCodes = backupCodes.filter(code => code !== hashedCode);
                    await prisma.member.update({
                        where: { id: member.id },
                        data: { twoFactorBackupCodes: updatedCodes },
                    });

                    break;
                }
            }
        } else {
            // Validate TOTP token
            isValid = verifyToken(token, member.twoFactorSecret);
        }

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '2FA validation successful',
        });
    } catch (error) {
        console.error('Validate 2FA error:', error);
        return NextResponse.json(
            { error: 'Failed to validate 2FA token' },
            { status: 500 }
        );
    }
}
