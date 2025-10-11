// ODAVL WAVE X-3 Dynamic Meta Generator
// Generates optimized metadata for each page and locale

import type { Metadata } from 'next';
import { seoConfig } from './seo.config';

export interface MetaGeneratorOptions {
  page: string;
  locale: string;
  params?: Record<string, string>;
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string[];
  noIndex?: boolean;
  canonical?: string;
}

export function generateMeta(options: MetaGeneratorOptions): Metadata {
  const { page, locale, customTitle, customDescription, customKeywords, noIndex, canonical } = options;
  
  // Get page-specific config
  const pageConfig = seoConfig.pages[page as keyof typeof seoConfig.pages] || seoConfig.pages.home;
  
  // Build title
  const title = customTitle || pageConfig.title;
  const fullTitle = page === 'home' ? title : `${title} | ${seoConfig.site.name}`;
  
  // Build description
  const description = customDescription || pageConfig.description;
  
  // Build keywords
  const keywords = customKeywords || pageConfig.keywords;
  
  // Build canonical URL
  const canonicalUrl = canonical || `${seoConfig.site.url}/${locale}${page === 'home' ? '' : `/${page}`}`;
  
  // Build hreflang alternates
  const alternates: Record<string, string> = {};
  seoConfig.i18n.locales.forEach(loc => {
    alternates[loc] = `${seoConfig.site.url}/${loc}${page === 'home' ? '' : `/${page}`}`;
  });

  const metadata: Metadata = {
    title: {
      default: fullTitle,
      template: `%s | ${seoConfig.site.name}`,
    },
    description,
    keywords: keywords.join(', '),
    authors: [{ name: seoConfig.site.name }],
    creator: seoConfig.site.name,
    publisher: seoConfig.site.name,
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : locale === 'de' ? 'de_DE' : 'ar_SA',
      url: canonicalUrl,
      title: fullTitle,
      description,
      siteName: seoConfig.site.name,
      images: [
        {
          url: `${seoConfig.site.url}/og-image-${locale}.png`,
          width: 1200,
          height: 630,
          alt: `${seoConfig.site.name} - ${description}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: seoConfig.social.twitter,
      creator: seoConfig.social.twitter,
      title: fullTitle,
      description,
      images: [`${seoConfig.site.url}/og-image-${locale}.png`],
    },
  };

  return metadata;
}