import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';
import micromatch from 'micromatch';
import { safeReadFile } from '../utils/safe-file-reader.js';

/**
 * Component Isolation Issue
 * Represents coupling, cohesion, or boundary violations
 */
export interface IsolationIssue {
    file: string;                    // File path relative to workspace
    type: IsolationIssueType;        // Type of isolation problem
    severity: 'high' | 'medium' | 'low';
    metric: string;                  // Metric name (e.g., 'coupling', 'cohesion')
    value: number;                   // Measured value
    threshold: number;               // Acceptable threshold
    message: string;                 // Human-readable description
    affectedFiles: string[];         // Related files
    suggestedFix: string;            // Actionable guidance
}

export type IsolationIssueType =
    | 'tight-coupling'               // Too many dependencies
    | 'low-cohesion'                 // Unrelated responsibilities
    | 'high-fan-in'                  // Too many files depend on this
    | 'high-fan-out'                 // This depends on too many files
    | 'boundary-violation'           // Cross-layer dependency
    | 'god-component'                // Component does too much
    | 'unstable-interface';          // Frequently changing public API

/**
 * Component Isolation Statistics
 */
export interface IsolationStats {
    totalFiles: number;
    totalIssues: number;
    bySeverity: {
        high: number;
        medium: number;
        low: number;
    };
    byType: Record<IsolationIssueType, number>;
    averageCoupling: number;
    averageCohesion: number;
    wellIsolatedComponents: number;
}

/**
 * Component metadata for analysis
 */
interface ComponentMetadata {
    filePath: string;
    imports: string[];               // Files this component imports
    exports: string[];               // Exported symbols
    importedBy: string[];            // Files that import this component
    linesOfCode: number;
    publicSymbols: number;
    responsibilities: string[];      // Detected responsibilities
}

/**
 * ComponentIsolationDetector
 * 
 * Analyzes component isolation quality by measuring:
 * - Coupling: How many dependencies a component has
 * - Cohesion: How related the responsibilities are
 * - Fan-in/Fan-out: Incoming/outgoing dependencies
 * - Boundary violations: Cross-layer dependencies
 * - Stability: How often interfaces change
 * 
 * Target: 80% of components should be well-isolated
 */
export class ComponentIsolationDetector {
    private workspaceRoot: string;
    private components: Map<string, ComponentMetadata> = new Map();
    private dependencyGraph: Map<string, Set<string>> = new Map();
    private reverseDependencyGraph: Map<string, Set<string>> = new Map();

    // Thresholds for detection
    private readonly THRESHOLDS = {
        maxCoupling: 7,              // Max outgoing dependencies
        minCohesion: 0.6,            // Min cohesion score (0-1)
        maxFanIn: 10,                // Max files depending on this
        maxFanOut: 10,               // Max files this depends on
        maxResponsibilities: 3,      // Max distinct responsibilities
        maxLinesOfCode: 400,         // Max LOC for single component (increased from 300)
    };

    // Exempted file patterns (allowed to be large)
    private readonly EXEMPTED_PATTERNS = [
        '**/scripts/**',             // Scripts can be long (CLI, automation)
        '**/*-generator.ts',         // Generators are verbose by nature
        '**/*-reporter.ts',          // Reporters need formatting logic
        '**/seed*.ts',               // Seed files contain data
        '**/migration*.ts',          // Migrations contain schemas
        '**/fixture*.ts',            // Test fixtures can be large
        '**/*.config.ts',            // Config files aggregate settings
        '**/*.config.js',
        '**/prisma/seed.ts',         // Prisma seed files
    ];

    // Architectural layers for boundary detection
    private readonly LAYERS = {
        presentation: ['**/components/**', '**/pages/**', '**/views/**', '**/ui/**'],
        application: ['**/services/**', '**/controllers/**', '**/handlers/**'],
        domain: ['**/models/**', '**/entities/**', '**/domain/**', '**/core/**'],
        infrastructure: ['**/lib/**', '**/utils/**', '**/helpers/**', '**/adapters/**'],
    };

    // Exclusion patterns (same as circular detector)
    private readonly EXCLUDE_PATTERNS = [
        '**/node_modules/**',
        '**/dist/**',
        '**/dist-test/**',
        '**/.next/**',
        '**/out/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.mock.ts',
        '**/*.fixture.ts',
        '**/*.data.ts',
        '**/examples/**',
        '**/showcase/**',
        '**/demo/**',
    ];

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Main detection method
     */
    async detect(targetDir?: string | string[]): Promise<IsolationIssue[]> {
        // Normalize and validate targetDir parameter
        const dirPath = Array.isArray(targetDir) 
            ? targetDir[0] 
            : typeof targetDir === 'string' 
            ? targetDir 
            : this.workspaceRoot;

        const absoluteDir = path.isAbsolute(dirPath)
            ? dirPath
            : path.join(this.workspaceRoot, dirPath);

        // Find all TypeScript/JavaScript files
        const pattern = path.join(absoluteDir, '**/*.{ts,tsx,js,jsx}').replace(/\\/g, '/');
        const files = await glob(pattern, {
            ignore: this.EXCLUDE_PATTERNS,
            absolute: true,
        });

        if (files.length === 0) {
            return [];
        }

        // Build component metadata
        await this.buildComponentMetadata(files);

        // Build dependency graphs
        this.buildDependencyGraphs();

        // Detect isolation issues
        const issues: IsolationIssue[] = [];

        for (const [filePath, metadata] of this.components) {
            // Detect tight coupling
            const couplingIssue = this.detectTightCoupling(filePath, metadata);
            if (couplingIssue) issues.push(couplingIssue);

            // Detect low cohesion
            const cohesionIssue = this.detectLowCohesion(filePath, metadata);
            if (cohesionIssue) issues.push(cohesionIssue);

            // Detect high fan-in
            const fanInIssue = this.detectHighFanIn(filePath, metadata);
            if (fanInIssue) issues.push(fanInIssue);

            // Detect high fan-out
            const fanOutIssue = this.detectHighFanOut(filePath, metadata);
            if (fanOutIssue) issues.push(fanOutIssue);

            // Detect boundary violations
            const boundaryIssue = this.detectBoundaryViolation(filePath, metadata);
            if (boundaryIssue) issues.push(boundaryIssue);

            // Detect god components
            const godComponentIssue = this.detectGodComponent(filePath, metadata);
            if (godComponentIssue) issues.push(godComponentIssue);
        }

        return issues;
    }

    /**
     * Build metadata for all components
     */
    private async buildComponentMetadata(files: string[]): Promise<void> {
        for (const filePath of files) {
            const content = safeReadFile(filePath);
            if (!content) {
                continue; // Skip unreadable files or directories
            }
            
            try {
                const metadata: ComponentMetadata = {
                    filePath,
                    imports: this.extractImports(filePath, content),
                    exports: this.extractExports(content),
                    importedBy: [],
                    linesOfCode: content.split('\n').filter(line => line.trim().length > 0).length,
                    publicSymbols: this.countPublicSymbols(content),
                    responsibilities: this.detectResponsibilities(content),
                };
                this.components.set(filePath, metadata);
            } catch (error) {
                // Skip files that can't be read
                continue;
            }
        }
    }

    /**
     * Extract import statements (reuse circular detector logic)
     */
    private extractImports(filePath: string, content: string): string[] {
        const imports: string[] = [];
        const dir = path.dirname(filePath);

        // ES6 imports
        const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;
            const resolved = this.resolveImport(dir, importPath);
            if (resolved) imports.push(resolved);
        }

        // Dynamic imports
        const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((match = dynamicImportRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;
            const resolved = this.resolveImport(dir, importPath);
            if (resolved) imports.push(resolved);
        }

        // Export-from
        const exportFromRegex = /export\s+(?:(?:[\w*\s{},]*)\s+from\s+)['"]([^'"]+)['"]/g;
        while ((match = exportFromRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;
            const resolved = this.resolveImport(dir, importPath);
            if (resolved) imports.push(resolved);
        }

        // CommonJS require
        const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (!importPath.startsWith('.') && !importPath.startsWith('/')) continue;
            const resolved = this.resolveImport(dir, importPath);
            if (resolved) imports.push(resolved);
        }

        return [...new Set(imports)]; // Deduplicate
    }

    /**
     * Resolve import path to absolute file path
     */
    private resolveImport(fromDir: string, importPath: string): string | null {
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.d.ts', ''];

        for (const ext of extensions) {
            const fullPath = path.resolve(fromDir, importPath + ext);
            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                return fullPath;
            }
        }

        // Try index files
        for (const ext of extensions) {
            const indexPath = path.resolve(fromDir, importPath, `index${ext}`);
            if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
                return indexPath;
            }
        }

        return null;
    }

    /**
     * Extract exported symbols
     */
    private extractExports(content: string): string[] {
        const exports: string[] = [];

        // Named exports: export const/function/class/interface/type
        const namedExportRegex = /export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/g;
        let match;
        while ((match = namedExportRegex.exec(content)) !== null) {
            exports.push(match[1]);
        }

        // Default export
        if (/export\s+default\s+/g.test(content)) {
            exports.push('default');
        }

        return exports;
    }

    /**
     * Count public symbols (exports)
     */
    private countPublicSymbols(content: string): number {
        return this.extractExports(content).length;
    }

    /**
     * Detect component responsibilities based on code patterns
     */
    private detectResponsibilities(content: string): string[] {
        const responsibilities: string[] = [];

        // UI/Rendering
        if (/React\.Component|useState|useEffect|return\s*\(/g.test(content)) {
            responsibilities.push('UI rendering');
        }

        // Data fetching
        if (/fetch\(|axios\.|http\.|api\./gi.test(content)) {
            responsibilities.push('Data fetching');
        }

        // State management
        if (/useState|useReducer|redux|zustand|setState/gi.test(content)) {
            responsibilities.push('State management');
        }

        // Business logic
        if (/calculate|validate|process|transform|compute/gi.test(content)) {
            responsibilities.push('Business logic');
        }

        // Data persistence
        if (/localStorage|sessionStorage|database|prisma|mongoose/gi.test(content)) {
            responsibilities.push('Data persistence');
        }

        // Event handling
        if (/addEventListener|onClick|onSubmit|on[A-Z]\w+=/g.test(content)) {
            responsibilities.push('Event handling');
        }

        return [...new Set(responsibilities)];
    }

    /**
     * Build dependency graphs (forward and reverse)
     */
    private buildDependencyGraphs(): void {
        for (const [filePath, metadata] of this.components) {
            this.dependencyGraph.set(filePath, new Set(metadata.imports));

            for (const importedFile of metadata.imports) {
                if (!this.reverseDependencyGraph.has(importedFile)) {
                    this.reverseDependencyGraph.set(importedFile, new Set());
                }
                this.reverseDependencyGraph.get(importedFile)!.add(filePath);

                // Update importedBy
                const importedMetadata = this.components.get(importedFile);
                if (importedMetadata) {
                    importedMetadata.importedBy.push(filePath);
                }
            }
        }
    }

    /**
     * Detect tight coupling (too many outgoing dependencies)
     */
    private detectTightCoupling(filePath: string, metadata: ComponentMetadata): IsolationIssue | null {
        const coupling = metadata.imports.length;

        if (coupling > this.THRESHOLDS.maxCoupling) {
            const severity = this.calculateCouplingIssue(coupling);
            return {
                file: path.relative(this.workspaceRoot, filePath),
                type: 'tight-coupling',
                severity,
                metric: 'coupling',
                value: coupling,
                threshold: this.THRESHOLDS.maxCoupling,
                message: `Component has ${coupling} dependencies (threshold: ${this.THRESHOLDS.maxCoupling})`,
                affectedFiles: metadata.imports.map(f => path.relative(this.workspaceRoot, f)),
                suggestedFix: this.getSuggestionForCoupling(coupling),
            };
        }

        return null;
    }

    /**
     * Calculate severity for coupling issues
     */
    private calculateCouplingIssue(coupling: number): 'high' | 'medium' | 'low' {
        if (coupling > this.THRESHOLDS.maxCoupling * 2) return 'high';
        if (coupling > this.THRESHOLDS.maxCoupling * 1.5) return 'medium';
        return 'low';
    }

    /**
     * Detect low cohesion (unrelated responsibilities)
     */
    private detectLowCohesion(filePath: string, metadata: ComponentMetadata): IsolationIssue | null {
        if (metadata.responsibilities.length > this.THRESHOLDS.maxResponsibilities) {
            return {
                file: path.relative(this.workspaceRoot, filePath),
                type: 'low-cohesion',
                severity: 'medium',
                metric: 'cohesion',
                value: metadata.responsibilities.length,
                threshold: this.THRESHOLDS.maxResponsibilities,
                message: `Component has ${metadata.responsibilities.length} distinct responsibilities: ${metadata.responsibilities.join(', ')}`,
                affectedFiles: [],
                suggestedFix: 'Split component into smaller, focused components with single responsibilities (SRP)',
            };
        }

        return null;
    }

    /**
     * Detect high fan-in (too many files depend on this)
     */
    private detectHighFanIn(filePath: string, metadata: ComponentMetadata): IsolationIssue | null {
        const fanIn = metadata.importedBy.length;

        if (fanIn > this.THRESHOLDS.maxFanIn) {
            return {
                file: path.relative(this.workspaceRoot, filePath),
                type: 'high-fan-in',
                severity: 'low',
                metric: 'fan-in',
                value: fanIn,
                threshold: this.THRESHOLDS.maxFanIn,
                message: `Component is imported by ${fanIn} files (threshold: ${this.THRESHOLDS.maxFanIn})`,
                affectedFiles: metadata.importedBy.map(f => path.relative(this.workspaceRoot, f)),
                suggestedFix: 'This might be a utility/shared component. Consider if interface is stable and well-documented.',
            };
        }

        return null;
    }

    /**
     * Detect high fan-out (depends on too many files)
     */
    private detectHighFanOut(filePath: string, metadata: ComponentMetadata): IsolationIssue | null {
        const fanOut = metadata.imports.length;

        if (fanOut > this.THRESHOLDS.maxFanOut) {
            return {
                file: path.relative(this.workspaceRoot, filePath),
                type: 'high-fan-out',
                severity: 'medium',
                metric: 'fan-out',
                value: fanOut,
                threshold: this.THRESHOLDS.maxFanOut,
                message: `Component depends on ${fanOut} files (threshold: ${this.THRESHOLDS.maxFanOut})`,
                affectedFiles: metadata.imports.map(f => path.relative(this.workspaceRoot, f)),
                suggestedFix: 'Group related dependencies into facade/aggregate modules to reduce fan-out',
            };
        }

        return null;
    }

    /**
     * Detect boundary violations (cross-layer dependencies)
     */
    private detectBoundaryViolation(filePath: string, metadata: ComponentMetadata): IsolationIssue | null {
        const currentLayer = this.getComponentLayer(filePath);
        if (!currentLayer) return null;

        const violations: string[] = [];

        for (const importedFile of metadata.imports) {
            const importedLayer = this.getComponentLayer(importedFile);
            if (!importedLayer || importedLayer === currentLayer) continue;

            // Check for invalid layer dependencies
            if (this.isInvalidLayerDependency(currentLayer, importedLayer)) {
                violations.push(importedFile);
            }
        }

        if (violations.length > 0) {
            return {
                file: path.relative(this.workspaceRoot, filePath),
                type: 'boundary-violation',
                severity: 'high',
                metric: 'boundary-violation',
                value: violations.length,
                threshold: 0,
                message: `${currentLayer} layer component depends on ${violations.length} files from invalid layers`,
                affectedFiles: violations.map(f => path.relative(this.workspaceRoot, f)),
                suggestedFix: `Follow layered architecture: presentation → application → domain → infrastructure. Extract interfaces or use dependency inversion.`,
            };
        }

        return null;
    }

    /**
     * Get component's architectural layer
     */
    private getComponentLayer(filePath: string): keyof typeof this.LAYERS | null {
        const relativePath = path.relative(this.workspaceRoot, filePath);

        for (const [layer, patterns] of Object.entries(this.LAYERS)) {
            if (micromatch.isMatch(relativePath, patterns)) {
                return layer as keyof typeof this.LAYERS;
            }
        }

        return null;
    }

    /**
     * Check if layer dependency is invalid
     */
    private isInvalidLayerDependency(from: string, to: string): boolean {
        // Valid dependencies (top to bottom):
        // presentation → application, domain, infrastructure
        // application → domain, infrastructure
        // domain → (no dependencies on other layers)
        // infrastructure → (no dependencies on other layers)

        const layerHierarchy: Record<string, string[]> = {
            presentation: ['application', 'domain', 'infrastructure'],
            application: ['domain', 'infrastructure'],
            domain: [],
            infrastructure: [],
        };

        const allowedDeps = layerHierarchy[from] || [];
        return !allowedDeps.includes(to);
    }

    /**
     * Detect god components (too many responsibilities/LOC)
     * Enhanced with smart exemptions and better heuristics
     */
    private detectGodComponent(filePath: string, metadata: ComponentMetadata): IsolationIssue | null {
        const relativePath = path.relative(this.workspaceRoot, filePath);
        
        // Check if file matches exempted patterns (allowed to be large)
        const isExempted = micromatch.isMatch(relativePath, this.EXEMPTED_PATTERNS);
        if (isExempted) {
            return null; // Skip exempted files
        }

        // Higher threshold for specific file types
        const isReporter = filePath.includes('reporter') || filePath.includes('generator');
        const isCLI = filePath.includes('cli.ts') || filePath.includes('interactive');
        const isComponent = filePath.includes('component') && (filePath.endsWith('.tsx') || filePath.endsWith('.jsx'));
        
        // Adjusted thresholds based on file type
        let effectiveThreshold = this.THRESHOLDS.maxLinesOfCode;
        if (isReporter) effectiveThreshold = 500;  // Reporters/generators can be larger
        if (isCLI) effectiveThreshold = 600;       // CLI tools have menus/formatting
        if (isComponent) effectiveThreshold = 350; // React components slightly higher

        // More sophisticated god component detection
        const hasExcessiveLOC = metadata.linesOfCode > effectiveThreshold;
        const hasManyResponsibilities = metadata.responsibilities.length > this.THRESHOLDS.maxResponsibilities * 1.5;
        
        // Both conditions must be true for critical severity
        // Or LOC must be extremely high (>800)
        const isCriticalGod = (hasExcessiveLOC && hasManyResponsibilities) || metadata.linesOfCode > 800;
        const isModerateGod = hasExcessiveLOC || hasManyResponsibilities;

        if (isCriticalGod) {
            return {
                file: relativePath,
                type: 'god-component',
                severity: 'high',
                metric: 'complexity',
                value: metadata.linesOfCode,
                threshold: effectiveThreshold,
                message: `Component has ${metadata.linesOfCode} LOC and ${metadata.responsibilities.length} responsibilities (god component anti-pattern)`,
                affectedFiles: [],
                suggestedFix: 'Break down into smaller components following Single Responsibility Principle (SRP). Extract reusable logic into separate modules.',
            };
        } else if (isModerateGod && metadata.linesOfCode > effectiveThreshold * 1.5) {
            // Only report as medium if significantly over threshold
            return {
                file: relativePath,
                type: 'god-component',
                severity: 'medium',
                metric: 'complexity',
                value: metadata.linesOfCode,
                threshold: effectiveThreshold,
                message: `Component has ${metadata.linesOfCode} LOC (consider refactoring for better maintainability)`,
                affectedFiles: [],
                suggestedFix: 'Consider extracting helper functions or splitting into logical modules.',
            };
        }

        return null;
    }

    /**
     * Get suggestion for coupling issues
     */
    private getSuggestionForCoupling(coupling: number): string {
        if (coupling > 15) {
            return 'Extreme coupling detected. Consider architectural refactor: introduce facades, aggregate modules, or dependency injection.';
        } else if (coupling > 10) {
            return 'High coupling. Group related dependencies into modules, use facade pattern, or introduce service layer.';
        }
        return 'Moderate coupling. Review if all dependencies are necessary. Consider dependency injection or inversion of control.';
    }

    /**
     * Calculate isolation statistics
     */
    getStatistics(issues: IsolationIssue[]): IsolationStats {
        const stats: IsolationStats = {
            totalFiles: this.components.size,
            totalIssues: issues.length,
            bySeverity: { high: 0, medium: 0, low: 0 },
            byType: {
                'tight-coupling': 0,
                'low-cohesion': 0,
                'high-fan-in': 0,
                'high-fan-out': 0,
                'boundary-violation': 0,
                'god-component': 0,
                'unstable-interface': 0,
            },
            averageCoupling: 0,
            averageCohesion: 0,
            wellIsolatedComponents: 0,
        };

        // Count by severity
        for (const issue of issues) {
            stats.bySeverity[issue.severity]++;
            stats.byType[issue.type]++;
        }

        // Calculate averages
        let totalCoupling = 0;
        let totalCohesion = 0;

        for (const metadata of this.components.values()) {
            totalCoupling += metadata.imports.length;
            const cohesion = metadata.responsibilities.length > 0
                ? 1 / metadata.responsibilities.length
                : 1;
            totalCohesion += cohesion;
        }

        stats.averageCoupling = totalCoupling / this.components.size;
        stats.averageCohesion = totalCohesion / this.components.size;

        // Well-isolated: no issues
        const filesWithIssues = new Set(issues.map(i => i.file));
        stats.wellIsolatedComponents = this.components.size - filesWithIssues.size;

        return stats;
    }

    /**
     * Format issue for console output
     */
    formatError(issue: IsolationIssue): string {
        const severityEmoji = {
            high: '🔴',
            medium: '🟡',
            low: '🟢',
        };

        const typeEmoji: Record<IsolationIssueType, string> = {
            'tight-coupling': '🔗',
            'low-cohesion': '🧩',
            'high-fan-in': '📥',
            'high-fan-out': '📤',
            'boundary-violation': '🚧',
            'god-component': '👑',
            'unstable-interface': '⚡',
        };

        let output = `\n${severityEmoji[issue.severity]} ISOLATION ISSUE [${issue.severity.toUpperCase()}]\n`;
        output += `${typeEmoji[issue.type]} Type: ${issue.type}\n`;
        output += `📁 File: ${issue.file}\n`;
        output += `📊 Metric: ${issue.metric} = ${issue.value} (threshold: ${issue.threshold})\n`;
        output += `💬 ${issue.message}\n`;

        if (issue.affectedFiles.length > 0 && issue.affectedFiles.length <= 5) {
            output += `📂 Affected files:\n`;
            for (const file of issue.affectedFiles) {
                output += `   - ${file}\n`;
            }
        } else if (issue.affectedFiles.length > 5) {
            output += `📂 Affected files: ${issue.affectedFiles.length} files (showing first 5)\n`;
            for (const file of issue.affectedFiles.slice(0, 5)) {
                output += `   - ${file}\n`;
            }
        }

        output += `\n✅ Suggested Fix:\n   ${issue.suggestedFix}\n`;

        return output;
    }
}
