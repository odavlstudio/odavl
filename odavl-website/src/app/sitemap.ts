export const dynamic = 'force-static';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://odavl.studio';
  const locales = ['en', 'de', 'ar'];

  const routes = [
    '',
    '/docs/quickstart',
    '/docs/governance',
  ];

  const fallbackSitemap: MetadataRoute.Sitemap = [];

  // Add routes for each locale as fallback
  locales.forEach(locale => {
    routes.forEach(route => {
      fallbackSitemap.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}/en${route}`,
            de: `${baseUrl}/de${route}`,
            ar: `${baseUrl}/ar${route}`,
          },
        },
      });
    });
  });

  /* <ODAVL-WAVE-X3-INJECT-START> */
  // Enhanced with dynamic sitemap generator - now activated
  try {
    const { generateDynamicSitemap } = await import('../../config/seo/sitemap.dynamic');
    return generateDynamicSitemap();
  } catch (error) {
    console.warn('Dynamic sitemap generation failed, using fallback:', error);
    return fallbackSitemap;
  }
  /* <ODAVL-WAVE-X3-INJECT-END> */
}
