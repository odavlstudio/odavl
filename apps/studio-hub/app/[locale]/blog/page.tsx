import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Blog - ODAVL Studio',
    description: 'Latest insights on autonomous code quality, AI-powered development, ML error detection, and software engineering best practices.',
    keywords: 'blog, code quality, AI, machine learning, DevOps, software engineering',
  };
}

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      slug: 'introducing-odavl-studio-v2',
      title: 'Introducing ODAVL Studio v2.0',
      excerpt: 'A unified platform for autonomous code quality with three powerful products: Insight, Autopilot, and Guardian.',
      author: 'ODAVL Team',
      date: '2024-12-15',
      readTime: '8 min read',
      category: 'Product',
      tags: ['Product Launch', 'Announcement', 'Features'],
      coverImage: '🚀',
    },
    {
      id: 2,
      slug: 'how-odavl-insight-detects-errors',
      title: 'How ODAVL Insight Detects Errors with AI',
      excerpt: '12 specialized detectors powered by machine learning to catch issues before they become production problems.',
      author: 'ODAVL Team',
      date: '2024-12-10',
      readTime: '12 min read',
      category: 'Technical',
      tags: ['Insight', 'Machine Learning', 'Error Detection'],
      coverImage: '🔍',
    },
    {
      id: 3,
      slug: 'self-healing-code-with-autopilot',
      title: 'Self-Healing Code with ODAVL Autopilot',
      excerpt: 'The O-D-A-V-L cycle explained: How Autopilot automatically fixes code issues with triple-layer safety.',
      author: 'ODAVL Team',
      date: '2024-12-05',
      readTime: '15 min read',
      category: 'Technical',
      tags: ['Autopilot', 'Automation', 'O-D-A-V-L Cycle'],
      coverImage: '🤖',
    },
    {
      id: 4,
      slug: 'pre-deploy-testing-guardian',
      title: 'Pre-Deploy Testing Made Easy with Guardian',
      excerpt: 'Comprehensive accessibility, performance, and security testing before every deployment.',
      author: 'ODAVL Team',
      date: '2024-11-28',
      readTime: '10 min read',
      category: 'Technical',
      tags: ['Guardian', 'Testing', 'Deployment'],
      coverImage: '🛡️',
    },
    {
      id: 5,
      slug: 'building-better-software-odavl-cycle',
      title: 'Building Better Software with the O-D-A-V-L Cycle',
      excerpt: 'Deep dive into Observe, Decide, Act, Verify, and Learn - the foundation of autonomous code quality.',
      author: 'ODAVL Team',
      date: '2024-11-20',
      readTime: '18 min read',
      category: 'Best Practices',
      tags: ['O-D-A-V-L', 'Methodology', 'Best Practices'],
      coverImage: '📊',
    },
    {
      id: 6,
      slug: 'ml-powered-trust-scoring',
      title: 'ML-Powered Trust Scoring for Automated Fixes',
      excerpt: 'How Autopilot learns from past successes and failures to select the most reliable improvement recipes.',
      author: 'ODAVL Team',
      date: '2024-11-15',
      readTime: '14 min read',
      category: 'Technical',
      tags: ['Machine Learning', 'Autopilot', 'Trust Scoring'],
      coverImage: '🎯',
    },
    {
      id: 7,
      slug: 'triple-layer-safety-mechanisms',
      title: 'Triple-Layer Safety: Never Break Production',
      excerpt: 'Risk Budget Guard, Undo Snapshots, and Cryptographic Attestation - how ODAVL keeps your code safe.',
      author: 'ODAVL Team',
      date: '2024-11-08',
      readTime: '12 min read',
      category: 'Security',
      tags: ['Safety', 'Security', 'Autopilot'],
      coverImage: '🔒',
    },
    {
      id: 8,
      slug: 'vs-code-integration-guide',
      title: 'ODAVL in VS Code: A Complete Integration Guide',
      excerpt: 'Real-time error detection, Problems Panel integration, and automatic fixes right in your editor.',
      author: 'ODAVL Team',
      date: '2024-11-01',
      readTime: '10 min read',
      category: 'Tutorial',
      tags: ['VS Code', 'Integration', 'Developer Tools'],
      coverImage: '💻',
    },
    {
      id: 9,
      slug: 'multi-language-support-typescript-python-java',
      title: 'Multi-Language Support: TypeScript, Python, Java & More',
      excerpt: 'How ODAVL Insight analyzes code across different programming languages with specialized detectors.',
      author: 'ODAVL Team',
      date: '2024-10-25',
      readTime: '16 min read',
      category: 'Technical',
      tags: ['Multi-Language', 'TypeScript', 'Python', 'Java'],
      coverImage: '🌐',
    },
  ];

  const categories = [...new Set(posts.map((p) => p.category))];
  const allTags = [...new Set(posts.flatMap((p) => p.tags))];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Engineering Blog
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Insights on autonomous code quality, AI-powered development, and building better software
        </p>

        {/* Search & Filter */}
        <div className="max-w-2xl mx-auto">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search blog posts..."
              className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none dark:bg-gray-800 dark:text-white"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xl">🔍</span>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors">
              All
            </button>
            {categories.map((category, i) => (
              <button
                key={i}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                ⭐ Featured
              </span>
              <span className="text-blue-100">{posts[0].date}</span>
              <span className="text-blue-100">•</span>
              <span className="text-blue-100">{posts[0].readTime}</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">{posts[0].title}</h2>
            <p className="text-xl text-blue-50 mb-6">{posts[0].excerpt}</p>
            <Link
              href={`/blog/${posts[0].slug}`}
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Read Article →
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold mb-8">Latest Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.slice(1).map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:scale-105 transition-all"
            >
              {/* Cover Image (Emoji) */}
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 h-48 flex items-center justify-center text-7xl">
                {post.coverImage}
              </div>

              <div className="p-6">
                {/* Category & Tags */}
                <div className="flex gap-2 mb-3">
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-semibold">
                    {post.category}
                  </span>
                  {post.tags.slice(0, 1).map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span className="font-medium">{post.author}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{post.date}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Tags */}
      <section className="container mx-auto px-4 py-16 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <h2 className="text-3xl font-bold text-center mb-8">Popular Topics</h2>
        <div className="flex flex-wrap gap-3 justify-center max-w-4xl mx-auto">
          {allTags.map((tag, i) => (
            <Link
              key={i}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors font-semibold"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-xl text-blue-50 mb-8">
            Get the latest articles on autonomous code quality delivered to your inbox monthly.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-lg text-gray-900 focus:ring-2 focus:ring-white focus:outline-none"
              required
            />
            <button
              type="submit"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
          <p className="text-sm text-blue-100 mt-4">
            No spam. Unsubscribe anytime. Read our{' '}
            <Link href="/privacy" className="underline hover:text-white">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* RSS Feed Link */}
      <section className="container mx-auto px-4 pb-16 text-center">
        <Link
          href="/blog/rss.xml"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold"
        >
          <span className="text-xl">📡</span>
          <span>Subscribe via RSS</span>
        </Link>
      </section>
    </div>
  );
}
