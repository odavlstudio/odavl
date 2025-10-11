// ODAVL WAVE X-3 Blog Metadata Configuration
// SEO optimization for future blog section

export interface BlogPostMeta {
  title: string;
  description: string;
  slug: string;
  author: string;
  publishDate: Date;
  tags: string[];
  readingTime?: number;
  excerpt?: string;
  featured?: boolean;
}

export const blogSEOConfig = {
  // Blog section configuration
  blog: {
    title: 'ODAVL Blog - Code Quality Insights',
    description: 'Expert insights on autonomous code quality, developer tools, and software engineering best practices.',
    baseUrl: '/blog',
    postsPerPage: 10,
    enableRSS: true,
    enableSitemap: true,
  },

  // Default blog post schema
  postDefaults: {
    author: 'ODAVL Team',
    publisher: 'ODAVL Studio',
    readingTime: 5,
    tags: ['code quality', 'development', 'automation'],
  },

  // Blog categories with SEO metadata
  categories: {
    'code-quality': {
      title: 'Code Quality - ODAVL Blog',
      description: 'Best practices and insights for maintaining high-quality codebases.',
      keywords: ['code quality', 'static analysis', 'linting', 'testing'],
    },
    'automation': {
      title: 'Development Automation - ODAVL Blog', 
      description: 'Automating development workflows for better productivity and quality.',
      keywords: ['automation', 'CI/CD', 'DevOps', 'workflow'],
    },
    'typescript': {
      title: 'TypeScript Development - ODAVL Blog',
      description: 'Advanced TypeScript techniques and best practices.',
      keywords: ['typescript', 'javascript', 'type safety', 'development'],
    },
  },

  // Blog post JSON-LD schema generator
  generateBlogPostSchema: (post: BlogPostMeta) => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ODAVL Studio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://odavl.studio/logo.png',
      },
    },
    datePublished: post.publishDate.toISOString(),
    dateModified: post.publishDate.toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://odavl.studio/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  }),
} as const;