'use client';

/**
 * Global Error Page
 * Handles errors across entire [locale] layout
 *
 * IMPORTANT: Minimal implementation to avoid React context issues during build
 */

// Disable static generation for this error boundary
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {

  return (
    <html>
      <body>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#f9fafb',
          }}>
            <div style={{
              maxWidth: '600px',
              textAlign: 'center',
              backgroundColor: 'white',
              padding: '3rem',
              borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#dc2626' }}>
              Something went wrong!
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              An unexpected error occurred. Our team has been notified and is working on a fix.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '2rem' }}>
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '6px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '56px',
                minWidth: '200px',
              }}
            >
              Try Again
            </button>
            <div style={{ marginTop: '2rem' }}>
              <a
                href="/"
                style={{
                  color: '#2563eb',
                  textDecoration: 'underline',
                  fontSize: '0.875rem',
                }}
              >
                Return to Homepage
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
