import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit';

// Environment variable validation
const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'NEXT_PUBLIC_SOCKET_URL',
];

export function validateEnv() {
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

// Security headers middleware
export function securityHeaders(response: NextResponse) {
    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval in dev
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' ws: wss:",
            "frame-ancestors 'none'",
        ].join('; ')
    );

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // HSTS (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    return response;
}

// CORS configuration
export function corsHeaders(request: NextRequest, response: NextResponse) {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3003'];

    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, X-Requested-With'
        );
    }

    return response;
}

// Authentication check
export function requireAuth(request: NextRequest): boolean {
    const token = request.headers.get('authorization')?.split(' ')[1];

    // Skip auth for health check and public endpoints
    const publicPaths = ['/api/health', '/api/metrics'];
    if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
        return true;
    }

    // In development, allow without auth
    if (process.env.NODE_ENV === 'development') {
        return true;
    }

    return !!token; // TODO: Implement JWT verification
}

// Main security middleware
export async function securityMiddleware(request: NextRequest) {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    const rateLimitResult = await checkRateLimit(`ip:${ip}`, 100, 60);

    if (!rateLimitResult.allowed) {
        return new NextResponse('Too Many Requests', {
            status: 429,
            headers: {
                'Retry-After': rateLimitResult.reset.toString(),
                'X-RateLimit-Limit': rateLimitResult.total.toString(),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            },
        });
    }

    // Authentication check
    if (!requireAuth(request)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // Create response with security headers
    const response = NextResponse.next();
    securityHeaders(response);
    corsHeaders(request, response);

    return response;
}
