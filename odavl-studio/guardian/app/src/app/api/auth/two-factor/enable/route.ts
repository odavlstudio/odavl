/**
 * Enable Two-Factor Authentication API Route
 * 
 * POST /api/auth/two-factor/enable
 * 
 * Generates TOTP secret and QR code for user to scan with authenticator app.
 * Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enableTwoFactor, hashBackupCode } from '@/lib/two-factor';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const enableSchema = z.object({
    password: z.string().min(1, 'Password is required for verification'),
});

export async function POST(request: NextRequest) {
    try {
        // Check authentication via JWT token in Authorization header
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized - Missing token' },
                { status: 401 }
            );
        }

        // Extract email from JWT (simplified - add proper JWT verification in production)
        const token = authHeader.substring(7);
        // TODO: Verify JWT and extract email
        const userEmail = request.headers.get('x-user-email'); // Temporary - use JWT in production

        if (!userEmail) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validation = enableSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid request', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { password } = validation.data;

        // Verify password before enabling 2FA
        const member = await prisma.member.findFirst({
            where: { email: userEmail },
            select: { id: true, password: true, twoFactorEnabled: true },
        });

        if (!member) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if 2FA is already enabled
        if (member.twoFactorEnabled) {
            return NextResponse.json(
                { error: '2FA is already enabled' },
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

        // Generate 2FA credentials
        const { secret, qrCode, backupCodes } = await enableTwoFactor(userEmail);

        // Hash backup codes for storage
        const hashedBackupCodes = await Promise.all(
            backupCodes.map(code => hashBackupCode(code))
        );

        // Store secret and hashed backup codes in database (but don't enable yet)
        // User must verify they can generate valid token before we fully enable
        await prisma.member.update({
            where: { id: member.id },
            data: {
                twoFactorSecret: secret,
                twoFactorBackupCodes: hashedBackupCodes,
                twoFactorEnabled: false, // Will be enabled after verification
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                secret,
                qrCode,
                backupCodes, // Return plaintext codes - user should save these
            },
        });
    } catch (error) {
        console.error('Enable 2FA error:', error);
        return NextResponse.json(
            { error: 'Failed to enable 2FA' },
            { status: 500 }
        );
    }
}
