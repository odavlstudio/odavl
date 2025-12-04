// Sign In Page
// Week 1: Authentication UI

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SignInForm } from '@/components/auth/signin-form';
import type { Metadata } from 'next';

// Disable static generation - requires session context
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sign In - ODAVL Studio | Autonomous Code Quality Platform',
  description: 'Sign in to ODAVL Studio for ML-powered error detection, self-healing infrastructure, and pre-deploy testing. Secure OAuth 2.0 authentication.',
  other: {
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://accounts.google.com https://www.googleapis.com; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests",
  },
  openGraph: {
    title: 'Sign In - ODAVL Studio',
    description: 'Access your autonomous code quality platform with GitHub or Google',
    url: 'https://studio.odavl.com/auth/signin',
    siteName: 'ODAVL Studio',
    type: 'website',
    images: [
      {
        url: 'https://studio.odavl.com/og-signin.png',
        width: 1200,
        height: 630,
        alt: 'ODAVL Studio Sign In',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign In - ODAVL Studio',
    description: 'Access your autonomous code quality platform',
    images: ['https://studio.odavl.com/og-signin.png'],
  },
  alternates: {
    canonical: 'https://studio.odavl.com/auth/signin',
  },
};

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  
  // Redirect if already authenticated
  if (session) {
    redirect('/dashboard');
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ODAVL Studio
          </h1>
          <p className="text-gray-600">
            Sign in to your account
          </p>
        </div>
        
        <SignInForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Don&apos;t have an account?
          </p>
          <a 
            href="/auth/signup" 
            className="inline-flex items-center justify-center w-full px-6 text-base font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border-2 border-blue-200 hover:border-blue-300"
            style={{ minHeight: '56px', lineHeight: '56px', padding: '16px 24px' }}
          >
            Sign up for free
          </a>
        </div>
        
        {/* Structured Data (Schema.org JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: 'Sign In - ODAVL Studio',
              description: 'Secure authentication page for ODAVL Studio autonomous code quality platform',
              url: 'https://studio.odavl.com/auth/signin',
              mainEntity: {
                '@type': 'SoftwareApplication',
                name: 'ODAVL Studio',
                applicationCategory: 'DeveloperApplication',
                operatingSystem: 'Web',
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                },
              },
            }),
          }}
        />
      </div>
    </div>
  );
}

