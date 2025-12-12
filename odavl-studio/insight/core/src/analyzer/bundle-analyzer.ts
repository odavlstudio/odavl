/**
 * Bundle Analyzer - ODAVL Insight Phase 4
 * Analyzes bundle size, module imports, tree-shaking effectiveness
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { safeReadFile } from '../utils/safe-file-reader.js';

export interface BundleAnalysis {
    totalSize: number;
    compressedSize?: number;
    modules: ModuleInfo[];
    largeModules: ModuleInfo[];
    treeShakingScore: number;
    recommendations: string[];
}

export interface ModuleInfo {
    name: string;
    size: number;
    path: string;
    imported: boolean;
    treeShakenCorrectly: boolean;
}

export interface BundlerConfig {
    type: 'webpack' | 'vite' | 'rollup' | 'unknown';
    configPath?: string;
    outputPath?: string;
    hasTreeShaking: boolean;
    hasCodeSplitting: boolean;
}

export class BundleAnalyzer {
    constructor(private workspaceRoot: string) { }

    /**
     * Analyze bundle configuration and output
     */
    async analyzeBundleSize(): Promise<BundleAnalysis> {
        const config = this.detectBundlerConfig();
        const modules = await this.detectLargeModules();
        const treeShakingScore = this.calculateTreeShakingScore(config);

        const totalSize = modules.reduce((sum, m) => sum + m.size, 0);
        const largeModules = modules.filter(m => m.size > 100 * 1024); // >100KB

        const recommendations: string[] = [];

        if (!config.hasTreeShaking) {
            recommendations.push('Enable tree-shaking in bundler config');
        }

        if (!config.hasCodeSplitting) {
            recommendations.push('Enable code-splitting for better performance');
        }

        if (largeModules.length > 0) {
            recommendations.push(`Optimize ${largeModules.length} large modules (>100KB each)`);
        }

        return {
            totalSize,
            modules,
            largeModules,
            treeShakingScore,
            recommendations,
        };
    }

    /**
     * Detect bundler configuration
     */
    detectBundlerConfig(): BundlerConfig {
        const webpackPath = path.join(this.workspaceRoot, 'webpack.config.js');
        const vitePath = path.join(this.workspaceRoot, 'vite.config.ts');
        const rollupPath = path.join(this.workspaceRoot, 'rollup.config.js');

        if (fs.existsSync(webpackPath)) {
            const content = safeReadFile(webpackPath);
            if (!content) return { type: 'unknown', configPath: '', hasTreeShaking: false, hasCodeSplitting: false };
            return {
                type: 'webpack',
                configPath: webpackPath,
                hasTreeShaking: /mode:\s*['"']production['"']/.test(content),
                hasCodeSplitting: /splitChunks/.test(content),
            };
        }

        if (fs.existsSync(vitePath)) {
            const content = safeReadFile(vitePath);
            if (!content) return { type: 'unknown', configPath: '', hasTreeShaking: false, hasCodeSplitting: false };
            return {
                type: 'vite',
                configPath: vitePath,
                hasTreeShaking: true, // Vite has tree-shaking by default
                hasCodeSplitting: /rollupOptions/.test(content),
            };
        }

        if (fs.existsSync(rollupPath)) {
            const content = safeReadFile(rollupPath);
            if (!content) return { type: 'unknown', configPath: '', hasTreeShaking: false, hasCodeSplitting: false };
            return {
                type: 'rollup',
                configPath: rollupPath,
                hasTreeShaking: /treeshake/.test(content),
                hasCodeSplitting: /output:.*\[/.test(content),
            };
        }

        return {
            type: 'unknown',
            hasTreeShaking: false,
            hasCodeSplitting: false,
        };
    }

    /**
     * Detect large modules from node_modules
     */
    async detectLargeModules(): Promise<ModuleInfo[]> {
        const modules: ModuleInfo[] = [];
        const nodeModulesPath = path.join(this.workspaceRoot, 'node_modules');

        if (!fs.existsSync(nodeModulesPath)) {
            return modules;
        }

        // Check package.json dependencies
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return modules;
        }

        const content = safeReadFile(packageJsonPath);
        if (!content) return modules;
        const packageJson = JSON.parse(content);
        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };

        for (const [name, _version] of Object.entries(dependencies)) {
            const modulePath = path.join(nodeModulesPath, name);
            if (fs.existsSync(modulePath)) {
                const size = this.getDirectorySize(modulePath);
                modules.push({
                    name,
                    size,
                    path: modulePath,
                    imported: true,
                    treeShakenCorrectly: false,
                });
            }
        }

        return modules.sort((a, b) => b.size - a.size);
    }

    /**
     * Check import patterns for tree-shaking optimization
     */
    checkImportPatterns(filePath: string): string[] {
        const issues: string[] = [];
        const content = safeReadFile(filePath);
        if (!content) return issues;

        // Full lodash import
        if (/import\s+_\s+from\s+['"]lodash['"]/.test(content)) {
            issues.push('Full lodash import detected - use lodash/[method]');
        }

        // Wildcard imports from large libraries
        if (/import\s+\*\s+as\s+\w+\s+from\s+['"](?:lodash|moment|rxjs)['"]/.test(content)) {
            issues.push('Wildcard import prevents tree-shaking');
        }

        // Material-UI full import
        if (/import\s+.*\s+from\s+['"]@material-ui\/core['"]/.test(content)) {
            issues.push('Material-UI barrel import - use specific component paths');
        }

        return issues;
    }

    /**
     * Calculate tree-shaking effectiveness score (0-100)
     */
    calculateTreeShakingScore(config: BundlerConfig): number {
        let score = 0;

        if (config.hasTreeShaking) score += 50;
        if (config.hasCodeSplitting) score += 25;
        if (config.type !== 'unknown') score += 15;

        // Bonus for modern bundlers
        if (config.type === 'vite') score += 10;

        return Math.min(100, score);
    }

    /**
     * Get total size of directory recursively
     */
    private getDirectorySize(dirPath: string): number {
        let totalSize = 0;

        const traverse = (currentPath: string) => {
            try {
                const stats = fs.statSync(currentPath);

                if (stats.isFile()) {
                    totalSize += stats.size;
                } else if (stats.isDirectory()) {
                    const files = fs.readdirSync(currentPath);
                    for (const file of files) {
                        traverse(path.join(currentPath, file));
                    }
                }
            } catch (_error) {
                // Skip inaccessible files
            }
        };

        traverse(dirPath);
        return totalSize;
    }
}
