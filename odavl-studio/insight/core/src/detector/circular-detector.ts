/**
 * Circular Dependency Detector
 * Detects circular dependencies between files using graph analysis
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

export interface CircularDependency {
    cycle: string[];           // Array of file paths forming the cycle
    depth: number;             // Number of files in the cycle
    severity: 'high' | 'medium' | 'low';
    message: string;
    suggestedFix: string;
}

export interface DependencyGraph {
    [file: string]: string[];  // file -> array of files it imports
}

export interface CircularStats {
    totalCycles: number;
    bySeverity: {
        high: number;      // 2-file direct cycles
        medium: number;    // 3-4 file cycles
        low: number;       // 5+ file cycles
    };
    byDepth: {
        [depth: number]: number;
    };
    affectedFiles: Set<string>;
}

export class CircularDependencyDetector {
    private workspaceRoot: string;
    private graph: DependencyGraph = {};
    private visited: Set<string> = new Set();
    private recursionStack: Set<string> = new Set();
    private currentPath: string[] = [];

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detect all circular dependencies
     */
    async detect(targetDir?: string): Promise<CircularDependency[]> {
        const dir = targetDir || this.workspaceRoot;

        // Build dependency graph
        await this.buildDependencyGraph(dir);

        // Find cycles
        const cycles = this.detectCycles();

        return cycles;
    }

    /**
     * Build dependency graph from file imports
     */
    private async buildDependencyGraph(dir: string): Promise<void> {
        // Search for all TypeScript/JavaScript files
        const files = await glob('**/*.{ts,tsx,js,jsx,mjs,cjs}', {
            cwd: dir,
            ignore: [
                'node_modules/**',
                'dist/**',
                '.next/**',
                'out/**',
                '**/*.test.ts',        // Test files (intentional cycles in mocks)
                '**/*.test.tsx',
                '**/*.spec.ts',
                '**/*.spec.tsx',
                '**/*.data.ts',        // Mock data files
                '**/*.mock.ts',        // Mock implementations
                '**/*.fixture.ts',     // Test fixtures
                '**/examples/**',      // Example code
                '**/showcase/**',      // Showcase examples
                '**/demo/**'           // Demo code
            ]
        });

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const imports = this.extractImports(fullPath);

            // Resolve relative imports to absolute paths
            const resolvedImports = imports
                .map(imp => this.resolveImport(fullPath, imp))
                .filter((imp): imp is string => imp !== null);

            this.graph[fullPath] = resolvedImports;
        }
    }

    /**
     * Extract import statements from a file
     */
    private extractImports(filePath: string): string[] {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const imports: string[] = [];

            // Match ES6 import statements: import { x } from '...'
            const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
            let match;

            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];

                // Skip external packages (don't start with . or /)
                if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                    continue;
                }

                imports.push(importPath);
            }

            // Match dynamic imports: import('...')
            const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
            while ((match = dynamicImportRegex.exec(content)) !== null) {
                const importPath = match[1];

                if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                    continue;
                }

                imports.push(importPath);
            }

            // Match export-from statements: export { x } from '...'
            const exportFromRegex = /export\s+(?:(?:[\w*\s{},]*)\s+from\s+)['"]([^'"]+)['"]/g;
            while ((match = exportFromRegex.exec(content)) !== null) {
                const importPath = match[1];

                if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                    continue;
                }

                imports.push(importPath);
            }

            // Match CommonJS require statements: require('...')
            const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
            while ((match = requireRegex.exec(content)) !== null) {
                const importPath = match[1];

                if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                    continue;
                }

                imports.push(importPath);
            }

            return imports;
        } catch (error) {
            return [];
        }
    }

    /**
     * Resolve relative import path to absolute file path
     */
    private resolveImport(fromFile: string, importPath: string): string | null {
        const dir = path.dirname(fromFile);

        // Handle relative paths
        if (importPath.startsWith('.')) {
            let resolved = path.resolve(dir, importPath);

            // Try different extensions
            const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.d.ts', ''];
            for (const ext of extensions) {
                const withExt = resolved + ext;
                if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
                    return withExt;
                }

                // Check for index file
                const indexPath = path.join(resolved, `index${ext}`);
                if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
                    return indexPath;
                }
            }
        }

        return null;
    }

    /**
     * Detect cycles using DFS with path tracking
     */
    private detectCycles(): CircularDependency[] {
        const cycles: CircularDependency[] = [];
        const seenCycles = new Set<string>(); // To avoid duplicate cycles

        // Reset tracking structures
        this.visited = new Set();
        this.recursionStack = new Set();

        for (const node of Object.keys(this.graph)) {
            if (!this.visited.has(node)) {
                this.currentPath = [];
                this.dfs(node, cycles, seenCycles);
            }
        }

        return cycles;
    }

    /**
     * Depth-first search to find cycles
     */
    private dfs(
        node: string,
        cycles: CircularDependency[],
        seenCycles: Set<string>
    ): void {
        this.visited.add(node);
        this.recursionStack.add(node);
        this.currentPath.push(node);

        const neighbors = this.graph[node] || [];

        for (const neighbor of neighbors) {
            if (!this.visited.has(neighbor)) {
                this.dfs(neighbor, cycles, seenCycles);
            } else if (this.recursionStack.has(neighbor)) {
                // Found a cycle!
                const cycleStart = this.currentPath.indexOf(neighbor);
                if (cycleStart !== -1) {
                    const cycle = this.currentPath.slice(cycleStart);
                    // Don't push neighbor again - cycle already complete

                    // Create canonical representation (sorted) to avoid duplicates
                    const sortedCycle = [...cycle].sort((a, b) => a.localeCompare(b));
                    const cycleKey = sortedCycle.join('|');

                    if (!seenCycles.has(cycleKey)) {
                        seenCycles.add(cycleKey);

                        const relativeCycle = cycle.map(f =>
                            path.relative(this.workspaceRoot, f)
                        );

                        const depth = cycle.length; // Number of files in cycle
                        const severity = this.calculateSeverity(depth);

                        cycles.push({
                            cycle: relativeCycle,
                            depth,
                            severity,
                            message: `Circular dependency detected: ${relativeCycle.length} files`,
                            suggestedFix: this.generateSuggestion(relativeCycle, depth)
                        });
                    }
                }
            }
        }

        this.currentPath.pop();
        this.recursionStack.delete(node);
    }

    /**
     * Calculate severity based on cycle depth
     */
    private calculateSeverity(depth: number): 'high' | 'medium' | 'low' {
        if (depth === 2) return 'high';      // Direct A ↔ B cycle
        if (depth <= 4) return 'medium';     // A → B → C → A
        return 'low';                         // Complex cycles
    }

    /**
     * Generate refactoring suggestion based on cycle complexity
     */
    private generateSuggestion(_cycle: string[], depth: number): string {
        if (depth === 2) {
            return `Direct circular dependency. Solutions:
   1. Extract common code to a shared module
   2. Use dependency injection pattern
   3. Move one import to be lazy (dynamic import)`;
        }

        if (depth <= 4) {
            return `Medium complexity cycle. Solutions:
   1. Identify common interfaces and extract to separate file
   2. Use dependency injection container
   3. Restructure code to follow dependency flow (top → bottom)`;
        }

        return `Complex circular dependency chain. Solutions:
   1. Refactor architecture - consider layered design
   2. Use event-driven communication instead of direct imports
   3. Extract shared types/interfaces to common module
   4. Consider breaking into smaller, independent modules`;
    }

    /**
     * Get statistics about circular dependencies
     */
    getStatistics(cycles: CircularDependency[]): CircularStats {
        const stats: CircularStats = {
            totalCycles: cycles.length,
            bySeverity: {
                high: 0,
                medium: 0,
                low: 0
            },
            byDepth: {},
            affectedFiles: new Set()
        };

        for (const cycle of cycles) {
            // Count by severity
            stats.bySeverity[cycle.severity]++;

            // Count by depth
            stats.byDepth[cycle.depth] = (stats.byDepth[cycle.depth] || 0) + 1;

            // Track affected files
            cycle.cycle.forEach(file => stats.affectedFiles.add(file));
        }

        return stats;
    }

    /**
     * Format error for display
     */
    formatError(circular: CircularDependency): string {
        const severityEmoji = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };

        const cycleVisualization = circular.cycle
            .map((file, index) => {
                if (index === circular.cycle.length - 1) {
                    return `   └─➤ ${file} (back to start)`;
                }
                return `   ${index === 0 ? '┌─➤' : '├─➤'} ${file}`;
            })
            .join('\n');

        return `
${severityEmoji[circular.severity]} CIRCULAR DEPENDENCY [${circular.severity.toUpperCase()}]
📊 Depth: ${circular.depth} files
💬 ${circular.message}

🔄 Cycle Path:
${cycleVisualization}

🔍 Impact:
   This creates tight coupling and makes code harder to:
   - Test in isolation
   - Refactor safely
   - Understand data flow

✅ Suggested Fix:
   ${circular.suggestedFix}
${'─'.repeat(60)}
`;
    }
}
