import { Page } from 'playwright';
import { Issue } from './white-screen';

export class SEODetector {
  /**
   * Detect SEO issues
   */
  async detect(page: Page): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Check for missing meta description
    const metaDescription = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="description"]');
      return meta?.getAttribute('content') || '';
    });

    if (!metaDescription || metaDescription.length < 50) {
      issues.push({
        type: 'MISSING_META_DESCRIPTION',
        severity: 'high',
        message: metaDescription ? '📄 Meta description too short' : '📄 Missing meta description',
        fix: [
          'Add meta description tag in <head>',
          'Keep description between 150-160 characters',
          'Make description unique for each page',
          'Include target keywords naturally',
          'Write compelling, actionable description'
        ],
        details: { length: metaDescription.length, content: metaDescription }
      });
    }

    // Check for missing Open Graph tags
    const ogTags = await page.evaluate(() => {
      return {
        title: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        description: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
        image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        url: document.querySelector('meta[property="og:url"]')?.getAttribute('content')
      };
    });

    const missingOgTags = Object.entries(ogTags).filter(([_, value]) => !value);
    if (missingOgTags.length > 0) {
      issues.push({
        type: 'MISSING_OG_TAGS',
        severity: 'medium',
        message: `📱 Missing ${missingOgTags.length} Open Graph tag(s)`,
        fix: [
          'Add Open Graph meta tags for social sharing',
          'Include og:title, og:description, og:image, og:url',
          'Use high-quality og:image (1200x630px)',
          'Test with Facebook Sharing Debugger',
          'Add og:type for content classification'
        ],
        details: { missing: missingOgTags.map(([key]) => key) }
      });
    }

    // Check for missing Twitter Card tags
    const twitterTags = await page.evaluate(() => {
      return {
        card: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
        title: document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
        description: document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
        image: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
      };
    });

    if (!twitterTags.card) {
      issues.push({
        type: 'MISSING_TWITTER_CARD',
        severity: 'low',
        message: '🐦 Missing Twitter Card tags',
        fix: [
          'Add Twitter Card meta tags',
          'Use twitter:card="summary_large_image"',
          'Include twitter:title and twitter:description',
          'Add twitter:image for preview',
          'Test with Twitter Card Validator'
        ],
        details: {}
      });
    }

    // Check for missing canonical URL
    const canonical = await page.evaluate(() => {
      return document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    });

    if (!canonical) {
      issues.push({
        type: 'MISSING_CANONICAL',
        severity: 'medium',
        message: '🔗 Missing canonical URL',
        fix: [
          'Add <link rel="canonical"> in <head>',
          'Point to preferred version of page',
          'Prevent duplicate content issues',
          'Use absolute URLs',
          'Set canonical for paginated content'
        ],
        details: {}
      });
    }

    // Check for broken links
    const brokenLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const broken: string[] = [];

      for (const link of links) {
        const href = link.getAttribute('href') || '';
        // Check for obvious broken patterns
        if (href === '#' || href === '' || href === 'javascript:void(0)') {
          broken.push(href || 'empty');
        }
      }

      return broken.length;
    });

    if (brokenLinks > 0) {
      issues.push({
        type: 'BROKEN_LINKS',
        severity: 'medium',
        message: `🔗 ${brokenLinks} potentially broken link(s)`,
        fix: [
          'Fix or remove links with # or empty href',
          'Use meaningful href values',
          'Test all links regularly',
          'Implement 301 redirects for moved pages',
          'Monitor for 404 errors'
        ],
        details: { count: brokenLinks }
      });
    }

    // Check for missing alt text on images (SEO perspective)
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.alt || img.alt.trim() === '').length;
    });

    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'SEO_MISSING_ALT',
        severity: 'medium',
        message: `🖼️ ${imagesWithoutAlt} image(s) missing alt text (SEO)`,
        fix: [
          'Add descriptive alt text to all images',
          'Include relevant keywords naturally',
          'Describe image content accurately',
          'Keep alt text concise (< 125 characters)',
          'Use alt="" for decorative images only'
        ],
        details: { count: imagesWithoutAlt }
      });
    }

    // Check for robots meta tag blocking indexing
    const robotsMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="robots"]');
      return meta?.getAttribute('content') || '';
    });

    if (robotsMeta.includes('noindex') || robotsMeta.includes('nofollow')) {
      issues.push({
        type: 'ROBOTS_BLOCKING',
        severity: 'high',
        message: '🤖 Robots meta tag blocking search engines',
        fix: [
          'Remove "noindex" if page should be indexed',
          'Remove "nofollow" if links should be followed',
          'Check robots.txt file',
          'Verify this is intentional',
          'Use in staging, not production'
        ],
        details: { content: robotsMeta }
      });
    }

    // Check page title length
    const title = await page.evaluate(() => document.title || '');
    if (title.length > 60) {
      issues.push({
        type: 'LONG_PAGE_TITLE',
        severity: 'low',
        message: `📄 Page title too long (${title.length} chars)`,
        fix: [
          'Keep title under 60 characters',
          'Most important info first',
          'Avoid keyword stuffing',
          'Include brand name at end',
          'Make title compelling for clicks'
        ],
        details: { length: title.length, title }
      });
    }

    // Check for structured data (Schema.org)
    const hasStructuredData = await page.evaluate(() => {
      const jsonLd = document.querySelector('script[type="application/ld+json"]');
      const microdata = document.querySelector('[itemscope]');
      return !!(jsonLd || microdata);
    });

    if (!hasStructuredData) {
      issues.push({
        type: 'MISSING_STRUCTURED_DATA',
        severity: 'low',
        message: '📊 Missing structured data (Schema.org)',
        fix: [
          'Add JSON-LD structured data',
          'Use Schema.org vocabulary',
          'Implement appropriate types (Article, Product, etc.)',
          'Test with Google Rich Results Test',
          'Enable rich snippets in search results'
        ],
        details: {}
      });
    }

    return issues;
  }

  /**
   * SEO score (0-100)
   */
  async getScore(page: Page): Promise<number> {
    const issues = await this.detect(page);
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    let score = 100;
    score -= criticalCount * 25;
    score -= highCount * 15;
    score -= mediumCount * 8;
    score -= lowCount * 3;

    return Math.max(0, score);
  }
}
