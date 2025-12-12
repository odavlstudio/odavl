import { Metadata } from 'next';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

const DEFAULT_METADATA = {
  siteName: 'ODAVL',
  title: 'ODAVL — Autonomous Code Quality Platform',
  description: 'AI-powered code analysis, autonomous fixing, and pre-deploy testing. Insight detects, Autopilot fixes, Guardian validates.',
  keywords: [
    'code quality',
    'static analysis',
    'code review',
    'autonomous fixes',
    'pre-deploy testing',
    'AI code analysis',
    'ODAVL',
    'TypeScript',
    'JavaScript',
    'Python',
    'security scanning'
  ],
  url: 'https://odavl.com',
  ogImage: '/og-default.png',
  twitterHandle: '@odavlstudio'
};

export function generateMetadata({
  title,
  description = DEFAULT_METADATA.description,
  keywords = DEFAULT_METADATA.keywords,
  canonical,
  ogImage = DEFAULT_METADATA.ogImage,
  noindex = false
}: SEOProps = {}): Metadata {
  const fullTitle = title 
    ? `${title} — ODAVL` 
    : DEFAULT_METADATA.title;

  const canonicalUrl = canonical 
    ? `${DEFAULT_METADATA.url}${canonical}`
    : DEFAULT_METADATA.url;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: 'ODAVL Studio', url: 'https://odavl.com' }],
    creator: 'ODAVL Studio',
    publisher: 'ODAVL Studio',
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: canonicalUrl,
      siteName: DEFAULT_METADATA.siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${DEFAULT_METADATA.url}${ogImage}`,
          width: 1200,
          height: 630,
          alt: fullTitle
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      site: DEFAULT_METADATA.twitterHandle,
      creator: DEFAULT_METADATA.twitterHandle,
      title: fullTitle,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${DEFAULT_METADATA.url}${ogImage}`]
    }
  };
}

export { DEFAULT_METADATA };
