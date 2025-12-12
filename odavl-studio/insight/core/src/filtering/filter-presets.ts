/**
 * ODAVL Insight Enterprise - Filter Presets
 * Week 42: Advanced Filtering - File 2/3
 * 
 * Features:
 * - Pre-defined filter templates
 * - User-saved filters
 * - Shared team filters
 * - Filter categories (security, performance, quality)
 * - Smart filters (AI-suggested)
 * - Filter versioning
 * - Import/export presets
 * - Filter recommendations
 * - Usage tracking
 * - Filter marketplace
 * 
 * @module filtering/filter-presets
 */

import { EventEmitter } from 'events';
import { Filter, FilterBuilder, LogicOperator, FilterOperator } from './filter-builder';

// ==================== Types & Interfaces ====================

/**
 * Filter preset category
 */
export enum PresetCategory {
  Security = 'security',
  Performance = 'performance',
  Quality = 'quality',
  Bugs = 'bugs',
  Complexity = 'complexity',
  Maintenance = 'maintenance',
  Custom = 'custom',
  Team = 'team',
  Smart = 'smart',
}

/**
 * Filter preset visibility
 */
export enum PresetVisibility {
  Private = 'private',     // Only creator can see
  Team = 'team',          // Team members can see
  Organization = 'organization', // All org members
  Public = 'public',      // Everyone
}

/**
 * Filter preset
 */
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  category: PresetCategory;
  visibility: PresetVisibility;
  filter: Filter;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  tags: string[];
  
  // Usage stats
  usageCount: number;
  lastUsedAt?: Date;
  rating?: number; // 0-5
  
  // Team/org
  teamId?: string;
  organizationId?: string;
  
  // AI
  isAiGenerated?: boolean;
  confidence?: number; // 0-1 (for AI-suggested presets)
}

/**
 * Preset collection
 */
export interface PresetCollection {
  id: string;
  name: string;
  description: string;
  presets: FilterPreset[];
  createdBy: string;
  createdAt: Date;
  visibility: PresetVisibility;
}

/**
 * Preset recommendation
 */
export interface PresetRecommendation {
  preset: FilterPreset;
  score: number; // 0-1 (relevance score)
  reason: string;
  matchedTags: string[];
}

/**
 * Preset manager configuration
 */
export interface PresetManagerConfig {
  // Storage
  storageBackend: 'memory' | 'database' | 'file';
  storagePath?: string;
  
  // Recommendations
  enableRecommendations: boolean;
  maxRecommendations: number; // Default: 5
  
  // Versioning
  enableVersioning: boolean;
  maxVersions: number; // Default: 10
  
  // Marketplace
  enableMarketplace: boolean;
  marketplaceUrl?: string;
}

// ==================== Built-in Presets ====================

/**
 * Built-in security filters
 */
const SECURITY_PRESETS: Partial<FilterPreset>[] = [
  {
    name: 'Critical Security Issues',
    description: 'High and critical severity security vulnerabilities',
    category: PresetCategory.Security,
    tags: ['security', 'critical', 'vulnerability'],
  },
  {
    name: 'Injection Vulnerabilities',
    description: 'SQL injection, XSS, command injection',
    category: PresetCategory.Security,
    tags: ['security', 'injection', 'sql', 'xss'],
  },
  {
    name: 'Authentication Issues',
    description: 'Weak passwords, missing auth, session issues',
    category: PresetCategory.Security,
    tags: ['security', 'authentication', 'session'],
  },
  {
    name: 'Sensitive Data Exposure',
    description: 'Hardcoded secrets, PII leaks, insecure storage',
    category: PresetCategory.Security,
    tags: ['security', 'secrets', 'pii', 'encryption'],
  },
];

/**
 * Built-in performance filters
 */
const PERFORMANCE_PRESETS: Partial<FilterPreset>[] = [
  {
    name: 'Slow Database Queries',
    description: 'N+1 queries, missing indexes, slow queries',
    category: PresetCategory.Performance,
    tags: ['performance', 'database', 'query', 'n+1'],
  },
  {
    name: 'Memory Leaks',
    description: 'Unclosed resources, circular references',
    category: PresetCategory.Performance,
    tags: ['performance', 'memory', 'leak', 'resource'],
  },
  {
    name: 'CPU Intensive Operations',
    description: 'Inefficient loops, heavy computations',
    category: PresetCategory.Performance,
    tags: ['performance', 'cpu', 'loop', 'algorithm'],
  },
];

/**
 * Built-in code quality filters
 */
const QUALITY_PRESETS: Partial<FilterPreset>[] = [
  {
    name: 'Code Smells',
    description: 'Long methods, duplicate code, complex conditions',
    category: PresetCategory.Quality,
    tags: ['quality', 'smell', 'duplicate', 'complexity'],
  },
  {
    name: 'Unused Code',
    description: 'Unused imports, variables, functions',
    category: PresetCategory.Quality,
    tags: ['quality', 'unused', 'dead-code'],
  },
  {
    name: 'Missing Tests',
    description: 'Untested code, low coverage',
    category: PresetCategory.Quality,
    tags: ['quality', 'tests', 'coverage'],
  },
];

// ==================== Preset Manager ====================

const DEFAULT_CONFIG: PresetManagerConfig = {
  storageBackend: 'memory',
  enableRecommendations: true,
  maxRecommendations: 5,
  enableVersioning: true,
  maxVersions: 10,
  enableMarketplace: false,
};

/**
 * Preset Manager
 * Manage filter presets, collections, and recommendations
 */
export class PresetManager extends EventEmitter {
  private config: PresetManagerConfig;
  private presets: Map<string, FilterPreset>;
  private collections: Map<string, PresetCollection>;
  private versions: Map<string, FilterPreset[]>; // preset_id -> versions

  constructor(config: Partial<PresetManagerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.presets = new Map();
    this.collections = new Map();
    this.versions = new Map();

    this.initializeBuiltInPresets();
  }

  /**
   * Create new preset
   */
  async createPreset(preset: Omit<FilterPreset, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'usageCount'>): Promise<FilterPreset> {
    const id = this.generateId();
    const now = new Date();

    const newPreset: FilterPreset = {
      ...preset,
      id,
      createdAt: now,
      updatedAt: now,
      version: 1,
      usageCount: 0,
    };

    this.presets.set(id, newPreset);

    if (this.config.enableVersioning) {
      this.versions.set(id, [newPreset]);
    }

    this.emit('preset-created', { preset: newPreset });
    return newPreset;
  }

  /**
   * Update existing preset
   */
  async updatePreset(id: string, updates: Partial<FilterPreset>): Promise<FilterPreset> {
    const existing = this.presets.get(id);
    if (!existing) {
      throw new Error(`Preset not found: ${id}`);
    }

    const updated: FilterPreset = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      updatedAt: new Date(),
      version: existing.version + 1,
    };

    this.presets.set(id, updated);

    // Save version history
    if (this.config.enableVersioning) {
      const versions = this.versions.get(id) || [];
      versions.push(updated);

      // Prune old versions
      if (versions.length > this.config.maxVersions) {
        versions.splice(0, versions.length - this.config.maxVersions);
      }

      this.versions.set(id, versions);
    }

    this.emit('preset-updated', { preset: updated });
    return updated;
  }

  /**
   * Delete preset
   */
  async deletePreset(id: string): Promise<void> {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    this.presets.delete(id);
    this.versions.delete(id);

    this.emit('preset-deleted', { id, preset });
  }

  /**
   * Get preset by ID
   */
  async getPreset(id: string): Promise<FilterPreset | null> {
    return this.presets.get(id) || null;
  }

  /**
   * List presets with filters
   */
  async listPresets(options: {
    category?: PresetCategory;
    visibility?: PresetVisibility;
    createdBy?: string;
    teamId?: string;
    tags?: string[];
    search?: string;
  } = {}): Promise<FilterPreset[]> {
    let results = Array.from(this.presets.values());

    // Filter by category
    if (options.category) {
      results = results.filter(p => p.category === options.category);
    }

    // Filter by visibility
    if (options.visibility) {
      results = results.filter(p => p.visibility === options.visibility);
    }

    // Filter by creator
    if (options.createdBy) {
      results = results.filter(p => p.createdBy === options.createdBy);
    }

    // Filter by team
    if (options.teamId) {
      results = results.filter(p => p.teamId === options.teamId);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(p => 
        options.tags!.some(tag => p.tags.includes(tag))
      );
    }

    // Search by name/description
    if (options.search) {
      const query = options.search.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Sort by usage count (most popular first)
    results.sort((a, b) => b.usageCount - a.usageCount);

    return results;
  }

  /**
   * Use preset (track usage)
   */
  async usePreset(id: string): Promise<FilterPreset> {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    preset.usageCount++;
    preset.lastUsedAt = new Date();

    this.emit('preset-used', { preset });
    return preset;
  }

  /**
   * Rate preset
   */
  async ratePreset(id: string, rating: number): Promise<FilterPreset> {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    // Simple average (in production, use weighted average)
    const currentRating = preset.rating || 0;
    preset.rating = (currentRating + rating) / 2;

    this.emit('preset-rated', { preset, rating });
    return preset;
  }

  /**
   * Get preset versions
   */
  async getPresetVersions(id: string): Promise<FilterPreset[]> {
    return this.versions.get(id) || [];
  }

  /**
   * Revert to previous version
   */
  async revertPreset(id: string, version: number): Promise<FilterPreset> {
    const versions = this.versions.get(id);
    if (!versions) {
      throw new Error(`Preset not found: ${id}`);
    }

    const targetVersion = versions.find(v => v.version === version);
    if (!targetVersion) {
      throw new Error(`Version ${version} not found`);
    }

    const reverted = { ...targetVersion, version: targetVersion.version + 1 };
    this.presets.set(id, reverted);

    this.emit('preset-reverted', { preset: reverted, toVersion: version });
    return reverted;
  }

  /**
   * Get preset recommendations
   */
  async getRecommendations(context: {
    userId?: string;
    teamId?: string;
    recentIssues?: string[]; // Issue types
    projectTags?: string[];
  }): Promise<PresetRecommendation[]> {
    if (!this.config.enableRecommendations) {
      return [];
    }

    const allPresets = Array.from(this.presets.values());
    const recommendations: PresetRecommendation[] = [];

    for (const preset of allPresets) {
      let score = 0;
      const matchedTags: string[] = [];
      const reasons: string[] = [];

      // Match by tags
      if (context.projectTags) {
        const tagMatches = preset.tags.filter(tag => context.projectTags!.includes(tag));
        if (tagMatches.length > 0) {
          score += tagMatches.length * 0.2;
          matchedTags.push(...tagMatches);
          reasons.push(`Matches ${tagMatches.length} project tags`);
        }
      }

      // Popularity boost
      if (preset.usageCount > 10) {
        score += 0.1;
        reasons.push('Popular preset');
      }

      // High rating boost
      if (preset.rating && preset.rating > 4) {
        score += 0.15;
        reasons.push('Highly rated');
      }

      // Team preset boost
      if (context.teamId && preset.teamId === context.teamId) {
        score += 0.3;
        reasons.push('Created by your team');
      }

      if (score > 0) {
        recommendations.push({
          preset,
          score: Math.min(1, score),
          reason: reasons.join(', '),
          matchedTags,
        });
      }
    }

    // Sort by score and limit
    recommendations.sort((a, b) => b.score - a.score);
    const limited = recommendations.slice(0, this.config.maxRecommendations);

    this.emit('recommendations-generated', { count: limited.length });
    return limited;
  }

  /**
   * Create preset collection
   */
  async createCollection(collection: Omit<PresetCollection, 'id' | 'createdAt'>): Promise<PresetCollection> {
    const id = this.generateId();

    const newCollection: PresetCollection = {
      ...collection,
      id,
      createdAt: new Date(),
    };

    this.collections.set(id, newCollection);
    this.emit('collection-created', { collection: newCollection });

    return newCollection;
  }

  /**
   * Get collection
   */
  async getCollection(id: string): Promise<PresetCollection | null> {
    return this.collections.get(id) || null;
  }

  /**
   * List collections
   */
  async listCollections(): Promise<PresetCollection[]> {
    return Array.from(this.collections.values());
  }

  /**
   * Export preset to JSON
   */
  async exportPreset(id: string): Promise<string> {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    return JSON.stringify(preset, null, 2);
  }

  /**
   * Import preset from JSON
   */
  async importPreset(json: string, createdBy: string): Promise<FilterPreset> {
    const parsed = JSON.parse(json) as FilterPreset;

    // Generate new ID and timestamps
    const imported: FilterPreset = {
      ...parsed,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      version: 1,
      usageCount: 0,
    };

    this.presets.set(imported.id, imported);
    this.emit('preset-imported', { preset: imported });

    return imported;
  }

  /**
   * Duplicate preset
   */
  async duplicatePreset(id: string, createdBy: string, name?: string): Promise<FilterPreset> {
    const original = this.presets.get(id);
    if (!original) {
      throw new Error(`Preset not found: ${id}`);
    }

    const duplicate: FilterPreset = {
      ...original,
      id: this.generateId(),
      name: name || `${original.name} (Copy)`,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      usageCount: 0,
    };

    this.presets.set(duplicate.id, duplicate);
    this.emit('preset-duplicated', { original, duplicate });

    return duplicate;
  }

  /**
   * Share preset with team
   */
  async shareWithTeam(id: string, teamId: string): Promise<FilterPreset> {
    return this.updatePreset(id, {
      visibility: PresetVisibility.Team,
      teamId,
    });
  }

  /**
   * Publish to marketplace
   */
  async publishToMarketplace(id: string): Promise<FilterPreset> {
    if (!this.config.enableMarketplace) {
      throw new Error('Marketplace is not enabled');
    }

    return this.updatePreset(id, {
      visibility: PresetVisibility.Public,
    });
  }

  /**
   * Search marketplace
   */
  async searchMarketplace(query: string): Promise<FilterPreset[]> {
    if (!this.config.enableMarketplace) {
      return [];
    }

    return this.listPresets({
      visibility: PresetVisibility.Public,
      search: query,
    });
  }

  // ==================== Private Methods ====================

  private initializeBuiltInPresets(): void {
    const allBuiltIn = [
      ...SECURITY_PRESETS,
      ...PERFORMANCE_PRESETS,
      ...QUALITY_PRESETS,
    ];

    for (const partial of allBuiltIn) {
      const preset: FilterPreset = {
        id: this.generateId(),
        name: partial.name!,
        description: partial.description!,
        category: partial.category!,
        visibility: PresetVisibility.Public,
        filter: this.createBuiltInFilter(partial),
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        tags: partial.tags!,
        usageCount: 0,
      };

      this.presets.set(preset.id, preset);
    }
  }

  private createBuiltInFilter(partial: Partial<FilterPreset>): Filter {
    // Create simple filter based on tags
    const builder = new FilterBuilder();
    builder.createFilter(LogicOperator.And);

    // Add conditions based on category
    if (partial.category === PresetCategory.Security) {
      builder.equals('category', 'security');
      builder.in('severity', ['high', 'critical']);
    } else if (partial.category === PresetCategory.Performance) {
      builder.equals('category', 'performance');
    } else if (partial.category === PresetCategory.Quality) {
      builder.equals('category', 'quality');
    }

    // Add tag filters
    if (partial.tags && partial.tags.length > 0) {
      builder.orGroup(fb => {
        for (const tag of partial.tags!) {
          fb.contains('tags', tag);
        }
      });
    }

    return builder.build();
  }

  private generateId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==================== Factory & Utilities ====================

/**
 * Create preset manager instance
 */
export function createPresetManager(config?: Partial<PresetManagerConfig>): PresetManager {
  return new PresetManager(config);
}

/**
 * Create quick preset from filter builder
 */
export async function createQuickPreset(
  manager: PresetManager,
  name: string,
  builder: FilterBuilder,
  createdBy: string
): Promise<FilterPreset> {
  return manager.createPreset({
    name,
    description: `Quick filter: ${name}`,
    category: PresetCategory.Custom,
    visibility: PresetVisibility.Private,
    filter: builder.build(),
    createdBy,
    tags: ['custom', 'quick'],
  });
}

/**
 * Merge multiple presets into one
 */
export async function mergePresets(
  manager: PresetManager,
  presetIds: string[],
  name: string,
  createdBy: string
): Promise<FilterPreset> {
  const presets = await Promise.all(presetIds.map(id => manager.getPreset(id)));
  const filters = presets.filter(p => p !== null).map(p => p!.filter);

  const mergedFilter: Filter = {
    root: {
      operator: LogicOperator.And,
      conditions: filters.map(f => f.root),
    },
  };

  return manager.createPreset({
    name,
    description: `Merged from ${presetIds.length} presets`,
    category: PresetCategory.Custom,
    visibility: PresetVisibility.Private,
    filter: mergedFilter,
    createdBy,
    tags: ['merged'],
  });
}

/**
 * Generate AI-suggested preset (mock)
 */
export async function generateAiPreset(
  manager: PresetManager,
  context: {
    recentIssues: string[];
    projectType: string;
  }
): Promise<FilterPreset> {
  // Mock AI generation
  const builder = new FilterBuilder();
  builder.createFilter(LogicOperator.And);
  builder.in('type', context.recentIssues.slice(0, 5));

  return manager.createPreset({
    name: `AI Suggested: ${context.projectType}`,
    description: 'AI-generated filter based on your recent issues',
    category: PresetCategory.Smart,
    visibility: PresetVisibility.Private,
    filter: builder.build(),
    createdBy: 'ai',
    tags: ['ai', 'smart', context.projectType],
    isAiGenerated: true,
    confidence: 0.85,
  });
}

/**
 * Get popular presets
 */
export async function getPopularPresets(
  manager: PresetManager,
  limit = 10
): Promise<FilterPreset[]> {
  const all = await manager.listPresets({
    visibility: PresetVisibility.Public,
  });

  return all
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

/**
 * Get trending presets (recently popular)
 */
export async function getTrendingPresets(
  manager: PresetManager,
  limit = 10
): Promise<FilterPreset[]> {
  const all = await manager.listPresets({
    visibility: PresetVisibility.Public,
  });

  // Filter last 7 days
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  return all
    .filter(p => p.lastUsedAt && p.lastUsedAt >= weekAgo)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}
