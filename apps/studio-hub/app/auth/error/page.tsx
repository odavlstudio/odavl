// Auth Error Page
// Week 1: Handle OAuth errors gracefully

import Link from 'next/link';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'Unable to sign in. Please try again.',
  };
  
  const error = params.error ?? 'Default';
  const message = errorMessages[error] ?? errorMessages.Default;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg 
              className="h-8 w-8 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Authentication Error
          </h1>
          
          <p className="mt-4 text-gray-600">
            {message}
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="flex w-full justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
          >
            Back to Home
          </Link>
        </div>
        
        {error && (
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
              Error Code: {error}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
