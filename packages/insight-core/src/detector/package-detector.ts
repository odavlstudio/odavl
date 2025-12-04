/**
 * Package.json Error Detector
 * Detects package.json errors: missing dependencies, version conflicts, etc.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

export interface PackageError {
    type: 'missing-dependency' | 'version-mismatch' | 'peer-conflict' | 'invalid-json' | 'unused-dependency';
    packageName?: string;
    file: string;
    severity: 'error' | 'warning';
    rootCause: string;
    suggestedFix: string;
    details?: string;
}

export class PackageDetector {
    private readonly workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detects all package.json errors in the project
     */
    async detect(targetDir?: string): Promise<PackageError[]> {
        const dir = targetDir || this.workspaceRoot;
        const errors: PackageError[] = [];

        // Find all package.json files in monorepo
        const packageJsonPaths = this.findPackageJsonFiles(dir);

        for (const pkgPath of packageJsonPaths) {
            const pkgErrors = await this.checkPackageJson(pkgPath);
            errors.push(...pkgErrors);
        }

        return errors;
    }

    /**
     * Find all package.json files in monorepo
     */
    private findPackageJsonFiles(dir: string): string[] {
        const paths: string[] = [];
        const mainPkgPath = path.join(dir, 'package.json');

        if (fs.existsSync(mainPkgPath)) {
            paths.push(mainPkgPath);
        }

        // Search in apps/, packages/, tools/
        const workspaceDirs = ['apps', 'packages', 'tools'];

        for (const wsDir of workspaceDirs) {
            const wsPath = path.join(dir, wsDir);
            if (!fs.existsSync(wsPath)) continue;

            const entries = fs.readdirSync(wsPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const pkgPath = path.join(wsPath, entry.name, 'package.json');
                    if (fs.existsSync(pkgPath)) {
                        paths.push(pkgPath);
                    }
                }
            }
        }

        return paths;
    }

    /**
     * Check a single package.json
     */
    private async checkPackageJson(pkgPath: string): Promise<PackageError[]> {
        const errors: PackageError[] = [];

        // 1. Check JSON syntax validity
        let pkgJson: Record<string, unknown>;
        try {
            const content = fs.readFileSync(pkgPath, 'utf8');
            pkgJson = JSON.parse(content);
        } catch (err) {
            errors.push({
                type: 'invalid-json',
                file: pkgPath,
                severity: 'error',
                rootCause: `JSON syntax error: ${(err as Error).message}`,
                suggestedFix: `Check file using JSON validator or VSCode`
            });
            return errors; // Cannot continue
        }

        // 2. Check missing dependencies
        const missingDeps = await this.checkMissingDependencies(pkgPath, pkgJson);
        errors.push(...missingDeps);

        // 3. Check version conflicts
        const versionIssues = this.checkVersionConflicts(pkgPath, pkgJson);
        errors.push(...versionIssues);

        // 4. Check peer dependencies
        const peerIssues = await this.checkPeerDependencies(pkgPath, pkgJson);
        errors.push(...peerIssues);

        return errors;
    }

    /**
     * Check missing dependencies (not in node_modules)
     */
    private async checkMissingDependencies(
        pkgPath: string,
        pkgJson: Record<string, unknown>
    ): Promise<PackageError[]> {
        const errors: PackageError[] = [];
        const packageDir = path.dirname(pkgPath);
        const nodeModules = path.join(packageDir, 'node_modules');

        // If node_modules doesn't exist at all
        if (!fs.existsSync(nodeModules)) {
            return [{
                type: 'missing-dependency',
                file: pkgPath,
                severity: 'error',
                rootCause: 'node_modules directory not found - Dependencies not installed',
                suggestedFix: `cd ${path.dirname(pkgPath)} && pnpm install`
            }];
        }

        // Check each dependency
        const allDeps = {
            ...(pkgJson.dependencies || {}),
            ...(pkgJson.devDependencies || {})
        };

        for (const depName of Object.keys(allDeps)) {
            const depPath = path.join(nodeModules, depName);
            if (!fs.existsSync(depPath)) {
                errors.push({
                    type: 'missing-dependency',
                    packageName: depName,
                    file: pkgPath,
                    severity: 'error',
                    rootCause: `Package ${depName} defined in package.json but not installed in node_modules`,
                    suggestedFix: `cd ${path.dirname(pkgPath)} && pnpm install ${depName}`
                });
            }
        }

        return errors;
    }

    /**
     * Check version conflicts (e.g. same package with different versions)
     */
    private checkVersionConflicts(pkgPath: string, pkgJson: Record<string, unknown>): PackageError[] {
        const errors: PackageError[] = [];

        // Check if package exists in both dependencies and devDependencies
        const deps: Record<string, string> = (pkgJson.dependencies || {}) as Record<string, string>;
        const devDeps: Record<string, string> = (pkgJson.devDependencies || {}) as Record<string, string>;

        for (const depName of Object.keys(deps)) {
            if (devDeps[depName]) {
                const depVersion = deps[depName];
                const devDepVersion = devDeps[depName];

                if (depVersion !== devDepVersion) {
                    errors.push({
                        type: 'version-mismatch',
                        packageName: depName,
                        file: pkgPath,
                        severity: 'warning',
                        rootCause: `Package ${depName} exists with two different versions:
   dependencies: ${depVersion}
   devDependencies: ${devDepVersion}`,
                        suggestedFix: `Choose one version and update package.json manually`
                    });
                }
            }
        }

        return errors;
    }

    /**
     * Check peer dependencies (compatibility issues)
     */
    private async checkPeerDependencies(
        pkgPath: string,
        _pkgJson: Record<string, unknown>
    ): Promise<PackageError[]> {
        const errors: PackageError[] = [];
        const packageDir = path.dirname(pkgPath);

        // Run pnpm to check peer dependencies
        try {
            execSync('pnpm install --dry-run', {
                cwd: packageDir,
                stdio: 'pipe',
                encoding: 'utf8'
            });
        } catch (err: unknown) {
            const error = err as { stderr?: string; stdout?: string };
            const output = error.stderr || error.stdout || '';

            // Search for peer dependency warning messages
            const peerRegex = /WARN.*peer\s+dependency.*@?([\w\-@/]+).*requires\s+([\w\-@/]+)@([\d.^~>=<*]+)/gi;
            let match;

            while ((match = peerRegex.exec(output)) !== null) {
                const [, parentPkg, requiredPkg, requiredVersion] = match;

                errors.push({
                    type: 'peer-conflict',
                    packageName: requiredPkg,
                    file: pkgPath,
                    severity: 'warning',
                    rootCause: `Package ${parentPkg} requires peer dependency:
   ${requiredPkg}@${requiredVersion}`,
                    suggestedFix: `pnpm add ${requiredPkg}@${requiredVersion} -D`,
                    details: match[0]
                });
            }
        }

        return errors;
    }

    /**
     * Format error for display
     */
    formatError(error: PackageError): string {
        const relPath = path.relative(this.workspaceRoot, error.file);
        const emoji = error.severity === 'error' ? '❌' : '⚠️';
        const typeLabel = {
            'missing-dependency': 'MISSING DEPENDENCY',
            'version-mismatch': 'VERSION CONFLICT',
            'peer-conflict': 'MISSING PEER DEPENDENCY',
            'invalid-json': 'INVALID JSON',
            'unused-dependency': 'UNUSED DEPENDENCY'
        }[error.type];

        return `
${emoji} PACKAGE ERROR [${typeLabel}]
📦 Package: ${error.packageName || 'N/A'}
📁 File: ${relPath}
🔍 Root Cause:
   ${error.rootCause}

✅ Suggested Fix:
   ${error.suggestedFix}
${error.details ? `\n📋 Details:\n   ${error.details}` : ''}
${'─'.repeat(60)}
`;
    }
}
