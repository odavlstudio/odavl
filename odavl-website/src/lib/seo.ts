import type { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  title: {
    default: 'ODAVL - Autonomous Code Quality Platform',
    template: '%s | ODAVL'
  },
  description: 'Transform your codebase with intelligent, autonomous quality improvements backed by enterprise-grade safety controls.',
  keywords: ['code quality', 'autonomous development', 'eslint', 'typescript', 'developer tools'],
  authors: [{ name: 'ODAVL' }],
  creator: 'ODAVL',
  publisher: 'ODAVL',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://odavl.studio',
    title: 'ODAVL - Autonomous Code Quality Platform',
    description: 'Transform your codebase with intelligent, autonomous quality improvements backed by enterprise-grade safety controls.',
    siteName: 'ODAVL',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ODAVL Studio - Autonomous Code Quality Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ODAVL - Autonomous Code Quality Platform',
    description: 'Transform your codebase with intelligent, autonomous quality improvements backed by enterprise-grade safety controls.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'verification-token', // Add real token when available
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ODAVL',
  url: 'https://odavl.studio',
  logo: 'https://odavl.studio/logo.png',
  description: 'Enterprise-grade autonomous code quality platform',
  foundingDate: '2025',
  sameAs: ['https://github.com/odavlstudio/odavl'],
};

export const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ODAVL',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Cross-platform',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '156',
  },
};

/* <ODAVL-WAVE-X3-INJECT-START> */
// Enhanced SEO infrastructure from WAVE X-3 - Now activated for production
export { generateMeta } from '../../config/seo/meta.generator';
export { generateDynamicSitemap } from '../../config/seo/sitemap.dynamic';
export { seoConfig } from '../../config/seo/seo.config';
/* <ODAVL-WAVE-X3-INJECT-END> */