/**
 * Authentication Middleware for Next.js
 * Use with @odavl-studio/auth package
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@odavl-studio/auth';

const AUTH_SECRET = process.env.ODAVL_AUTH_SECRET || 'odavl-secret-change-in-production';

export async function authMiddleware(request: NextRequest) {
    const token = request.cookies.get('odavl_token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token, AUTH_SECRET);

    if (!user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Attach user to request headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
