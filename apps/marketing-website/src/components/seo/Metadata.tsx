import { Metadata } from 'next';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}

const DEFAULT_METADATA = {
  siteName: 'ODAVL',
  domain: 'https://odavl.com',
  twitterHandle: '@odavlstudio',
  defaultTitle: 'ODAVL — Autonomous Code Quality Platform',
  defaultDescription: 'AI-powered code analysis, autonomous fixing, and pre-deploy testing. Transform your codebase with enterprise-grade quality assurance.',
  defaultKeywords: [
    'code quality',
    'static analysis',
    'autonomous fixes',
    'pre-deploy testing',
    'AI code review',
    'DevOps automation',
    'continuous quality',
    'code health',
    'developer tools',
    'enterprise software',
  ],
};

/**
 * Generate comprehensive SEO metadata for marketing pages
 */
export function generateSEOMetadata({
  title,
  description,
  keywords = [],
  canonical = '',
  ogImage,
  ogType = 'website',
  noindex = false,
  publishedTime,
  modifiedTime,
  authors = ['ODAVL Team'],
}: SEOMetadata): Metadata {
  const fullTitle = title === DEFAULT_METADATA.defaultTitle ? title : `${title} — ODAVL`;
  const canonicalUrl = canonical ? `${DEFAULT_METADATA.domain}${canonical}` : DEFAULT_METADATA.domain;
  const finalKeywords = [...DEFAULT_METADATA.defaultKeywords, ...keywords];
  const finalOgImage = ogImage || `${DEFAULT_METADATA.domain}/api/og?title=${encodeURIComponent(title)}`;

  return {
    title: fullTitle,
    description,
    keywords: finalKeywords.join(', '),
    authors: authors.map((name) => ({ name })),
    robots: noindex
      ? 'noindex, nofollow'
      : {
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
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: ogType,
      locale: 'en_US',
      url: canonicalUrl,
      siteName: DEFAULT_METADATA.siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: finalOgImage,
          width: 1200,
          height: 630,
          alt: `${title} - ODAVL`,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      site: DEFAULT_METADATA.twitterHandle,
      creator: DEFAULT_METADATA.twitterHandle,
      title: fullTitle,
      description,
      images: [finalOgImage],
    },
  };
}

/**
 * Default metadata for homepage
 */
export const homepageMetadata = generateSEOMetadata({
  title: DEFAULT_METADATA.defaultTitle,
  description: 'Transform your codebase with AI-powered detection, autonomous fixing, and pre-deploy testing. ODAVL Insight detects errors, Autopilot fixes them, and Guardian validates before deployment.',
  keywords: ['AI code quality', 'autonomous code fixing', 'pre-deploy testing', 'code health monitoring'],
  canonical: '/',
});

/**
 * Pricing page metadata
 */
export const pricingMetadata = generateSEOMetadata({
  title: 'Pricing',
  description: 'Simple, transparent pricing for teams of all sizes. Start free with ODAVL Insight, upgrade to Pro for Autopilot, or go Enterprise for Guardian. No credit card required.',
  keywords: ['pricing', 'plans', 'enterprise', 'free trial', 'code quality pricing'],
  canonical: '/pricing',
});

/**
 * Features page metadata
 */
export const featuresMetadata = generateSEOMetadata({
  title: 'Features',
  description: 'Explore ODAVL\'s comprehensive features: AI-powered error detection, autonomous code fixing, pre-deploy testing, and enterprise-grade security. Built for modern development teams.',
  keywords: ['features', 'capabilities', 'AI detection', 'autonomous fixing', 'testing automation'],
  canonical: '/features',
});

/**
 * Docs page metadata
 */
export const docsMetadata = generateSEOMetadata({
  title: 'Documentation',
  description: 'Complete documentation for ODAVL Studio. Learn how to integrate Insight, Autopilot, and Guardian into your development workflow. Guides, API references, and best practices.',
  keywords: ['documentation', 'guides', 'API', 'integration', 'tutorials', 'developer docs'],
  canonical: '/docs',
});

/**
 * Blog index metadata
 */
export const blogMetadata = generateSEOMetadata({
  title: 'Blog',
  description: 'Latest updates, insights, and best practices from the ODAVL team. Learn about code quality, autonomous development, AI-powered testing, and DevOps automation.',
  keywords: ['blog', 'articles', 'updates', 'best practices', 'code quality insights'],
  canonical: '/blog',
});
