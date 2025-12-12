import type { Metadata } from 'next';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';
import { SessionProvider } from '@/components/SessionProvider';
import Footer from '@/components/Footer';
import { env } from '@/lib/env';
import { generateMetadata } from '@/components/seo/Metadata';
import './globals.css';

export const metadata: Metadata = {
  ...generateMetadata({
    title: 'ODAVL Cloud Console',
    description: 'Cloud platform for ODAVL Studio — AI-powered code analysis, autonomous fixing, and pre-deploy testing',
    canonical: '/',
  }),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

// Force dynamic rendering for all pages (disable SSG prerendering)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>
        <SessionProvider>
          <ErrorBoundary>
            <ToastProvider>
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </ToastProvider>
          </ErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  );
}
