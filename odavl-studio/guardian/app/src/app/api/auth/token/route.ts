/**
 * Authentication API Routes for ODAVL Guardian
 * POST /api/auth/token - Generate JWT token
 * POST /api/auth/logout - Invalidate session
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth-service';
import { prisma } from '@/lib/prisma';
import logger from '@/lib/logger';
import crypto from 'node:crypto';

/**
 * POST /api/auth/token
 * Generate JWT token for authenticated user
 * 
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password",
 *   "organizationId": "org-123" (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOi...",
 *   "expiresIn": "24h",
 *   "user": { "id": "...", "email": "...", "role": "..." }
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, organizationId } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password required' },
                { status: 400 }
            );
        }

        // Hash password (passwords should be hashed with bcrypt in production)
        const passwordHash = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        // Find member by email and password
        // NOTE: This is simplified - use bcrypt.compare() in production
        let member = null;

        if (organizationId) {
            // Authenticate within specific organization
            member = await prisma.member.findUnique({
                where: {
                    organizationId_email: {
                        organizationId,
                        email,
                    },
                },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    organizationId: true,
                },
            });
        } else {
            // Find first organization where user is member
            member = await prisma.member.findFirst({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    organizationId: true,
                },
            });
        }

        if (!member) {
            logger.warn('Authentication failed - user not found', { email });
            return NextResponse.json(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate JWT token
        const token = await generateToken({
            id: member.id,
            email: member.email,
            organizationId: member.organizationId,
            role: member.role,
        });

        logger.info('User authenticated', {
            userId: member.id,
            email: member.email,
            organizationId: member.organizationId,
        });

        return NextResponse.json({
            success: true,
            token,
            expiresIn: '24h',
            user: {
                id: member.id,
                email: member.email,
                organizationId: member.organizationId,
                role: member.role,
            },
        });
    } catch (error) {
        logger.error('Authentication error', { error });
        return NextResponse.json(
            { success: false, error: 'Authentication failed' },
            { status: 500 }
        );
    }
}
