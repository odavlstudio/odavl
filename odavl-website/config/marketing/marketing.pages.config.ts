// ODAVL-WAVE-X9-INJECT: Marketing Pages Configuration
// @odavl-governance: MARKETING-SAFE mode - Landing pages setup

export interface MarketingPageConfig {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    type: 'website';
  };
}

export const MARKETING_PAGES: Record<string, MarketingPageConfig> = {
  home: {
    slug: '/',
    title: 'ODAVL - Autonomous Code Quality Intelligence',
    description: 'Transform your codebase with AI-powered autonomous quality improvements. ODAVL continuously monitors, analyzes, and fixes code quality issues automatically.',
    keywords: ['code quality', 'autonomous', 'AI', 'TypeScript', 'ESLint', 'automation'],
    openGraph: {
      title: 'ODAVL - Autonomous Code Quality Intelligence',
      description: 'Transform your codebase with AI-powered autonomous quality improvements.',
      type: 'website'
    }
  },
  blog: {
    slug: '/blog',
    title: 'ODAVL Blog - Code Quality Insights',
    description: 'Latest insights on autonomous code quality, AI-powered development tools, and best practices for maintainable software.',
    keywords: ['code quality blog', 'AI development', 'automation insights', 'software engineering'],
    openGraph: {
      title: 'ODAVL Blog - Code Quality Insights',
      description: 'Latest insights on autonomous code quality and AI-powered development.',
      type: 'website'
    }
  },
  showcase: {
    slug: '/showcase',
    title: 'ODAVL Showcase - Success Stories',
    description: 'Discover how ODAVL transforms codebases across different projects. Real examples of autonomous quality improvements.',
    keywords: ['code examples', 'case studies', 'quality improvements', 'before after'],
    openGraph: {
      title: 'ODAVL Showcase - Success Stories',
      description: 'Real examples of autonomous code quality improvements.',
      type: 'website'
    }
  }
};

export const SEO_DEFAULTS = {
  siteName: 'ODAVL',
  twitterHandle: '@odavl_ai',
  locale: 'en_US',
  type: 'website' as const
};