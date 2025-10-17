export const dynamic = 'force-static';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/test/', '/api/', '/_next/'],
      },
    ],
    sitemap: 'https://odavl.studio/sitemap.xml',
    host: 'https://odavl.studio',
  };
}
