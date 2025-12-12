import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { OrganizationJsonLd, WebsiteJsonLd, ProductJsonLd } from '@/components/seo/JsonLd';
import { homepageMetadata } from '@/components/seo/Metadata';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Force dynamic rendering to avoid SSG context serialization issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
  ...homepageMetadata,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <ProductJsonLd />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
        >
          Skip to main content
        </a>
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
