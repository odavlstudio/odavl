import Script from 'next/script';

interface JsonLdProps {
  data: Record<string, any>;
}

/**
 * Generic JSON-LD component for structured data
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id={`jsonld-${data['@type']?.toLowerCase() || 'schema'}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      strategy="beforeInteractive"
    />
  );
}

/**
 * Organization schema for ODAVL
 */
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ODAVL',
    legalName: 'ODAVL Studio',
    url: 'https://odavl.com',
    logo: 'https://odavl.com/icon-512.png',
    foundingDate: '2024',
    description: 'Autonomous Code Quality Platform — AI-powered code analysis, autonomous fixing, and pre-deploy testing',
    sameAs: [
      'https://twitter.com/odavlstudio',
      'https://github.com/odavlstudio',
      'https://linkedin.com/company/odavl',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'US',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@odavl.com',
      url: 'https://odavl.com/contact',
    },
  };

  return <JsonLd data={schema} />;
}

/**
 * Website schema for ODAVL
 */
export function WebsiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ODAVL',
    url: 'https://odavl.com',
    description: 'Autonomous Code Quality Platform with AI-powered code analysis, autonomous fixing, and pre-deploy testing',
    publisher: {
      '@type': 'Organization',
      name: 'ODAVL',
      logo: {
        '@type': 'ImageObject',
        url: 'https://odavl.com/icon-512.png',
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://odavl.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return <JsonLd data={schema} />;
}

/**
 * Product schema for ODAVL Platform
 */
export function ProductJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ODAVL Studio',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Windows, macOS, Linux',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '299',
      offerCount: '3',
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Tier',
          price: '0',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name: 'Pro Tier',
          price: '29',
          priceCurrency: 'USD',
        },
        {
          '@type': 'Offer',
          name: 'Enterprise Tier',
          price: '299',
          priceCurrency: 'USD',
        },
      ],
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
    description: 'Autonomous Code Quality Platform with three integrated products: ODAVL Insight (AI-powered error detection), ODAVL Autopilot (autonomous code fixing), and ODAVL Guardian (pre-deploy testing)',
    url: 'https://odavl.com',
    screenshot: 'https://odavl.com/api/og?title=ODAVL Studio',
    author: {
      '@type': 'Organization',
      name: 'ODAVL',
    },
    softwareVersion: '2.0',
    releaseNotes: 'https://odavl.com/blog/releases',
  };

  return <JsonLd data={schema} />;
}

/**
 * Breadcrumb schema for navigation
 */
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={schema} />;
}

/**
 * Article schema for blog posts
 */
export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName = 'ODAVL Team',
  imageUrl,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  imageUrl?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ODAVL',
      logo: {
        '@type': 'ImageObject',
        url: 'https://odavl.com/icon-512.png',
      },
    },
    image: imageUrl || `https://odavl.com/api/og?title=${encodeURIComponent(title)}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return <JsonLd data={schema} />;
}

/**
 * FAQ schema for documentation pages
 */
export function FAQJsonLd({ questions }: { questions: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return <JsonLd data={schema} />;
}
