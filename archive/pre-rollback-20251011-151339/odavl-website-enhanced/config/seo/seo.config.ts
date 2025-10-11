// ODAVL WAVE X-3 SEO Configuration
// Comprehensive SEO settings for maximum search visibility

export const seoConfig = {
  // Site-wide configuration
  site: {
    name: 'ODAVL',
    title: 'ODAVL - Autonomous Code Quality Platform',
    description: 'Transform your codebase with intelligent, autonomous quality improvements backed by enterprise-grade safety controls.',
    url: 'https://odavl.studio',
    logo: '/logo.png',
    favicon: '/favicon.ico',
    language: 'en',
    locale: 'en_US',
  },

  // Multilingual support
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de', 'ar'],
    localeDetection: true,
    domains: {
      en: 'https://odavl.studio',
      de: 'https://odavl.studio/de',
      ar: 'https://odavl.studio/ar',
    },
  },

  // Page-specific SEO templates
  pages: {
    home: {
      title: 'ODAVL - Autonomous Code Quality Platform',
      description: 'Transform your codebase with intelligent, autonomous quality improvements backed by enterprise-grade safety controls.',
      keywords: ['code quality', 'autonomous development', 'eslint', 'typescript', 'developer tools', 'software quality'],
    },
    docs: {
      title: 'Documentation - ODAVL',
      description: 'Complete guides and API documentation for ODAVL autonomous code quality platform.',
      keywords: ['documentation', 'API', 'guides', 'developer docs', 'code quality tools'],
    },
    contact: {
      title: 'Contact Us - ODAVL',
      description: 'Get in touch with the ODAVL team for enterprise solutions and support.',
      keywords: ['contact', 'support', 'enterprise', 'business inquiry'],
    },
  },

  // Social media configuration
  social: {
    twitter: '@odavlstudio',
    github: 'https://github.com/odavlstudio',
    linkedin: 'https://linkedin.com/company/odavl',
  },
} as const;