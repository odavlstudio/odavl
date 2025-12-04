"use strict";
/**
 * Bundle Analyzer - ODAVL Insight Phase 4
 * Analyzes bundle size, module imports, tree-shaking effectiveness
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleAnalyzer = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
class BundleAnalyzer {
    workspaceRoot;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    /**
     * Analyze bundle configuration and output
     */
    async analyzeBundleSize() {
        const config = this.detectBundlerConfig();
        const modules = await this.detectLargeModules();
        const treeShakingScore = this.calculateTreeShakingScore(config);
        const totalSize = modules.reduce((sum, m) => sum + m.size, 0);
        const largeModules = modules.filter(m => m.size > 100 * 1024); // >100KB
        const recommendations = [];
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
    detectBundlerConfig() {
        const webpackPath = path.join(this.workspaceRoot, 'webpack.config.js');
        const vitePath = path.join(this.workspaceRoot, 'vite.config.ts');
        const rollupPath = path.join(this.workspaceRoot, 'rollup.config.js');
        if (fs.existsSync(webpackPath)) {
            const content = fs.readFileSync(webpackPath, 'utf-8');
            return {
                type: 'webpack',
                configPath: webpackPath,
                hasTreeShaking: /mode:\s*['"]production['"]/.test(content),
                hasCodeSplitting: /splitChunks/.test(content),
            };
        }
        if (fs.existsSync(vitePath)) {
            const content = fs.readFileSync(vitePath, 'utf-8');
            return {
                type: 'vite',
                configPath: vitePath,
                hasTreeShaking: true, // Vite has tree-shaking by default
                hasCodeSplitting: /rollupOptions/.test(content),
            };
        }
        if (fs.existsSync(rollupPath)) {
            const content = fs.readFileSync(rollupPath, 'utf-8');
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
    async detectLargeModules() {
        const modules = [];
        const nodeModulesPath = path.join(this.workspaceRoot, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            return modules;
        }
        // Check package.json dependencies
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            return modules;
        }
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
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
    checkImportPatterns(filePath) {
        const issues = [];
        const content = fs.readFileSync(filePath, 'utf-8');
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
    calculateTreeShakingScore(config) {
        let score = 0;
        if (config.hasTreeShaking)
            score += 50;
        if (config.hasCodeSplitting)
            score += 25;
        if (config.type !== 'unknown')
            score += 15;
        // Bonus for modern bundlers
        if (config.type === 'vite')
            score += 10;
        return Math.min(100, score);
    }
    /**
     * Get total size of directory recursively
     */
    getDirectorySize(dirPath) {
        let totalSize = 0;
        const traverse = (currentPath) => {
            try {
                const stats = fs.statSync(currentPath);
                if (stats.isFile()) {
                    totalSize += stats.size;
                }
                else if (stats.isDirectory()) {
                    const files = fs.readdirSync(currentPath);
                    for (const file of files) {
                        traverse(path.join(currentPath, file));
                    }
                }
            }
            catch (_error) {
                // Skip inaccessible files
            }
        };
        traverse(dirPath);
        return totalSize;
    }
}
exports.BundleAnalyzer = BundleAnalyzer;
//# sourceMappingURL=bundle-analyzer.js.map