// ODAVL WAVE X-3 Dynamic Multilingual Sitemap Generator
// Automatically generates sitemaps with proper i18n and hreflang support

import { MetadataRoute } from 'next';

export interface SitemapConfig {
  baseUrl: string;
  defaultLocale: string;
  locales: string[];
  routes: RouteConfig[];
}

export interface RouteConfig {
  path: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastModified?: Date;
  excludeLocales?: string[];
}

export const sitemapConfig: SitemapConfig = {
  baseUrl: 'https://odavl.studio',
  defaultLocale: 'en',
  locales: ['en', 'de', 'ar'],
  routes: [
    {
      path: '',
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      path: '/docs',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      path: '/docs/quickstart',
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      path: '/docs/governance',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      path: '/contact',
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      path: '/pilot',
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ],
};

export function generateDynamicSitemap(config: SitemapConfig = sitemapConfig): MetadataRoute.Sitemap {
  const sitemap: MetadataRoute.Sitemap = [];

  config.routes.forEach(route => {
    const availableLocales = config.locales.filter(
      locale => !route.excludeLocales?.includes(locale)
    );

    availableLocales.forEach(locale => {
      const url = `${config.baseUrl}/${locale}${route.path}`;
      
      // Generate hreflang alternatives
      const languages: Record<string, string> = {};
      availableLocales.forEach(altLocale => {
        languages[altLocale] = `${config.baseUrl}/${altLocale}${route.path}`;
      });

      sitemap.push({
        url,
        lastModified: route.lastModified || new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages,
        },
      });
    });
  });

  return sitemap;
}