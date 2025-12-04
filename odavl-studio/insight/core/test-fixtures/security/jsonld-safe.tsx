import React from 'react';

// False Positive: JSON-LD structured data is SAFE
export function JsonLDComponent() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'ODAVL Studio',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
