/**
 * @fileoverview Widget Marketplace - Widget discovery and distribution platform
 * @module @odavl-studio/insight-core/widgets/widget-marketplace
 * 
 * **Purpose**: Provide marketplace for sharing and discovering custom widgets
 * 
 * **Features**:
 * - Widget catalog (search, browse, filter)
 * - Publishing system (submit, review, approve)
 * - Version management (updates, changelogs)
 * - Rating & reviews (5-star, comments)
 * - Usage analytics (downloads, installs)
 * - Categories & tags (organization, discovery)
 * - Installation (one-click, CLI)
 * - License management (MIT, Apache, proprietary)
 * - Security scanning (automated checks)
 * - Documentation (README, examples, API docs)
 * - Screenshot gallery
 * - Live previews
 * - Community features (discussions, support)
 * 
 * **Widget States**:
 * - DRAFT - Being developed
 * - SUBMITTED - Awaiting review
 * - APPROVED - Published in marketplace
 * - REJECTED - Failed review
 * - DEPRECATED - No longer maintained
 * 
 * **Architecture**:
 * ```
 * WidgetMarketplace
 *   ├── search(query, filters) → Widget[]
 *   ├── publish(widget) → PublishedWidget
 *   ├── install(widgetId) → InstalledWidget
 *   ├── update(widgetId) → UpdatedWidget
 *   ├── rate(widgetId, rating) → void
 *   ├── review(widgetId, review) → void
 *   ├── getAnalytics(widgetId) → Analytics
 *   └── uninstall(widgetId) → void
 * ```
 * 
 * **Integration Points**:
 * - Used by: Widget Builder, Studio Hub, CLI
 * - Backend: REST API, GraphQL
 * - Storage: PostgreSQL (metadata), S3 (packages)
 */

import { EventEmitter } from 'events';
import type { WidgetDefinition } from './widget-builder';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Widget state
 */
export enum WidgetState {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DEPRECATED = 'deprecated',
}

/**
 * Widget category
 */
export enum WidgetCategory {
  CHART = 'chart',
  METRIC = 'metric',
  LIST = 'list',
  TABLE = 'table',
  INSIGHT = 'insight',
  CUSTOM = 'custom',
}

/**
 * License type
 */
export enum LicenseType {
  MIT = 'MIT',
  APACHE_2_0 = 'Apache-2.0',
  GPL_3_0 = 'GPL-3.0',
  BSD_3_CLAUSE = 'BSD-3-Clause',
  PROPRIETARY = 'Proprietary',
}

/**
 * Marketplace widget
 */
export interface MarketplaceWidget {
  /** Widget ID */
  id: string;

  /** Widget name */
  name: string;

  /** Short description */
  description: string;

  /** Long description (markdown) */
  longDescription?: string;

  /** Category */
  category: WidgetCategory;

  /** Tags */
  tags: string[];

  /** State */
  state: WidgetState;

  /** Version */
  version: string;

  /** Author */
  author: {
    id: string;
    name: string;
    email: string;
    website?: string;
  };

  /** License */
  license: LicenseType;

  /** Widget definition */
  definition: WidgetDefinition;

  /** Package URL */
  packageUrl: string;

  /** Screenshots */
  screenshots: Array<{
    url: string;
    caption?: string;
  }>;

  /** Demo URL */
  demoUrl?: string;

  /** Documentation URL */
  docsUrl?: string;

  /** Repository URL */
  repositoryUrl?: string;

  /** Statistics */
  stats: {
    downloads: number;
    installs: number;
    rating: number; // 0-5
    reviewCount: number;
    views: number;
  };

  /** Dependencies */
  dependencies?: Record<string, string>;

  /** Minimum ODAVL version */
  minOdavlVersion?: string;

  /** Metadata */
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    deprecatedAt?: Date;
  };
}

/**
 * Widget review
 */
export interface WidgetReview {
  /** Review ID */
  id: string;

  /** Widget ID */
  widgetId: string;

  /** User */
  user: {
    id: string;
    name: string;
  };

  /** Rating (1-5) */
  rating: number;

  /** Comment */
  comment: string;

  /** Helpful count */
  helpfulCount: number;

  /** Created at */
  createdAt: Date;

  /** Updated at */
  updatedAt?: Date;
}

/**
 * Widget analytics
 */
export interface WidgetAnalytics {
  /** Widget ID */
  widgetId: string;

  /** Total downloads */
  totalDownloads: number;

  /** Total installs */
  totalInstalls: number;

  /** Active installs */
  activeInstalls: number;

  /** Downloads by version */
  downloadsByVersion: Record<string, number>;

  /** Downloads over time */
  downloadsOverTime: Array<{
    date: Date;
    count: number;
  }>;

  /** Geographic distribution */
  byCountry: Record<string, number>;

  /** Average rating */
  averageRating: number;

  /** Rating distribution */
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };

  /** Top referrers */
  topReferrers: Array<{
    source: string;
    count: number;
  }>;

  /** Last updated */
  lastUpdated: Date;
}

/**
 * Installed widget
 */
export interface InstalledWidget {
  /** Widget ID */
  id: string;

  /** Marketplace widget ID */
  marketplaceId: string;

  /** Version */
  version: string;

  /** Installed at */
  installedAt: Date;

  /** Last used */
  lastUsed?: Date;

  /** Usage count */
  usageCount: number;

  /** Update available */
  updateAvailable: boolean;

  /** Latest version */
  latestVersion?: string;
}

/**
 * Search filters
 */
export interface SearchFilters {
  /** Query string */
  query?: string;

  /** Category */
  category?: WidgetCategory;

  /** Tags */
  tags?: string[];

  /** Author */
  author?: string;

  /** License */
  license?: LicenseType;

  /** Minimum rating */
  minRating?: number;

  /** Sort by */
  sortBy?: 'relevance' | 'downloads' | 'rating' | 'recent';

  /** Sort order */
  sortOrder?: 'asc' | 'desc';

  /** Page */
  page?: number;

  /** Page size */
  pageSize?: number;
}

/**
 * Search result
 */
export interface SearchResult {
  /** Widgets */
  widgets: MarketplaceWidget[];

  /** Total count */
  total: number;

  /** Current page */
  page: number;

  /** Page size */
  pageSize: number;

  /** Total pages */
  totalPages: number;

  /** Has more */
  hasMore: boolean;
}

/**
 * Publishing request
 */
export interface PublishingRequest {
  /** Widget definition */
  definition: WidgetDefinition;

  /** Category */
  category: WidgetCategory;

  /** Tags */
  tags: string[];

  /** License */
  license: LicenseType;

  /** Screenshots (base64 or URLs) */
  screenshots?: string[];

  /** Long description */
  longDescription?: string;

  /** Documentation */
  documentation?: string;

  /** Repository URL */
  repositoryUrl?: string;
}

/**
 * Marketplace configuration
 */
export interface MarketplaceConfig {
  /** API base URL */
  apiBaseUrl: string;

  /** Authentication token */
  authToken?: string;

  /** Enable analytics */
  enableAnalytics: boolean;

  /** Enable auto-updates */
  enableAutoUpdates: boolean;

  /** Cache TTL (seconds) */
  cacheTTL: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: MarketplaceConfig = {
  apiBaseUrl: 'https://marketplace.odavl.com/api',
  enableAnalytics: true,
  enableAutoUpdates: false,
  cacheTTL: 3600, // 1 hour
};

// ============================================================================
// WidgetMarketplace Class
// ============================================================================

/**
 * Widget Marketplace - Discovery and distribution
 * 
 * **Usage**:
 * ```typescript
 * import { WidgetMarketplace } from '@odavl-studio/insight-core/widgets/widget-marketplace';
 * 
 * const marketplace = new WidgetMarketplace({
 *   authToken: 'your-api-token',
 * });
 * 
 * // Search widgets
 * const results = await marketplace.search({
 *   query: 'quality chart',
 *   category: WidgetCategory.CHART,
 *   minRating: 4.0,
 *   sortBy: 'downloads',
 * });
 * 
 * console.log(`Found ${results.total} widgets`);
 * 
 * // Browse by category
 * const chartWidgets = await marketplace.browseCategory(WidgetCategory.CHART);
 * 
 * // Get widget details
 * const widget = await marketplace.getWidget('widget-123');
 * console.log(`${widget.name} by ${widget.author.name}`);
 * console.log(`Rating: ${widget.stats.rating}/5 (${widget.stats.reviewCount} reviews)`);
 * 
 * // Install widget
 * const installed = await marketplace.install('widget-123');
 * console.log(`Installed ${installed.version}`);
 * 
 * // Get reviews
 * const reviews = await marketplace.getReviews('widget-123');
 * 
 * // Rate widget
 * await marketplace.rate('widget-123', 5);
 * 
 * // Leave review
 * await marketplace.review('widget-123', {
 *   rating: 5,
 *   comment: 'Excellent widget! Very useful.',
 * });
 * 
 * // Check for updates
 * const updates = await marketplace.checkUpdates();
 * if (updates.length > 0) {
 *   console.log(`${updates.length} updates available`);
 *   
 *   // Update all
 *   await marketplace.updateAll();
 * }
 * 
 * // Uninstall widget
 * await marketplace.uninstall('widget-123');
 * ```
 * 
 * **Publishing**:
 * ```typescript
 * // Create widget definition
 * const builder = new WidgetBuilder();
 * const widget = builder.createWidget(WidgetType.LINE_CHART);
 * // ... configure widget ...
 * 
 * // Publish to marketplace
 * const published = await marketplace.publish({
 *   definition: builder.getDefinition(),
 *   category: WidgetCategory.CHART,
 *   tags: ['quality', 'trend', 'chart'],
 *   license: LicenseType.MIT,
 *   screenshots: ['screenshot1.png', 'screenshot2.png'],
 *   longDescription: '# Quality Trend Chart\n\n...',
 *   repositoryUrl: 'https://github.com/user/widget',
 * });
 * 
 * console.log(`Published: ${published.id}`);
 * console.log(`Marketplace URL: ${published.marketplaceUrl}`);
 * ```
 * 
 * **Analytics**:
 * ```typescript
 * // Get widget analytics
 * const analytics = await marketplace.getAnalytics('widget-123');
 * 
 * console.log(`Total downloads: ${analytics.totalDownloads}`);
 * console.log(`Active installs: ${analytics.activeInstalls}`);
 * console.log(`Average rating: ${analytics.averageRating}/5`);
 * 
 * // Downloads over time
 * analytics.downloadsOverTime.forEach(({ date, count }) => {
 *   console.log(`${date.toISOString()}: ${count} downloads`);
 * });
 * ```
 */
export class WidgetMarketplace extends EventEmitter {
  private config: MarketplaceConfig;
  private installedWidgets: Map<string, InstalledWidget> = new Map();
  private cache: Map<string, { data: any; timestamp: Date }> = new Map();

  constructor(config: Partial<MarketplaceConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadInstalledWidgets();
  }

  // ==========================================================================
  // Public API - Search & Browse
  // ==========================================================================

  /**
   * Search widgets
   * 
   * @param filters - Search filters
   * @returns Search result
   */
  async search(filters: SearchFilters = {}): Promise<SearchResult> {
    const cacheKey = this.getCacheKey('search', filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Mock search results
    const mockWidgets: MarketplaceWidget[] = [
      {
        id: 'widget-1',
        name: 'Quality Trend Chart',
        description: 'Visualize quality score trends over time',
        category: WidgetCategory.CHART,
        tags: ['quality', 'trend', 'chart'],
        state: WidgetState.APPROVED,
        version: '1.0.0',
        author: {
          id: 'author-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
        license: LicenseType.MIT,
        definition: {} as WidgetDefinition,
        packageUrl: 'https://marketplace.odavl.com/packages/widget-1-1.0.0.tgz',
        screenshots: [],
        stats: {
          downloads: 1250,
          installs: 890,
          rating: 4.7,
          reviewCount: 45,
          views: 5400,
        },
        metadata: {
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-11-15'),
          publishedAt: new Date('2025-01-15'),
        },
      },
    ];

    const result: SearchResult = {
      widgets: mockWidgets,
      total: mockWidgets.length,
      page: filters.page || 1,
      pageSize: filters.pageSize || 20,
      totalPages: Math.ceil(mockWidgets.length / (filters.pageSize || 20)),
      hasMore: false,
    };

    this.setCache(cacheKey, result);
    this.emit('search:completed', { filters, result });

    return result;
  }

  /**
   * Browse widgets by category
   * 
   * @param category - Widget category
   * @returns Array of widgets
   */
  async browseCategory(category: WidgetCategory): Promise<MarketplaceWidget[]> {
    return (await this.search({ category })).widgets;
  }

  /**
   * Get widget by ID
   * 
   * @param widgetId - Widget ID
   * @returns Marketplace widget
   */
  async getWidget(widgetId: string): Promise<MarketplaceWidget> {
    const cacheKey = this.getCacheKey('widget', { id: widgetId });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Mock widget fetch
    const mockWidget: MarketplaceWidget = {
      id: widgetId,
      name: 'Quality Trend Chart',
      description: 'Visualize quality score trends over time',
      longDescription: '# Quality Trend Chart\n\nDetailed description...',
      category: WidgetCategory.CHART,
      tags: ['quality', 'trend', 'chart'],
      state: WidgetState.APPROVED,
      version: '1.0.0',
      author: {
        id: 'author-1',
        name: 'John Doe',
        email: 'john@example.com',
        website: 'https://johndoe.com',
      },
      license: LicenseType.MIT,
      definition: {} as WidgetDefinition,
      packageUrl: 'https://marketplace.odavl.com/packages/widget-1-1.0.0.tgz',
      screenshots: [
        { url: 'https://example.com/screenshot1.png', caption: 'Main view' },
      ],
      demoUrl: 'https://demo.odavl.com/widget-1',
      docsUrl: 'https://docs.odavl.com/widgets/quality-trend-chart',
      repositoryUrl: 'https://github.com/user/quality-trend-chart',
      stats: {
        downloads: 1250,
        installs: 890,
        rating: 4.7,
        reviewCount: 45,
        views: 5400,
      },
      metadata: {
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-11-15'),
        publishedAt: new Date('2025-01-15'),
      },
    };

    this.setCache(cacheKey, mockWidget);
    this.emit('widget:fetched', { widgetId });

    return mockWidget;
  }

  /**
   * Get featured widgets
   * 
   * @param count - Number of widgets
   * @returns Array of featured widgets
   */
  async getFeatured(count = 10): Promise<MarketplaceWidget[]> {
    return (await this.search({ sortBy: 'rating', pageSize: count })).widgets;
  }

  /**
   * Get trending widgets
   * 
   * @param count - Number of widgets
   * @returns Array of trending widgets
   */
  async getTrending(count = 10): Promise<MarketplaceWidget[]> {
    return (await this.search({ sortBy: 'downloads', pageSize: count })).widgets;
  }

  // ==========================================================================
  // Public API - Installation
  // ==========================================================================

  /**
   * Install widget
   * 
   * @param widgetId - Widget ID
   * @param version - Optional version (defaults to latest)
   * @returns Installed widget
   */
  async install(widgetId: string, version?: string): Promise<InstalledWidget> {
    const widget = await this.getWidget(widgetId);

    // Mock installation
    const installed: InstalledWidget = {
      id: this.generateId(),
      marketplaceId: widgetId,
      version: version || widget.version,
      installedAt: new Date(),
      usageCount: 0,
      updateAvailable: false,
    };

    this.installedWidgets.set(widgetId, installed);
    this.saveInstalledWidgets();

    // Update stats
    if (this.config.enableAnalytics) {
      await this.trackInstall(widgetId);
    }

    this.emit('widget:installed', { widgetId, version: installed.version });

    return installed;
  }

  /**
   * Uninstall widget
   * 
   * @param widgetId - Widget ID
   */
  async uninstall(widgetId: string): Promise<void> {
    this.installedWidgets.delete(widgetId);
    this.saveInstalledWidgets();

    this.emit('widget:uninstalled', { widgetId });
  }

  /**
   * Update widget
   * 
   * @param widgetId - Widget ID
   * @param version - Optional version (defaults to latest)
   * @returns Updated widget
   */
  async update(widgetId: string, version?: string): Promise<InstalledWidget> {
    await this.uninstall(widgetId);
    return await this.install(widgetId, version);
  }

  /**
   * Check for updates
   * 
   * @returns Array of widgets with updates
   */
  async checkUpdates(): Promise<InstalledWidget[]> {
    const updates: InstalledWidget[] = [];

    for (const [widgetId, installed] of this.installedWidgets) {
      const widget = await this.getWidget(widgetId);

      if (widget.version !== installed.version) {
        installed.updateAvailable = true;
        installed.latestVersion = widget.version;
        updates.push(installed);
      }
    }

    this.emit('updates:checked', { count: updates.length });

    return updates;
  }

  /**
   * Update all widgets
   */
  async updateAll(): Promise<void> {
    const updates = await this.checkUpdates();

    for (const widget of updates) {
      await this.update(widget.marketplaceId, widget.latestVersion);
    }

    this.emit('updates:completed', { count: updates.length });
  }

  /**
   * List installed widgets
   * 
   * @returns Array of installed widgets
   */
  listInstalled(): InstalledWidget[] {
    return Array.from(this.installedWidgets.values());
  }

  // ==========================================================================
  // Public API - Publishing
  // ==========================================================================

  /**
   * Publish widget to marketplace
   * 
   * @param request - Publishing request
   * @returns Published widget
   */
  async publish(request: PublishingRequest): Promise<MarketplaceWidget> {
    // Validate request
    if (!request.definition) {
      throw new Error('Widget definition is required');
    }

    if (!request.category) {
      throw new Error('Category is required');
    }

    if (!request.license) {
      throw new Error('License is required');
    }

    // Mock publishing
    const published: MarketplaceWidget = {
      id: this.generateId(),
      name: request.definition.name,
      description: request.definition.description || '',
      longDescription: request.longDescription,
      category: request.category,
      tags: request.tags,
      state: WidgetState.SUBMITTED,
      version: request.definition.version,
      author: request.definition.author,
      license: request.license,
      definition: request.definition,
      packageUrl: 'https://marketplace.odavl.com/packages/pending',
      screenshots: request.screenshots?.map(url => ({ url })) || [],
      repositoryUrl: request.repositoryUrl,
      stats: {
        downloads: 0,
        installs: 0,
        rating: 0,
        reviewCount: 0,
        views: 0,
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    this.emit('widget:published', { widget: published });

    return published;
  }

  // ==========================================================================
  // Public API - Reviews & Ratings
  // ==========================================================================

  /**
   * Rate widget
   * 
   * @param widgetId - Widget ID
   * @param rating - Rating (1-5)
   */
  async rate(widgetId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Mock rating submission
    this.emit('widget:rated', { widgetId, rating });
  }

  /**
   * Submit review
   * 
   * @param widgetId - Widget ID
   * @param review - Review details
   * @returns Created review
   */
  async review(
    widgetId: string,
    review: { rating: number; comment: string }
  ): Promise<WidgetReview> {
    if (review.rating < 1 || review.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Mock review submission
    const created: WidgetReview = {
      id: this.generateId(),
      widgetId,
      user: {
        id: 'current-user',
        name: 'Current User',
      },
      rating: review.rating,
      comment: review.comment,
      helpfulCount: 0,
      createdAt: new Date(),
    };

    this.emit('review:created', { review: created });

    return created;
  }

  /**
   * Get widget reviews
   * 
   * @param widgetId - Widget ID
   * @param page - Page number
   * @param pageSize - Page size
   * @returns Array of reviews
   */
  async getReviews(
    widgetId: string,
    page = 1,
    pageSize = 10
  ): Promise<WidgetReview[]> {
    // Mock reviews
    const mockReviews: WidgetReview[] = [
      {
        id: 'review-1',
        widgetId,
        user: {
          id: 'user-1',
          name: 'Jane Smith',
        },
        rating: 5,
        comment: 'Excellent widget! Very easy to use.',
        helpfulCount: 12,
        createdAt: new Date('2025-11-01'),
      },
    ];

    return mockReviews;
  }

  // ==========================================================================
  // Public API - Analytics
  // ==========================================================================

  /**
   * Get widget analytics
   * 
   * @param widgetId - Widget ID
   * @returns Widget analytics
   */
  async getAnalytics(widgetId: string): Promise<WidgetAnalytics> {
    // Mock analytics
    const analytics: WidgetAnalytics = {
      widgetId,
      totalDownloads: 1250,
      totalInstalls: 890,
      activeInstalls: 750,
      downloadsByVersion: {
        '1.0.0': 1250,
      },
      downloadsOverTime: [
        { date: new Date('2025-11-01'), count: 45 },
        { date: new Date('2025-11-02'), count: 52 },
      ],
      byCountry: {
        US: 450,
        UK: 200,
        DE: 150,
      },
      averageRating: 4.7,
      ratingDistribution: {
        1: 2,
        2: 3,
        3: 5,
        4: 15,
        5: 20,
      },
      topReferrers: [
        { source: 'odavl.com', count: 600 },
        { source: 'github.com', count: 250 },
      ],
      lastUpdated: new Date(),
    };

    this.emit('analytics:fetched', { widgetId });

    return analytics;
  }

  /**
   * Track widget install (internal)
   */
  private async trackInstall(widgetId: string): Promise<void> {
    // Mock analytics tracking
    this.emit('analytics:tracked', { widgetId, event: 'install' });
  }

  // ==========================================================================
  // Private Methods - Cache
  // ==========================================================================

  /**
   * Get from cache
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp.getTime();
    if (age > this.config.cacheTTL * 1000) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: new Date() });
  }

  /**
   * Get cache key
   */
  private getCacheKey(prefix: string, params: any): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  // ==========================================================================
  // Private Methods - Storage
  // ==========================================================================

  /**
   * Load installed widgets
   */
  private loadInstalledWidgets(): void {
    // Mock loading from localStorage/file
    // In real implementation, load from persistent storage
  }

  /**
   * Save installed widgets
   */
  private saveInstalledWidgets(): void {
    // Mock saving to localStorage/file
    // In real implementation, save to persistent storage
  }

  // ==========================================================================
  // Private Methods - Utilities
  // ==========================================================================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create marketplace instance
 * 
 * @param config - Marketplace configuration
 * @returns WidgetMarketplace instance
 */
export function createMarketplace(
  config?: Partial<MarketplaceConfig>
): WidgetMarketplace {
  return new WidgetMarketplace(config);
}
