/**
 * ODAVL Insight - Plugin Marketplace API
 * REST API for browsing, installing, and publishing plugins
 */

import express, { Router, Request, Response } from 'express';
import type { PluginMetadata } from '@odavl-studio/sdk/plugin';

// ============================================================
// Types
// ============================================================

export interface MarketplacePlugin extends PluginMetadata {
  // Marketplace-specific fields
  downloads: number;
  rating: number; // 0-5
  reviews: number;
  publishedAt: string; // ISO date
  updatedAt: string; // ISO date
  verified: boolean; // Official or verified plugin
  category: 'detector' | 'analyzer' | 'reporter' | 'integration';
  tags: string[];
  readme?: string;
  changelog?: string;
}

export interface PluginReview {
  id: string;
  pluginId: string;
  userId: string;
  username: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
  helpful: number; // Upvotes
}

export interface PluginStats {
  pluginId: string;
  downloads: {
    total: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  ratings: {
    average: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
    total: number;
  };
  versions: Array<{
    version: string;
    downloads: number;
    publishedAt: string;
  }>;
}

// ============================================================
// Mock Database (Replace with real database)
// ============================================================

const MOCK_PLUGINS: MarketplacePlugin[] = [
  {
    id: 'odavl-react-best-practices',
    name: 'React Best Practices',
    version: '1.0.0',
    description: 'Detect React anti-patterns and enforce best practices',
    author: {
      name: 'ODAVL Team',
      email: 'team@odavl.studio',
      url: 'https://odavl.studio',
    },
    homepage: 'https://plugins.odavl.studio/react-best-practices',
    repository: 'https://github.com/odavl/plugins/tree/main/react-best-practices',
    license: 'MIT',
    type: 'detector',
    keywords: ['react', 'best-practices', 'hooks', 'jsx'],
    engines: {
      odavl: '>=4.0.0',
      node: '>=18.0.0',
    },
    downloads: 45000,
    rating: 4.8,
    reviews: 120,
    publishedAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-11-20T00:00:00Z',
    verified: true,
    category: 'detector',
    tags: ['react', 'hooks', 'jsx', 'typescript'],
  },
  {
    id: 'odavl-security-vulnerabilities',
    name: 'Security Vulnerabilities',
    version: '1.0.0',
    description: 'Detect OWASP Top 10 security vulnerabilities',
    author: {
      name: 'ODAVL Team',
      email: 'security@odavl.studio',
    },
    license: 'MIT',
    type: 'detector',
    keywords: ['security', 'owasp', 'vulnerabilities'],
    engines: {
      odavl: '>=4.0.0',
    },
    downloads: 85000,
    rating: 4.9,
    reviews: 250,
    publishedAt: '2025-01-10T00:00:00Z',
    updatedAt: '2025-11-25T00:00:00Z',
    verified: true,
    category: 'detector',
    tags: ['security', 'owasp', 'injection', 'xss'],
  },
  {
    id: 'odavl-performance-profiler',
    name: 'Performance Profiler',
    version: '2.1.0',
    description: 'Detect performance bottlenecks and optimization opportunities',
    author: {
      name: 'ODAVL Team',
      email: 'team@odavl.studio',
    },
    license: 'MIT',
    type: 'analyzer',
    keywords: ['performance', 'optimization', 'profiling'],
    engines: {
      odavl: '>=4.0.0',
    },
    downloads: 32000,
    rating: 4.6,
    reviews: 85,
    publishedAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-11-15T00:00:00Z',
    verified: true,
    category: 'analyzer',
    tags: ['performance', 'optimization', 'memory', 'cpu'],
  },
  {
    id: 'odavl-html-reporter',
    name: 'HTML Reporter',
    version: '1.2.0',
    description: 'Generate beautiful HTML reports with charts and metrics',
    author: {
      name: 'ODAVL Team',
      email: 'team@odavl.studio',
    },
    license: 'MIT',
    type: 'reporter',
    keywords: ['report', 'html', 'charts', 'dashboard'],
    engines: {
      odavl: '>=4.0.0',
    },
    downloads: 28000,
    rating: 4.7,
    reviews: 65,
    publishedAt: '2025-02-15T00:00:00Z',
    updatedAt: '2025-11-10T00:00:00Z',
    verified: true,
    category: 'reporter',
    tags: ['report', 'html', 'visualization'],
  },
  {
    id: 'odavl-jira-integration',
    name: 'Jira Integration',
    version: '1.0.5',
    description: 'Send detected issues directly to Jira',
    author: {
      name: 'ODAVL Team',
      email: 'team@odavl.studio',
    },
    license: 'MIT',
    type: 'integration',
    keywords: ['jira', 'integration', 'project-management'],
    engines: {
      odavl: '>=4.0.0',
    },
    downloads: 18000,
    rating: 4.5,
    reviews: 45,
    publishedAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
    verified: true,
    category: 'integration',
    tags: ['jira', 'atlassian', 'tickets'],
  },
];

// ============================================================
// Marketplace API Routes
// ============================================================

export function createMarketplaceRouter(): Router {
  const router = Router();
  
  // ============================================================
  // GET /api/plugins - List all plugins
  // ============================================================
  
  router.get('/plugins', (req: Request, res: Response) => {
    const {
      category,
      search,
      sort = 'downloads', // downloads, rating, recent
      page = 1,
      limit = 20,
    } = req.query;
    
    let plugins = [...MOCK_PLUGINS];
    
    // Filter by category
    if (category) {
      plugins = plugins.filter(p => p.category === category);
    }
    
    // Search
    if (search) {
      const searchLower = String(search).toLowerCase();
      plugins = plugins.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.keywords.some(k => k.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort
    if (sort === 'downloads') {
      plugins.sort((a, b) => b.downloads - a.downloads);
    } else if (sort === 'rating') {
      plugins.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'recent') {
      plugins.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    
    // Pagination
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const paginatedPlugins = plugins.slice(start, end);
    
    res.json({
      plugins: paginatedPlugins,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: plugins.length,
        totalPages: Math.ceil(plugins.length / limitNum),
      },
    });
  });
  
  // ============================================================
  // GET /api/plugins/:id - Get plugin details
  // ============================================================
  
  router.get('/plugins/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    res.json(plugin);
  });
  
  // ============================================================
  // GET /api/plugins/:id/stats - Get plugin statistics
  // ============================================================
  
  router.get('/plugins/:id/stats', (req: Request, res: Response) => {
    const { id } = req.params;
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    const stats: PluginStats = {
      pluginId: id,
      downloads: {
        total: plugin.downloads,
        daily: Math.floor(plugin.downloads / 300),
        weekly: Math.floor(plugin.downloads / 50),
        monthly: Math.floor(plugin.downloads / 12),
      },
      ratings: {
        average: plugin.rating,
        distribution: {
          5: Math.floor(plugin.reviews * 0.6),
          4: Math.floor(plugin.reviews * 0.3),
          3: Math.floor(plugin.reviews * 0.08),
          2: Math.floor(plugin.reviews * 0.015),
          1: Math.floor(plugin.reviews * 0.005),
        },
        total: plugin.reviews,
      },
      versions: [
        {
          version: plugin.version,
          downloads: plugin.downloads,
          publishedAt: plugin.publishedAt,
        },
      ],
    };
    
    res.json(stats);
  });
  
  // ============================================================
  // GET /api/plugins/:id/reviews - Get plugin reviews
  // ============================================================
  
  router.get('/plugins/:id/reviews', (req: Request, res: Response) => {
    const { id } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Mock reviews
    const reviews: PluginReview[] = [
      {
        id: '1',
        pluginId: id,
        userId: 'user1',
        username: 'john_doe',
        rating: 5,
        comment: 'Excellent plugin! Saved us hours of manual code review.',
        createdAt: '2025-11-20T10:00:00Z',
        helpful: 15,
      },
      {
        id: '2',
        pluginId: id,
        userId: 'user2',
        username: 'jane_smith',
        rating: 4,
        comment: 'Very useful, but could use more customization options.',
        createdAt: '2025-11-15T14:30:00Z',
        helpful: 8,
      },
    ];
    
    res.json({
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: reviews.length,
      },
    });
  });
  
  // ============================================================
  // POST /api/plugins - Publish a new plugin
  // ============================================================
  
  router.post('/plugins', (req: Request, res: Response) => {
    const plugin: MarketplacePlugin = req.body;
    
    // Validate plugin metadata
    if (!plugin.id || !plugin.name || !plugin.version) {
      return res.status(400).json({ error: 'Missing required fields: id, name, version' });
    }
    
    // Check if plugin already exists
    if (MOCK_PLUGINS.find(p => p.id === plugin.id)) {
      return res.status(409).json({ error: 'Plugin with this ID already exists' });
    }
    
    // Add marketplace fields
    const newPlugin: MarketplacePlugin = {
      ...plugin,
      downloads: 0,
      rating: 0,
      reviews: 0,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verified: false, // Must be verified by ODAVL team
    };
    
    MOCK_PLUGINS.push(newPlugin);
    
    res.status(201).json({
      message: 'Plugin published successfully',
      plugin: newPlugin,
    });
  });
  
  // ============================================================
  // PUT /api/plugins/:id - Update a plugin
  // ============================================================
  
  router.put('/plugins/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    
    const index = MOCK_PLUGINS.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Update plugin
    MOCK_PLUGINS[index] = {
      ...MOCK_PLUGINS[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    res.json({
      message: 'Plugin updated successfully',
      plugin: MOCK_PLUGINS[index],
    });
  });
  
  // ============================================================
  // POST /api/plugins/:id/install - Track plugin installation
  // ============================================================
  
  router.post('/plugins/:id/install', (req: Request, res: Response) => {
    const { id } = req.params;
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Increment download count
    plugin.downloads++;
    
    res.json({
      message: 'Installation tracked',
      plugin,
    });
  });
  
  // ============================================================
  // POST /api/plugins/:id/reviews - Add a review
  // ============================================================
  
  router.post('/plugins/:id/reviews', (req: Request, res: Response) => {
    const { id } = req.params;
    const { rating, comment, userId, username } = req.body;
    
    const plugin = MOCK_PLUGINS.find(p => p.id === id);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Create review
    const review: PluginReview = {
      id: Date.now().toString(),
      pluginId: id,
      userId,
      username,
      rating,
      comment,
      createdAt: new Date().toISOString(),
      helpful: 0,
    };
    
    // Update plugin rating (simple average)
    const newTotalRating = plugin.rating * plugin.reviews + rating;
    plugin.reviews++;
    plugin.rating = Number((newTotalRating / plugin.reviews).toFixed(1));
    
    res.status(201).json({
      message: 'Review added successfully',
      review,
    });
  });
  
  // ============================================================
  // GET /api/featured - Get featured plugins
  // ============================================================
  
  router.get('/featured', (req: Request, res: Response) => {
    // Return top 5 verified plugins by downloads
    const featured = MOCK_PLUGINS
      .filter(p => p.verified)
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 5);
    
    res.json({ plugins: featured });
  });
  
  // ============================================================
  // GET /api/categories - Get plugin categories
  // ============================================================
  
  router.get('/categories', (req: Request, res: Response) => {
    const categories = [
      {
        id: 'detector',
        name: 'Detectors',
        description: 'Custom detection rules for code issues',
        count: MOCK_PLUGINS.filter(p => p.category === 'detector').length,
      },
      {
        id: 'analyzer',
        name: 'Analyzers',
        description: 'Advanced code analysis and metrics',
        count: MOCK_PLUGINS.filter(p => p.category === 'analyzer').length,
      },
      {
        id: 'reporter',
        name: 'Reporters',
        description: 'Custom report formats and visualizations',
        count: MOCK_PLUGINS.filter(p => p.category === 'reporter').length,
      },
      {
        id: 'integration',
        name: 'Integrations',
        description: 'Connect with external tools and services',
        count: MOCK_PLUGINS.filter(p => p.category === 'integration').length,
      },
    ];
    
    res.json({ categories });
  });
  
  return router;
}

// ============================================================
// Create Express App
// ============================================================

export function createMarketplaceApp(): express.Application {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  
  // Routes
  app.use('/api', createMarketplaceRouter());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  
  return app;
}

// ============================================================
// Start Server (if run directly)
// ============================================================

if (require.main === module) {
  const app = createMarketplaceApp();
  const PORT = process.env.PORT || 3001;
  
  app.listen(PORT, () => {
    console.log(`🚀 ODAVL Plugin Marketplace API running on http://localhost:${PORT}`);
    console.log(`📊 Total plugins: ${MOCK_PLUGINS.length}`);
    console.log(`📝 API docs: http://localhost:${PORT}/api/plugins`);
  });
}

export default createMarketplaceApp;
