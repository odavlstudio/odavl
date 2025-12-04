import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Mock blog post data
const blogPostsData: Record<string, any> = {
  'ml-trust-scoring-autopilot': {
    id: 'ml-trust-scoring',
    category: 'Engineering',
    date: '2025-11-20',
    readTime: '8 min read',
    author: {
      name: 'Dr. Sarah Chen',
      role: 'Chief AI Scientist',
      avatar: '/avatars/sarah-chen.jpg'
    }
  },
  'achieving-wcag-aa-compliance': {
    id: 'wcag-compliance',
    category: 'Accessibility',
    date: '2025-11-15',
    readTime: '12 min read',
    author: {
      name: 'Michael Rodriguez',
      role: 'Accessibility Lead',
      avatar: '/avatars/michael-rodriguez.jpg'
    }
  },
  'python-support-launch': {
    id: 'python-support',
    category: 'Product',
    date: '2025-11-10',
    readTime: '6 min read',
    author: {
      name: 'Emily Thompson',
      role: 'Product Manager',
      avatar: '/avatars/emily-thompson.jpg'
    }
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const post = blogPostsData[slug];

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.'
    };
  }

  const t = await getTranslations('blog');
  return {
    title: t(`posts.${post.id}.title`),
    description: t(`posts.${post.id}.excerpt`),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  const post = blogPostsData[slug];

  if (!post) {
    notFound();
  }

  const t = useTranslations('blog');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Link href="/blog" className="text-blue-200 hover:text-white transition-colors inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('post.backToBlog')}
              </Link>
            </div>

            {/* Category & Meta */}
            <div className="flex items-center gap-4 mb-6">
              <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-semibold">
                {post.category}
              </span>
              <span className="text-blue-200">{post.date}</span>
              <span className="text-blue-200">•</span>
              <span className="text-blue-200">{post.readTime}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {t(`posts.${post.id}.title`)}
            </h1>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {post.author.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold">{post.author.name}</p>
                <p className="text-blue-200 text-sm">{post.author.role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="relative -mt-16 mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative h-96 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-24 h-24 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                {t(`posts.${post.id}.excerpt`)}
              </p>

              <div className="space-y-6 text-gray-700">
                {t(`posts.${post.id}.content`).split('\n\n').map((paragraph: string, index: number) => (
                  <p key={index} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Key Takeaways */}
              <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('post.keyTakeaways')}
                </h3>
                <ul className="space-y-3 text-gray-700">
                  {t(`posts.${post.id}.takeaways`).split('\n').map((takeaway: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {t(`posts.${post.id}.tags`).split(',').map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">{t('post.share')}</h3>
                <div className="flex items-center gap-4">
                  <button className="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  <button className="w-10 h-10 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>
                  <button className="w-10 h-10 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">
              {t('post.relatedPosts')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Link
                  key={i}
                  href={`/blog/related-${i}`}
                  className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  <div className="relative h-48 bg-gradient-to-br from-purple-500 via-pink-600 to-orange-500">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      Related Post Title {i}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      Brief description of the related blog post content...
                    </p>
                    <span className="text-blue-600 font-semibold text-sm flex items-center gap-2">
                      {t('post.readMore')}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('post.cta.title')}
            </h2>
            <p className="text-xl text-purple-100 mb-10">
              {t('post.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-900 bg-white rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-xl"
              >
                {t('post.cta.cta')}
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
