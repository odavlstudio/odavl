/**
 * ODAVL Guardian - SEO Worker
 * Week 3 Day 7: SEO Analysis
 * 
 * Comprehensive SEO auditing:
 * - Meta tags validation
 * - Structured data (Schema.org)
 * - Robots.txt & sitemap.xml
 * - OpenGraph & Twitter Cards
 * - Performance & accessibility impact on SEO
 */

import { Worker, Job, type JobProgress } from 'bullmq';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import { RedisConnection } from './redis-connection.js';
import { Logger } from './logger.js';

interface SEOJobData {
    url: string;
    projectId: string;
    userId: string;
    options?: {
        checkRobots?: boolean;
        checkSitemap?: boolean;
        checkStructuredData?: boolean;
    };
}

interface SEOResult {
    jobId: string;
    url: string;
    timestamp: string;
    score: number; // 0-100
    issues: Array<{
        id: string;
        type: 'error' | 'warning' | 'info';
        category: string;
        message: string;
        impact: 'critical' | 'high' | 'medium' | 'low';
        recommendation: string;
    }>;
    metaTags: {
        title?: { content: string; length: number; isOptimal: boolean };
        description?: { content: string; length: number; isOptimal: boolean };
        keywords?: string[];
        canonical?: string;
        robots?: string;
        viewport?: string;
    };
    openGraph: {
        title?: string;
        description?: string;
        image?: string;
        url?: string;
        type?: string;
        siteName?: string;
    };
    twitterCard: {
        card?: string;
        title?: string;
        description?: string;
        image?: string;
        site?: string;
        creator?: string;
    };
    structuredData: Array<{
        type: string;
        valid: boolean;
        errors?: string[];
    }>;
    technicalSEO: {
        hasRobotsTxt: boolean;
        hasSitemap: boolean;
        hasSSL: boolean;
        mobileOptimized: boolean;
        pageSpeed: number;
        h1Count: number;
        imagesMissingAlt: number;
        brokenLinks: number;
    };
}

export class SEOWorker {
    private worker: Worker;
    private logger: Logger;
    private connection: RedisConnection;

    constructor() {
        this.logger = new Logger('SEOWorker');
        this.connection = new RedisConnection();

        this.worker = new Worker(
            'guardian-seo',
            async (job: Job<SEOJobData>) => {
                return await this.processSEOJob(job);
            },
            {
                connection: this.connection.getConnection(),
                concurrency: 5,
                limiter: {
                    max: 30,
                    duration: 60000,
                },
            }
        );

        this.setupEventHandlers();
    }

    private async processSEOJob(job: Job<SEOJobData>): Promise<SEOResult> {
        const { url, projectId, userId, options = {} } = job.data;
        const jobId = job.id || 'unknown';

        this.logger.info(`Starting SEO audit for ${url} (Job: ${jobId})`);
        await job.updateProgress(5);

        const result: SEOResult = {
            jobId,
            url,
            timestamp: new Date().toISOString(),
            score: 0,
            issues: [],
            metaTags: {},
            openGraph: {},
            twitterCard: {},
            structuredData: [],
            technicalSEO: {
                hasRobotsTxt: false,
                hasSitemap: false,
                hasSSL: url.startsWith('https'),
                mobileOptimized: false,
                pageSpeed: 0,
                h1Count: 0,
                imagesMissingAlt: 0,
                brokenLinks: 0,
            },
        };

        try {
            // Fetch HTML
            await job.updateProgress(10);
            const response = await fetch(url, {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (compatible; ODAVL-Guardian/2.0; +https://odavl.com)',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            const dom = new JSDOM(html);
            const document = dom.window.document;

            await job.updateProgress(20);

            // Analyze meta tags
            result.metaTags = this.analyzeMeta(document, result.issues);

            await job.updateProgress(35);

            // Analyze OpenGraph
            result.openGraph = this.analyzeOpenGraph(document, result.issues);

            await job.updateProgress(50);

            // Analyze Twitter Cards
            result.twitterCard = this.analyzeTwitterCards(document, result.issues);

            await job.updateProgress(60);

            // Analyze structured data
            if (options.checkStructuredData !== false) {
                result.structuredData = this.analyzeStructuredData(document, result.issues);
            }

            await job.updateProgress(70);

            // Technical SEO checks
            result.technicalSEO = await this.analyzeTechnicalSEO(
                url,
                document,
                result.issues,
                options
            );

            await job.updateProgress(85);

            // Calculate score
            result.score = this.calculateSEOScore(result);

            await job.updateProgress(95);

            // Store results
            await this.connection.storeResult(
                `seo:${projectId}:${userId}:${jobId}`,
                result,
                7 * 24 * 60 * 60 // 7 days
            );

            await job.updateProgress(100);

            this.logger.info(`SEO audit completed for ${url} - Score: ${result.score}/100`);

            return result;
        } catch (error) {
            this.logger.error(`SEO audit failed for ${url}:`, error);
            throw error;
        }
    }

    private analyzeMeta(document: Document, issues: SEOResult['issues']): SEOResult['metaTags'] {
        const metaTags: SEOResult['metaTags'] = {};

        // Title
        const titleEl = document.querySelector('title');
        if (titleEl) {
            const title = titleEl.textContent || '';
            metaTags.title = {
                content: title,
                length: title.length,
                isOptimal: title.length >= 30 && title.length <= 60,
            };

            if (title.length === 0) {
                issues.push({
                    id: 'missing-title',
                    type: 'error',
                    category: 'Meta Tags',
                    message: 'Page has no title tag',
                    impact: 'critical',
                    recommendation: 'Add a unique, descriptive title (30-60 characters)',
                });
            } else if (title.length < 30) {
                issues.push({
                    id: 'short-title',
                    type: 'warning',
                    category: 'Meta Tags',
                    message: `Title is too short (${title.length} chars)`,
                    impact: 'medium',
                    recommendation: 'Expand title to 30-60 characters for better SEO',
                });
            } else if (title.length > 60) {
                issues.push({
                    id: 'long-title',
                    type: 'warning',
                    category: 'Meta Tags',
                    message: `Title may be truncated (${title.length} chars)`,
                    impact: 'low',
                    recommendation: 'Shorten title to under 60 characters',
                });
            }
        } else {
            issues.push({
                id: 'no-title-tag',
                type: 'error',
                category: 'Meta Tags',
                message: 'Missing <title> tag',
                impact: 'critical',
                recommendation: 'Add <title> tag with descriptive content',
            });
        }

        // Description
        const descEl = document.querySelector('meta[name="description"]');
        if (descEl) {
            const desc = descEl.getAttribute('content') || '';
            metaTags.description = {
                content: desc,
                length: desc.length,
                isOptimal: desc.length >= 120 && desc.length <= 160,
            };

            if (desc.length === 0) {
                issues.push({
                    id: 'empty-description',
                    type: 'error',
                    category: 'Meta Tags',
                    message: 'Meta description is empty',
                    impact: 'high',
                    recommendation: 'Add compelling description (120-160 characters)',
                });
            } else if (desc.length < 120) {
                issues.push({
                    id: 'short-description',
                    type: 'warning',
                    category: 'Meta Tags',
                    message: `Description too short (${desc.length} chars)`,
                    impact: 'medium',
                    recommendation: 'Expand to 120-160 characters',
                });
            } else if (desc.length > 160) {
                issues.push({
                    id: 'long-description',
                    type: 'warning',
                    category: 'Meta Tags',
                    message: `Description may be truncated (${desc.length} chars)`,
                    impact: 'low',
                    recommendation: 'Shorten to under 160 characters',
                });
            }
        } else {
            issues.push({
                id: 'missing-description',
                type: 'error',
                category: 'Meta Tags',
                message: 'Missing meta description',
                impact: 'high',
                recommendation: 'Add meta description for better click-through rates',
            });
        }

        // Canonical
        const canonicalEl = document.querySelector('link[rel="canonical"]');
        if (canonicalEl) {
            metaTags.canonical = canonicalEl.getAttribute('href') || undefined;
        }

        // Viewport
        const viewportEl = document.querySelector('meta[name="viewport"]');
        if (viewportEl) {
            metaTags.viewport = viewportEl.getAttribute('content') || undefined;
        } else {
            issues.push({
                id: 'missing-viewport',
                type: 'error',
                category: 'Mobile',
                message: 'Missing viewport meta tag',
                impact: 'high',
                recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
            });
        }

        return metaTags;
    }

    private analyzeOpenGraph(
        document: Document,
        issues: SEOResult['issues']
    ): SEOResult['openGraph'] {
        const og: SEOResult['openGraph'] = {};

        og.title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || undefined;
        og.description = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || undefined;
        og.image = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined;
        og.url = document.querySelector('meta[property="og:url"]')?.getAttribute('content') || undefined;
        og.type = document.querySelector('meta[property="og:type"]')?.getAttribute('content') || undefined;
        og.siteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || undefined;

        if (!og.title || !og.description) {
            issues.push({
                id: 'incomplete-og',
                type: 'warning',
                category: 'Social Sharing',
                message: 'Incomplete OpenGraph tags',
                impact: 'medium',
                recommendation: 'Add og:title, og:description, and og:image for better social sharing',
            });
        }

        return og;
    }

    private analyzeTwitterCards(
        document: Document,
        issues: SEOResult['issues']
    ): SEOResult['twitterCard'] {
        const twitter: SEOResult['twitterCard'] = {};

        twitter.card = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || undefined;
        twitter.title = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || undefined;
        twitter.description = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || undefined;
        twitter.image = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || undefined;

        if (!twitter.card) {
            issues.push({
                id: 'missing-twitter-card',
                type: 'info',
                category: 'Social Sharing',
                message: 'No Twitter Card tags',
                impact: 'low',
                recommendation: 'Add Twitter Card tags for better Twitter sharing',
            });
        }

        return twitter;
    }

    private analyzeStructuredData(
        document: Document,
        issues: SEOResult['issues']
    ): SEOResult['structuredData'] {
        const structured: SEOResult['structuredData'] = [];

        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        scripts.forEach((script, index) => {
            try {
                const data = JSON.parse(script.textContent || '{}');
                structured.push({
                    type: data['@type'] || 'Unknown',
                    valid: true,
                });
            } catch {
                structured.push({
                    type: 'Invalid JSON-LD',
                    valid: false,
                    errors: ['Failed to parse JSON-LD'],
                });
                issues.push({
                    id: `invalid-structured-data-${index}`,
                    type: 'error',
                    category: 'Structured Data',
                    message: 'Invalid JSON-LD structured data',
                    impact: 'medium',
                    recommendation: 'Fix JSON syntax in structured data',
                });
            }
        });

        if (structured.length === 0) {
            issues.push({
                id: 'no-structured-data',
                type: 'warning',
                category: 'Structured Data',
                message: 'No structured data found',
                impact: 'medium',
                recommendation: 'Add Schema.org structured data for rich snippets',
            });
        }

        return structured;
    }

    private async analyzeTechnicalSEO(
        url: string,
        document: Document,
        issues: SEOResult['issues'],
        options: SEOJobData['options']
    ): Promise<SEOResult['technicalSEO']> {
        const technical: SEOResult['technicalSEO'] = {
            hasRobotsTxt: false,
            hasSitemap: false,
            hasSSL: url.startsWith('https'),
            mobileOptimized: false,
            pageSpeed: 0,
            h1Count: 0,
            imagesMissingAlt: 0,
            brokenLinks: 0,
        };

        // SSL Check
        if (!technical.hasSSL) {
            issues.push({
                id: 'no-ssl',
                type: 'error',
                category: 'Security',
                message: 'Site not using HTTPS',
                impact: 'critical',
                recommendation: 'Enable HTTPS with valid SSL certificate',
            });
        }

        // H1 tags
        const h1Elements = document.querySelectorAll('h1');
        technical.h1Count = h1Elements.length;
        if (technical.h1Count === 0) {
            issues.push({
                id: 'no-h1',
                type: 'error',
                category: 'Content Structure',
                message: 'No H1 heading found',
                impact: 'high',
                recommendation: 'Add exactly one H1 tag with main page topic',
            });
        } else if (technical.h1Count > 1) {
            issues.push({
                id: 'multiple-h1',
                type: 'warning',
                category: 'Content Structure',
                message: `Multiple H1 tags found (${technical.h1Count})`,
                impact: 'medium',
                recommendation: 'Use only one H1 tag per page',
            });
        }

        // Images without alt
        const images = document.querySelectorAll('img');
        images.forEach((img) => {
            if (!img.getAttribute('alt')) {
                technical.imagesMissingAlt++;
            }
        });

        if (technical.imagesMissingAlt > 0) {
            issues.push({
                id: 'images-missing-alt',
                type: 'warning',
                category: 'Accessibility',
                message: `${technical.imagesMissingAlt} images missing alt text`,
                impact: 'medium',
                recommendation: 'Add descriptive alt text to all images',
            });
        }

        // Robots.txt check
        if (options?.checkRobots !== false) {
            try {
                const robotsUrl = new URL('/robots.txt', url).toString();
                const response = await fetch(robotsUrl);
                technical.hasRobotsTxt = response.ok;

                if (!technical.hasRobotsTxt) {
                    issues.push({
                        id: 'no-robots',
                        type: 'info',
                        category: 'Crawlability',
                        message: 'No robots.txt found',
                        impact: 'low',
                        recommendation: 'Add robots.txt to guide search engine crawlers',
                    });
                }
            } catch {
                // Ignore errors
            }
        }

        // Sitemap check
        if (options?.checkSitemap !== false) {
            try {
                const sitemapUrl = new URL('/sitemap.xml', url).toString();
                const response = await fetch(sitemapUrl);
                technical.hasSitemap = response.ok;

                if (!technical.hasSitemap) {
                    issues.push({
                        id: 'no-sitemap',
                        type: 'warning',
                        category: 'Crawlability',
                        message: 'No sitemap.xml found',
                        impact: 'medium',
                        recommendation: 'Create XML sitemap for better indexing',
                    });
                }
            } catch {
                // Ignore errors
            }
        }

        // Mobile optimization (basic check)
        const viewport = document.querySelector('meta[name="viewport"]');
        technical.mobileOptimized = viewport !== null;

        return technical;
    }

    private calculateSEOScore(result: SEOResult): number {
        let score = 100;

        // Deduct points for issues
        result.issues.forEach((issue) => {
            switch (issue.impact) {
                case 'critical':
                    score -= 15;
                    break;
                case 'high':
                    score -= 10;
                    break;
                case 'medium':
                    score -= 5;
                    break;
                case 'low':
                    score -= 2;
                    break;
            }
        });

        // Bonus for optimal meta tags
        if (result.metaTags.title?.isOptimal) score += 5;
        if (result.metaTags.description?.isOptimal) score += 5;

        // Bonus for structured data
        if (result.structuredData.length > 0) score += 5;

        // Bonus for SSL
        if (result.technicalSEO.hasSSL) score += 5;

        return Math.max(0, Math.min(100, score));
    }

    private setupEventHandlers(): void {
        this.worker.on('completed', (job: Job, result: SEOResult) => {
            this.logger.info(
                `Job ${job.id} completed - URL: ${result.url}, Score: ${result.score}/100`
            );
        });

        this.worker.on('failed', (job: Job | undefined, error: Error) => {
            this.logger.error(`Job ${job?.id} failed:`, error.message);
        });

        this.worker.on('progress', (job: Job, progress: JobProgress) => {
            this.logger.debug(`Job ${job.id} progress: ${progress}%`);
        });

        this.worker.on('error', (error: Error) => {
            this.logger.error('Worker error:', error);
        });
    }

    async start(): Promise<void> {
        this.logger.info('SEO Worker started - Listening for jobs...');
    }

    async stop(): Promise<void> {
        await this.worker.close();
        await this.connection.disconnect();
        this.logger.info('SEO Worker stopped');
    }
}

// Start worker if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const worker = new SEOWorker();
    await worker.start();

    process.on('SIGINT', async () => {
        console.log('Shutting down SEO Worker...');
        await worker.stop();
        process.exit(0);
    });
}
