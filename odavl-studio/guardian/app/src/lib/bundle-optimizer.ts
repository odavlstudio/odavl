/**
 * Bundle Optimizer - Week 14
 * Implements code splitting, lazy loading, and tree shaking
 * Target: Reduce bundle size by 40% (<500KB initial)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface BundleAnalysis {
    totalSize: number;
    totalSizeKB: number;
    totalSizeMB: number;
    chunks: ChunkInfo[];
    largestChunks: ChunkInfo[];
    recommendations: string[];
    savings: SavingsEstimate;
    score: number; // 0-100
}

export interface ChunkInfo {
    name: string;
    path: string;
    size: number;
    sizeKB: number;
    compressed?: number;
    compressedKB?: number;
    type: 'main' | 'vendor' | 'page' | 'component' | 'dynamic' | 'static';
    canLazyLoad: boolean;
    canTreeShake: boolean;
    imports: string[];
}

export interface SavingsEstimate {
    codeSplitting: number; // Bytes
    lazyLoading: number;
    treeShaking: number;
    compression: number;
    total: number;
    percentage: number;
}

export interface OptimizationPlan {
    lazyLoadCandidates: string[];
    codeSplitPoints: string[];
    treeShakeTargets: string[];
    compressionOpportunities: string[];
    priority: 'high' | 'medium' | 'low';
    estimatedSavings: number;
    implementation: string;
}

/**
 * Analyze bundle structure and identify optimization opportunities
 */
export class BundleOptimizer {
    constructor(private projectRoot: string) { }

    /**
     * Analyze current bundle and generate optimization recommendations
     */
    async analyzeBundleStructure(): Promise<BundleAnalysis> {
        const buildDirs = ['dist', '.next', 'out', 'build', '.output'];
        const chunks: ChunkInfo[] = [];
        let totalSize = 0;

        for (const dir of buildDirs) {
            const buildPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(buildPath)) continue;

            const files = this.getAllFiles(buildPath);

            for (const file of files) {
                if (this.shouldSkipFile(file)) continue;

                const filePath = path.join(buildPath, file);
                const stats = fs.statSync(filePath);
                const size = stats.size;
                totalSize += size;

                chunks.push({
                    name: path.basename(file),
                    path: path.relative(this.projectRoot, filePath),
                    size,
                    sizeKB: size / 1024,
                    type: this.classifyChunk(file),
                    canLazyLoad: this.canBeLazyLoaded(file),
                    canTreeShake: this.canBeTreeShaken(file),
                    imports: this.extractImports(filePath),
                });
            }
        }

        const largestChunks = chunks
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);

        const recommendations = this.generateRecommendations(chunks);
        const savings = this.estimateSavings(chunks);
        const score = this.calculateOptimizationScore(chunks, savings);

        return {
            totalSize,
            totalSizeKB: totalSize / 1024,
            totalSizeMB: totalSize / 1024 / 1024,
            chunks,
            largestChunks,
            recommendations,
            savings,
            score,
        };
    }

    /**
     * Generate optimization plan with actionable steps
     */
    async generateOptimizationPlan(): Promise<OptimizationPlan[]> {
        const analysis = await this.analyzeBundleStructure();
        const plans: OptimizationPlan[] = [];

        // 1. Lazy Loading Plan
        const lazyLoadCandidates = analysis.chunks
            .filter((c: typeof analysis.chunks[0]) => c.canLazyLoad && c.sizeKB > 50)
            .map((c: typeof analysis.chunks[0]) => c.path)
            .slice(0, 5);

        if (lazyLoadCandidates.length > 0) {
            plans.push({
                lazyLoadCandidates,
                codeSplitPoints: [],
                treeShakeTargets: [],
                compressionOpportunities: [],
                priority: 'high',
                estimatedSavings: analysis.savings.lazyLoading,
                implementation: this.generateLazyLoadImplementation(lazyLoadCandidates),
            });
        }

        // 2. Code Splitting Plan
        const codeSplitPoints = this.identifyCodeSplitPoints(analysis.chunks);

        if (codeSplitPoints.length > 0) {
            plans.push({
                lazyLoadCandidates: [],
                codeSplitPoints,
                treeShakeTargets: [],
                compressionOpportunities: [],
                priority: 'high',
                estimatedSavings: analysis.savings.codeSplitting,
                implementation: this.generateCodeSplitImplementation(codeSplitPoints),
            });
        }

        // 3. Tree Shaking Plan
        const treeShakeTargets = analysis.chunks
            .filter((c: typeof analysis.chunks[0]) => c.canTreeShake && c.type === 'vendor')
            .map((c: typeof analysis.chunks[0]) => c.path)
            .slice(0, 3);

        if (treeShakeTargets.length > 0) {
            plans.push({
                lazyLoadCandidates: [],
                codeSplitPoints: [],
                treeShakeTargets,
                compressionOpportunities: [],
                priority: 'medium',
                estimatedSavings: analysis.savings.treeShaking,
                implementation: this.generateTreeShakeImplementation(treeShakeTargets),
            });
        }

        // 4. Compression Plan
        const compressionOpportunities = analysis.chunks
            .filter((c: typeof analysis.chunks[0]) => c.sizeKB > 100 && !c.compressed)
            .map((c: typeof analysis.chunks[0]) => c.path);

        if (compressionOpportunities.length > 0) {
            plans.push({
                lazyLoadCandidates: [],
                codeSplitPoints: [],
                treeShakeTargets: [],
                compressionOpportunities,
                priority: 'low',
                estimatedSavings: analysis.savings.compression,
                implementation: this.generateCompressionImplementation(),
            });
        }

        return plans;
    }

    /**
     * Classify chunk type based on filename patterns
     */
    private classifyChunk(filename: string): ChunkInfo['type'] {
        if (filename.includes('main') || filename.includes('index')) return 'main';
        if (filename.includes('vendor') || filename.includes('node_modules')) return 'vendor';
        if (filename.includes('page') || filename.includes('route')) return 'page';
        if (filename.includes('component')) return 'component';
        if (filename.includes('chunk') || filename.includes('lazy')) return 'dynamic';
        return 'static';
    }

    /**
     * Check if chunk can be lazy loaded
     */
    private canBeLazyLoaded(filename: string): boolean {
        // Don't lazy load critical files
        if (filename.includes('main') || filename.includes('index')) return false;
        if (filename.includes('runtime') || filename.includes('polyfill')) return false;

        // Can lazy load components, pages, modals, etc.
        return (
            filename.includes('component') ||
            filename.includes('page') ||
            filename.includes('modal') ||
            filename.includes('dialog') ||
            filename.includes('panel') ||
            filename.includes('chart') ||
            filename.includes('dashboard')
        );
    }

    /**
     * Check if chunk can be tree shaken
     */
    private canBeTreeShaken(filename: string): boolean {
        // Vendor chunks often have tree shaking opportunities
        return filename.includes('vendor') || filename.includes('node_modules');
    }

    /**
     * Extract imports from a file (simplified)
     */
    private extractImports(filePath: string): string[] {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
            const imports: string[] = [];
            let match;

            while ((match = importRegex.exec(content)) !== null) {
                imports.push(match[1]);
            }

            return imports;
        } catch {
            return [];
        }
    }

    /**
     * Generate optimization recommendations
     */
    private generateRecommendations(chunks: ChunkInfo[]): string[] {
        const recommendations: string[] = [];

        const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
        const totalSizeMB = totalSize / 1024 / 1024;

        if (totalSizeMB > 2) {
            recommendations.push('Total bundle size exceeds 2MB - implement code splitting');
        }

        const largeChunks = chunks.filter(c => c.sizeKB > 500);
        if (largeChunks.length > 0) {
            recommendations.push(`Found ${largeChunks.length} chunks >500KB - split into smaller chunks`);
        }

        const lazyLoadCandidates = chunks.filter(c => c.canLazyLoad).length;
        if (lazyLoadCandidates > 5) {
            recommendations.push(`${lazyLoadCandidates} components can be lazy loaded - reduce initial bundle`);
        }

        const vendorChunks = chunks.filter(c => c.type === 'vendor');
        const vendorSize = vendorChunks.reduce((sum, c) => sum + c.size, 0) / 1024 / 1024;
        if (vendorSize > 1) {
            recommendations.push(`Vendor chunks total ${vendorSize.toFixed(2)}MB - optimize imports and tree shake`);
        }

        const uncompressed = chunks.filter(c => !c.compressed && c.sizeKB > 50).length;
        if (uncompressed > 0) {
            recommendations.push(`${uncompressed} uncompressed files - enable gzip/brotli compression`);
        }

        if (recommendations.length === 0) {
            recommendations.push('Bundle is well-optimized - continue monitoring');
        }

        return recommendations;
    }

    /**
     * Estimate potential savings from optimizations
     */
    private estimateSavings(chunks: ChunkInfo[]): SavingsEstimate {
        const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);

        // Lazy loading: ~30% of non-critical chunks
        const lazyLoadable = chunks.filter(c => c.canLazyLoad);
        const lazyLoadingSavings = lazyLoadable.reduce((sum, c) => sum + c.size * 0.3, 0);

        // Code splitting: ~20% of large chunks
        const largeChunks = chunks.filter(c => c.sizeKB > 500);
        const codeSplittingSavings = largeChunks.reduce((sum, c) => sum + c.size * 0.2, 0);

        // Tree shaking: ~15% of vendor chunks
        const vendorChunks = chunks.filter(c => c.type === 'vendor' && c.canTreeShake);
        const treeShakingSavings = vendorChunks.reduce((sum, c) => sum + c.size * 0.15, 0);

        // Compression: ~60% of uncompressed files
        const uncompressed = chunks.filter(c => !c.compressed);
        const compressionSavings = uncompressed.reduce((sum, c) => sum + c.size * 0.6, 0);

        const total = lazyLoadingSavings + codeSplittingSavings + treeShakingSavings + compressionSavings;
        const percentage = (total / totalSize) * 100;

        return {
            codeSplitting: codeSplittingSavings,
            lazyLoading: lazyLoadingSavings,
            treeShaking: treeShakingSavings,
            compression: compressionSavings,
            total,
            percentage,
        };
    }

    /**
     * Calculate optimization score (0-100)
     */
    private calculateOptimizationScore(chunks: ChunkInfo[], savings: SavingsEstimate): number {
        let score = 100;

        const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
        const totalSizeMB = totalSize / 1024 / 1024;

        // Penalty for large total size
        if (totalSizeMB > 5) score -= 30;
        else if (totalSizeMB > 2) score -= 15;
        else if (totalSizeMB > 1) score -= 5;

        // Penalty for large chunks
        const largeChunks = chunks.filter(c => c.sizeKB > 500).length;
        score -= largeChunks * 5;

        // Penalty for missed lazy loading opportunities
        const lazyLoadCandidates = chunks.filter(c => c.canLazyLoad).length;
        score -= Math.min(lazyLoadCandidates * 2, 20);

        // Penalty for potential savings
        if (savings.percentage > 40) score -= 20;
        else if (savings.percentage > 30) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Identify code split points
     */
    private identifyCodeSplitPoints(chunks: ChunkInfo[]): string[] {
        const splitPoints: string[] = [];

        // Large chunks are good split candidates
        const largeChunks = chunks.filter(c => c.sizeKB > 300 && c.type !== 'vendor');

        for (const chunk of largeChunks) {
            splitPoints.push(chunk.path);
        }

        return splitPoints.slice(0, 5);
    }

    /**
     * Generate lazy load implementation code
     */
    private generateLazyLoadImplementation(candidates: string[]): string {
        return `
// Lazy Loading Implementation (React)

// Before:
// import Dashboard from './components/Dashboard';

// After:
const Dashboard = lazy(() => import('./components/Dashboard'));

// Usage with Suspense:
<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>

// Candidates for lazy loading:
${candidates.map((c: typeof candidates[0]) => `// - ${c}`).join('\n')}

// Next.js dynamic imports:
const Dashboard = dynamic(() => import('./components/Dashboard'), {
  loading: () => <Spinner />,
  ssr: false, // Optional: disable SSR
});
    `.trim();
    }

    /**
     * Generate code split implementation code
     */
    private generateCodeSplitImplementation(splitPoints: string[]): string {
        return `
// Code Splitting Implementation

// Webpack config:
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\\\/]node_modules[\\\\/]/,
        name: 'vendors',
        priority: 10,
      },
      common: {
        minChunks: 2,
        priority: 5,
        reuseExistingChunk: true,
      },
    },
  },
},

// Split points identified:
${splitPoints.map((p: typeof splitPoints[0]) => `// - ${p}`).join('\n')}

// Vite config:
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        utils: ['lodash', 'date-fns'],
      },
    },
  },
},
    `.trim();
    }

    /**
     * Generate tree shake implementation code
     */
    private generateTreeShakeImplementation(targets: string[]): string {
        return `
// Tree Shaking Implementation

// 1. Use named imports instead of default imports:
// Before:
// import _ from 'lodash';
// _.debounce(fn, 100);

// After:
import { debounce } from 'lodash';
debounce(fn, 100);

// 2. Use ES modules packages:
// Before: import moment from 'moment';
// After: import dayjs from 'dayjs'; // Smaller, tree-shakable

// 3. Configure package.json:
{
  "sideEffects": false,
  "type": "module"
}

// 4. Targets for tree shaking:
${targets.map((t: typeof targets[0]) => `// - ${t}`).join('\n')}

// 5. Analyze bundle to verify:
// npx webpack-bundle-analyzer dist/stats.json
    `.trim();
    }

    /**
     * Generate compression implementation code
     */
    private generateCompressionImplementation(): string {
        return `
// Compression Implementation

// 1. Next.js (next.config.js):
module.exports = {
  compress: true, // Enable gzip (default: true)
};

// 2. Express server:
import compression from 'compression';
app.use(compression());

// 3. Nginx config:
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

// 4. Brotli compression (better than gzip):
// Vercel/Netlify: Enabled by default
// Custom server: Use 'compression' package with brotli

// 5. Static asset compression:
// Generate .gz and .br files at build time
// Serve pre-compressed assets
    `.trim();
    }

    /**
     * Get all files recursively
     */
    private getAllFiles(dir: string, files: string[] = []): string[] {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                this.getAllFiles(fullPath, files);
            } else {
                files.push(path.relative(dir, fullPath));
            }
        }

        return files;
    }

    /**
     * Check if file should be skipped
     */
    private shouldSkipFile(filename: string): boolean {
        return (
            filename.endsWith('.map') ||
            filename.endsWith('.txt') ||
            filename.endsWith('.json') ||
            filename.endsWith('.md') ||
            filename.includes('.cache') ||
            filename.includes('node_modules') ||
            filename.includes('.git')
        );
    }
}

/**
 * Run bundle analysis and print report
 */
export async function runBundleAnalysis(projectRoot: string = process.cwd()): Promise<void> {
    const optimizer = new BundleOptimizer(projectRoot);
    const analysis = await optimizer.analyzeBundleStructure();

    console.log('\n📦 Bundle Analysis Report\n');
    console.log(`Total Size: ${analysis.totalSizeMB.toFixed(2)} MB (${analysis.totalSizeKB.toFixed(0)} KB)`);
    console.log(`Chunks: ${analysis.chunks.length}`);
    console.log(`Optimization Score: ${analysis.score}/100\n`);

    console.log('🎯 Largest Chunks:');
    for (const chunk of analysis.largestChunks.slice(0, 5)) {
        console.log(`  - ${chunk.name}: ${chunk.sizeKB.toFixed(2)} KB (${chunk.type})`);
    }

    console.log('\n💡 Recommendations:');
    for (const rec of analysis.recommendations) {
        console.log(`  - ${rec}`);
    }

    console.log('\n💰 Estimated Savings:');
    console.log(`  Lazy Loading: ${(analysis.savings.lazyLoading / 1024).toFixed(2)} KB`);
    console.log(`  Code Splitting: ${(analysis.savings.codeSplitting / 1024).toFixed(2)} KB`);
    console.log(`  Tree Shaking: ${(analysis.savings.treeShaking / 1024).toFixed(2)} KB`);
    console.log(`  Compression: ${(analysis.savings.compression / 1024).toFixed(2)} KB`);
    console.log(`  Total: ${(analysis.savings.total / 1024).toFixed(2)} KB (${analysis.savings.percentage.toFixed(1)}%)\n`);

    // Generate optimization plan
    const plans = await optimizer.generateOptimizationPlan();

    if (plans.length > 0) {
        console.log('📋 Optimization Plan:');
        for (let i = 0; i < plans.length; i++) {
            const plan = plans[i];
            console.log(`\n${i + 1}. Priority: ${plan.priority.toUpperCase()}`);
            console.log(`   Estimated Savings: ${(plan.estimatedSavings / 1024).toFixed(2)} KB`);
            console.log(`   Implementation:\n${plan.implementation}\n`);
        }
    }
}
