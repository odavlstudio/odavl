// ODAVL-WAVE-X9-INJECT: Blog System Configuration
// @odavl-governance: MARKETING-SAFE mode - Blog infrastructure

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  tags: string[];
  readingTime: number;
  featured: boolean;
}

export const BLOG_CONFIG = {
  postsPerPage: 6,
  featuredPostsCount: 3,
  categories: [
    'Code Quality',
    'AI & Automation', 
    'TypeScript',
    'ESLint',
    'Best Practices',
    'Case Studies'
  ],
  authors: {
    system: {
      name: 'ODAVL Team',
      bio: 'Autonomous Code Quality Intelligence System',
      avatar: '/logo.svg'
    }
  }
};

export const SAMPLE_POSTS: BlogPost[] = [
  {
    slug: 'introducing-odavl',
    title: 'Introducing ODAVL: The Future of Autonomous Code Quality',
    excerpt: 'Discover how ODAVL revolutionizes code quality with AI-powered autonomous improvements, safety constraints, and continuous learning.',
    publishedAt: '2024-01-15',
    author: 'system',
    tags: ['Code Quality', 'AI & Automation', 'Introduction'],
    readingTime: 5,
    featured: true
  },
  {
    slug: 'safety-first-autonomous-coding',
    title: 'Safety-First Approach to Autonomous Code Changes',
    excerpt: 'Learn how ODAVL implements safety gates, risk policies, and verification steps to ensure autonomous changes never break your code.',
    publishedAt: '2024-01-10',
    author: 'system', 
    tags: ['Best Practices', 'Safety', 'Automation'],
    readingTime: 7,
    featured: true
  },
  {
    slug: 'odavl-cycle-explained',
    title: 'The ODAVL Cycle: Observe, Decide, Act, Verify, Learn',
    excerpt: 'Deep dive into the five-phase cycle that powers autonomous code quality improvements with continuous feedback and learning.',
    publishedAt: '2024-01-05',
    author: 'system',
    tags: ['Architecture', 'Code Quality', 'AI & Automation'],
    readingTime: 8,
    featured: true
  }
];