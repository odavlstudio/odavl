import { NextRequest, NextResponse } from 'next/server';
// Removed Edge Runtime incompatible imports (logger, redis)
// Security middleware simplified for Edge Runtime compatibility

export async function middleware(request: NextRequest) {
    // Basic security headers (Edge Runtime compatible)
    const response = NextResponse.next();
    
    // Security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (handled separately)
         */
        '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
    ],
    // Use nodejs runtime for full features
    runtime: 'nodejs',
};
