/**
 * ODAVL Autopilot - OBSERVE QUICK Phase
 * Fast analysis mode: 3-8 seconds execution time
 * 
 * Optimizations:
 * - No recursive filesystem scan
 * - 3-5 lightweight detectors only
 * - No ML scoring
 * - Shallow analysis (top-level files only)
 * - No complex circular dependency analysis
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { generateRunId } from '../utils/file-naming.js';
import type { Metrics } from './observe.js';

/**
 * Quick workspace analysis - optimized for speed
 * Target: ≤ 8 seconds even on large projects
 * 
 * @param targetDir - Workspace root directory
 * @returns Metrics object with quick analysis results
 */
export async function observeQuick(targetDir: string = process.cwd()): Promise<Metrics> {
    if (typeof targetDir !== 'string' || targetDir.trim() === '') {
        targetDir = process.cwd();
    }

    console.log(`⚡ OBSERVE QUICK Phase: Fast analysis of ${targetDir}...`);
    const startTime = Date.now();

    const timestamp = new Date().toISOString();
    const runId = generateRunId();

    const metrics: Metrics = {
        timestamp,
        runId,
        targetDir,
        typescript: 0,
        eslint: 0,
        security: 0,
        performance: 0,
        imports: 0,
        packages: 0,
        runtime: 0,
        build: 0,
        circular: 0,
        network: 0,
        complexity: 0,
        isolation: 0,
        totalIssues: 0,
        fixableIssues: 0,
        details: {}
    };

    try {
        // =====================================================================
        // 1. Quick File Count (no recursion, top-level only)
        // =====================================================================
        const fileStats = quickFileCount(targetDir);
        console.log(`  → Files found: ${fileStats.totalFiles} (${fileStats.jsFiles} JS/TS)`);

        // =====================================================================
        // 2. Config Detection (tsconfig, package.json, eslint)
        // =====================================================================
        const configCheck = checkConfigs(targetDir);
        console.log(`  → Configs: tsconfig=${configCheck.hasTsConfig}, eslint=${configCheck.hasEslint}`);

        // =====================================================================
        // 3. Basic TypeScript Issues (if tsconfig exists)
        // =====================================================================
        if (configCheck.hasTsConfig) {
            const tsIssues = await quickTypeScriptCheck(targetDir);
            metrics.typescript = tsIssues.count;
            metrics.details!.typescript = tsIssues.issues;
            console.log(`  → TypeScript issues: ${tsIssues.count}`);
        }

        // =====================================================================
        // 4. Import Errors (shallow check, top-level files only)
        // =====================================================================
        const importIssues = quickImportCheck(targetDir, fileStats.jsFiles);
        metrics.imports = importIssues.length;
        metrics.details!.imports = importIssues;
        console.log(`  → Import issues: ${importIssues.length}`);

        // =====================================================================
        // 5. Circular Dependencies (basic check, no deep analysis)
        // =====================================================================
        const circularIssues = quickCircularCheck(targetDir);
        metrics.circular = circularIssues.length;
        metrics.details!.circular = circularIssues;
        console.log(`  → Circular dependencies: ${circularIssues.length}`);

        // =====================================================================
        // 6. Package.json Issues (if exists)
        // =====================================================================
        if (configCheck.hasPackageJson) {
            const pkgIssues = quickPackageCheck(targetDir);
            metrics.packages = pkgIssues.length;
            metrics.details!.packages = pkgIssues;
            console.log(`  → Package issues: ${pkgIssues.length}`);
        }

        // =====================================================================
        // Calculate Total Issues
        // =====================================================================
        metrics.totalIssues = 
            metrics.typescript + 
            metrics.imports + 
            metrics.circular + 
            metrics.packages;

        const duration = Date.now() - startTime;
        console.log(`⚡ Quick analysis complete in ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
        console.log(`  → Total issues found: ${metrics.totalIssues}`);

        return metrics;

    } catch (error) {
        console.error('❌ Quick observe failed:', error);
        throw error;
    }
}

// =============================================================================
// Helper Functions - Optimized for Speed
// =============================================================================

interface FileStats {
    totalFiles: number;
    jsFiles: string[];
}

/**
 * Quick file count - no recursion, top-level only
 */
function quickFileCount(dir: string): FileStats {
    const stats: FileStats = { totalFiles: 0, jsFiles: [] };

    try {
        // Only read top-level directories
        const topLevel = ['src', 'app', 'pages', 'lib', 'components', 'utils'];
        
        for (const subdir of topLevel) {
            const fullPath = join(dir, subdir);
            if (!existsSync(fullPath)) continue;

            const files = readdirSync(fullPath);
            stats.totalFiles += files.length;

            // Collect JS/TS files for import checking
            files.forEach(file => {
                const ext = extname(file);
                if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
                    stats.jsFiles.push(join(fullPath, file));
                }
            });
        }
    } catch (error) {
        // Ignore errors, return what we found
    }

    return stats;
}

interface ConfigCheck {
    hasTsConfig: boolean;
    hasEslint: boolean;
    hasPackageJson: boolean;
    hasNext: boolean;
}

/**
 * Check for config files existence
 */
function checkConfigs(dir: string): ConfigCheck {
    return {
        hasTsConfig: existsSync(join(dir, 'tsconfig.json')),
        hasEslint: existsSync(join(dir, 'eslint.config.mjs')) || existsSync(join(dir, '.eslintrc.json')),
        hasPackageJson: existsSync(join(dir, 'package.json')),
        hasNext: existsSync(join(dir, 'next.config.mjs')) || existsSync(join(dir, 'next.config.js'))
    };
}

interface TypeScriptIssue {
    file: string;
    line: number;
    message: string;
    severity: 'error' | 'warning';
}

interface TypeScriptResult {
    count: number;
    issues: TypeScriptIssue[];
}

/**
 * Quick TypeScript check - parse tsconfig and look for obvious issues
 */
async function quickTypeScriptCheck(dir: string): Promise<TypeScriptResult> {
    const issues: TypeScriptIssue[] = [];

    try {
        const tsconfigPath = join(dir, 'tsconfig.json');
        if (!existsSync(tsconfigPath)) {
            return { count: 0, issues: [] };
        }

        const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

        // Check for missing strict mode
        if (!tsconfig.compilerOptions?.strict) {
            issues.push({
                file: 'tsconfig.json',
                line: 1,
                message: 'TypeScript strict mode is disabled - enable for better type safety',
                severity: 'warning'
            });
        }

        // Check for missing noEmit
        if (tsconfig.compilerOptions?.noEmit === undefined) {
            issues.push({
                file: 'tsconfig.json',
                line: 1,
                message: 'Consider adding "noEmit: true" for type-checking only',
                severity: 'warning'
            });
        }

    } catch (error) {
        // Ignore JSON parse errors
    }

    return { count: issues.length, issues };
}

interface ImportIssue {
    file: string;
    line: number;
    message: string;
    importPath: string;
}

/**
 * Quick import check - look for missing/broken imports
 */
function quickImportCheck(dir: string, files: string[]): ImportIssue[] {
    const issues: ImportIssue[] = [];

    // Limit to first 20 files for speed
    const filesToCheck = files.slice(0, 20);

    for (const file of filesToCheck) {
        try {
            const content = readFileSync(file, 'utf-8');
            const lines = content.split('\n');

            lines.forEach((line, idx) => {
                // Check for relative imports that might be broken
                const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
                if (importMatch) {
                    const importPath = importMatch[1];

                    // Flag suspicious imports
                    if (importPath.startsWith('../../../')) {
                        issues.push({
                            file: file.replace(dir, '.'),
                            line: idx + 1,
                            message: 'Deep relative import - consider using path aliases',
                            importPath
                        });
                    }

                    // Flag imports without extensions in ESM context
                    if (importPath.startsWith('.') && !importPath.match(/\.(ts|tsx|js|jsx|mjs|json)$/)) {
                        issues.push({
                            file: file.replace(dir, '.'),
                            line: idx + 1,
                            message: 'Import missing file extension - required for ESM',
                            importPath
                        });
                    }
                }
            });
        } catch (error) {
            // Skip files we can't read
        }
    }

    return issues;
}

interface CircularIssue {
    file: string;
    message: string;
    cycle: string[];
}

/**
 * Quick circular dependency check - basic pattern detection
 */
function quickCircularCheck(dir: string): CircularIssue[] {
    const issues: CircularIssue[] = [];

    try {
        // Check for common circular patterns (A -> B -> A)
        // This is a simplified check, not a full graph analysis
        const srcDir = join(dir, 'src');
        if (!existsSync(srcDir)) return issues;

        // Look for index.ts files that might cause circular refs
        const indexFiles = readdirSync(srcDir)
            .filter(f => f === 'index.ts' || f === 'index.tsx');

        if (indexFiles.length > 0) {
            issues.push({
                file: 'src/index.ts',
                message: 'Barrel exports in index.ts can cause circular dependencies',
                cycle: ['index.ts', '(circular pattern detected)']
            });
        }

    } catch (error) {
        // Ignore errors
    }

    return issues;
}

interface PackageIssue {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

/**
 * Quick package.json check
 */
function quickPackageCheck(dir: string): PackageIssue[] {
    const issues: PackageIssue[] = [];

    try {
        const pkgPath = join(dir, 'package.json');
        if (!existsSync(pkgPath)) return issues;

        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

        // Check for missing fields
        if (!pkg.name) {
            issues.push({
                field: 'name',
                message: 'Package name is missing',
                severity: 'error'
            });
        }

        if (!pkg.version) {
            issues.push({
                field: 'version',
                message: 'Package version is missing',
                severity: 'warning'
            });
        }

        // Check for type: "module" in ESM projects
        if (!pkg.type) {
            issues.push({
                field: 'type',
                message: 'Consider adding "type": "module" for ESM support',
                severity: 'warning'
            });
        }

    } catch (error) {
        // Ignore JSON parse errors
    }

    return issues;
}
