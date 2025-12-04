/**
 * Import/Export Error Detector
 * Detects import and export errors in the project
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

export interface ImportError {
    file: string;
    line: number;
    importStatement: string;
    importedModule: string;
    issue: 'not-found' | 'no-export' | 'circular' | 'syntax-error';
    rootCause: string;
    suggestedFix: string;
}

export class ImportDetector {
    private workspaceRoot: string;

    constructor(workspaceRoot: string) {
        this.workspaceRoot = workspaceRoot;
    }

    /**
     * Detects all import/export errors
     */
    async detect(targetDir?: string): Promise<ImportError[]> {
        const dir = targetDir || this.workspaceRoot;
        const errors: ImportError[] = [];

        // Search for all TypeScript/JavaScript files
        const files = await glob('**/*.{ts,tsx,js,jsx,mjs,cjs}', {
            cwd: dir,
            ignore: [
                'node_modules/**',
                'dist/**',
                '.next/**',
                'out/**',
                '**/*.data.ts',        // Mock/example data files
                '**/*.mock.ts',        // Mock files
                '**/*.fixture.ts',     // Test fixtures
                '**/examples/**',      // Example code
                '**/showcase/**',      // Showcase examples
                '**/demo/**'           // Demo code
            ]
        });

        for (const file of files) {
            const filePath = path.join(dir, file);
            const fileErrors = await this.checkFileImports(filePath);
            errors.push(...fileErrors);
        }

        return errors;
    }

    /**
     * Check imports in a single file
     */
    private async checkFileImports(filePath: string): Promise<ImportError[]> {
        const errors: ImportError[] = [];
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        // Import pattern:
        // import { x } from './path'
        // import x from './path'
        // const x = require('./path')
        const importRegex = /import\s+(?:{[^}]+}|[\w*]+)?\s*(?:,\s*{[^}]+})?\s*from\s+['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // Skip comments and JSDoc
            const trimmedLine = line.trim();
            if (
                trimmedLine.startsWith('//') ||
                trimmedLine.startsWith('*') ||
                trimmedLine.startsWith('/*')
            ) {
                continue;
            }

            // Check import statements
            let match;
            while ((match = importRegex.exec(line)) !== null) {
                const importPath = match[1];
                const error = await this.validateImport(
                    filePath,
                    lineNumber,
                    line.trim(),
                    importPath
                );
                if (error) errors.push(error);
            }

            // Check require statements
            while ((match = requireRegex.exec(line)) !== null) {
                const importPath = match[1];
                const error = await this.validateImport(
                    filePath,
                    lineNumber,
                    line.trim(),
                    importPath
                );
                if (error) errors.push(error);
            }
        }

        return errors;
    }

    /**
     * Validate import path
     */
    private async validateImport(
        sourceFile: string,
        line: number,
        statement: string,
        importPath: string
    ): Promise<ImportError | null> {
        // Ignore imports from node_modules
        if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            return null;
        }

        const sourceDir = path.dirname(sourceFile);
        let resolvedPath = path.resolve(sourceDir, importPath);

        // For TypeScript projects with ESM: .js/.mjs/.cjs imports → .ts files
        // Only remove JS extensions, not other extensions like .types
        const extname = path.extname(resolvedPath);
        if (extname === '.js' || extname === '.mjs' || extname === '.cjs') {
            resolvedPath = resolvedPath.slice(0, -extname.length);
        }

        // Try adding common extensions (TypeScript first for TS projects)
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.d.ts', ''];
        let exists = false;

        for (const ext of extensions) {
            const testPath = resolvedPath + ext;
            if (fs.existsSync(testPath) && fs.statSync(testPath).isFile()) {
                exists = true;
                break;
            }
        }

        // Check if it's a directory with index file
        if (!exists) {
            for (const ext of extensions) {
                const indexPath = path.join(resolvedPath, `index${ext}`);
                if (fs.existsSync(indexPath)) {
                    exists = true;
                    break;
                }
            }
        }

        if (!exists) {
            return {
                file: sourceFile,
                line,
                importStatement: statement,
                importedModule: importPath,
                issue: 'not-found',
                rootCause: `Imported file not found: ${importPath}`,
                suggestedFix: `Verify path correctness or file exists at:
   ${resolvedPath}
   Try: ls ${path.dirname(resolvedPath)}`
            };
        }

        return null;
    }

    /**
     * Detect circular dependencies
     */
    async detectCircularDeps(_targetDir?: string): Promise<string[][]> {
        // TODO: implement circular dependency detection
        // Can use madge library
        return [];
    }

    /**
     * Format error for display
     */
    formatError(error: ImportError): string {
        const relPath = path.relative(this.workspaceRoot, error.file);

        return `
🔗 IMPORT ERROR [${error.issue}]
📁 File: ${relPath}
📍 Line: ${error.line}
💬 Statement: ${error.importStatement}

🔍 Root Cause:
   ${error.rootCause}

✅ Suggested Fix:
   ${error.suggestedFix}
${'─'.repeat(60)}
`;
    }
}
