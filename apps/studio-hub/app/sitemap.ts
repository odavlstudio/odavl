// Complete sitemap with all new pages
export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://odavl.studio';
  const lastModified = new Date();

  // Static pages with priorities
  const routes = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: '/features', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: '/docs', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/blog', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/contact', changeFrequency: 'yearly' as const, priority: 0.6 },
  ].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Blog posts
  const blogPosts = [
    'introducing-odavl-studio-v2',
    'how-odavl-insight-detects-errors',
    'self-healing-code-with-autopilot',
    'pre-deploy-testing-guardian',
    'building-better-software-odavl-cycle',
  ].map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified,
    changeFrequency: 'yearly' as const,
    priority: 0.6,
  }));

  return [...routes, ...blogPosts];
}
