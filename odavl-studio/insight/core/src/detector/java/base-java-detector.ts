/**
 * Base Java Detector Interface
 * Common structure for all Java-specific detectors
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface JavaIssue {
    id: string;
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    code?: string;
    recommendation?: string;
    codeSnippet?: string;
    autoFix?: {
        description: string;
        replacement: string;
    };
}

export abstract class BaseJavaDetector {
    protected workspaceRoot: string;
    protected detectorName: string;

    constructor(workspaceRoot: string, detectorName: string) {
        this.workspaceRoot = workspaceRoot;
        this.detectorName = detectorName;
    }

    /**
     * Main detection method - must be implemented by subclasses
     */
    abstract detect(): Promise<JavaIssue[]>;

    /**
     * Find all Java files in workspace (skip build directories)
     */
    protected async findJavaFiles(dir: string): Promise<string[]> {
        const files: string[] = [];
        
        async function walk(directory: string) {
            const entries = await fs.readdir(directory, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(directory, entry.name);
                
                // Skip common Java build/dependency directories
                const skipDirs = [
                    'node_modules',
                    '.git',
                    'target',        // Maven build output
                    'build',         // Gradle build output
                    'out',           // IntelliJ output
                    '.gradle',       // Gradle cache
                    '.mvn',          // Maven wrapper
                    '.idea',         // IntelliJ config
                    '.vscode',       // VS Code config
                    '__pycache__',   // Python cache (if mixed project)
                    'venv',          // Python venv (if mixed project)
                ];
                
                if (skipDirs.includes(entry.name)) continue;
                
                if (entry.isDirectory()) {
                    await walk(fullPath);
                } else if (entry.name.endsWith('.java')) {
                    files.push(fullPath);
                }
            }
        }
        
        await walk(dir);
        return files;
    }

    /**
     * Detect if directory is a Java project
     */
    protected async isJavaProject(dir: string): Promise<boolean> {
        try {
            // Check for Maven (pom.xml)
            await fs.access(path.join(dir, 'pom.xml'));
            return true;
        } catch {
            try {
                // Check for Gradle (build.gradle or build.gradle.kts)
                await fs.access(path.join(dir, 'build.gradle'));
                return true;
            } catch {
                try {
                    await fs.access(path.join(dir, 'build.gradle.kts'));
                    return true;
                } catch {
                    // Check for any .java files
                    const javaFiles = await this.findJavaFiles(dir);
                    return javaFiles.length > 0;
                }
            }
        }
    }

    /**
     * Read file content
     */
    protected async readFile(filePath: string): Promise<string> {
        return await fs.readFile(filePath, 'utf-8');
    }

    /**
     * Extract code snippet around a line
     */
    protected async extractCodeSnippet(filePath: string, line: number, contextLines: number = 2): Promise<string> {
        try {
            const content = await this.readFile(filePath);
            const lines = content.split('\n');
            const startLine = Math.max(0, line - contextLines - 1);
            const endLine = Math.min(lines.length, line + contextLines);
            
            return lines.slice(startLine, endLine).join('\n');
        } catch {
            return '';
        }
    }

    /**
     * Create standardized error issue
     */
    protected createErrorIssue(message: string, file: string = 'system'): JavaIssue {
        return {
            id: `${this.detectorName}-error`,
            file,
            line: 0,
            column: 0,
            severity: 'error',
            category: 'detector',
            message: `${this.detectorName} failed: ${message}`,
        };
    }

    /**
     * Create standardized warning issue
     */
    protected createWarningIssue(file: string, line: number, message: string, code?: string): JavaIssue {
        return {
            id: `${this.detectorName}-${code || 'warning'}-${line}`,
            file: path.relative(this.workspaceRoot, file),
            line,
            column: 0,
            severity: 'warning',
            category: this.detectorName,
            message,
            code,
        };
    }

    /**
     * Create standardized info issue
     */
    protected createInfoIssue(file: string, line: number, message: string, recommendation?: string): JavaIssue {
        return {
            id: `${this.detectorName}-info-${line}`,
            file: path.relative(this.workspaceRoot, file),
            line,
            column: 0,
            severity: 'info',
            category: this.detectorName,
            message,
            recommendation,
        };
    }

    /**
     * Detect Java version from project
     */
    protected async detectJavaVersion(dir: string): Promise<string | undefined> {
        try {
            // Try Maven pom.xml
            const pomPath = path.join(dir, 'pom.xml');
            try {
                const pomContent = await fs.readFile(pomPath, 'utf-8');
                
                // Try maven.compiler.source/target
                let versionMatch = pomContent.match(/<maven\.compiler\.(source|target)>(\d+)<\/maven\.compiler\.(source|target)>/);
                if (versionMatch) return versionMatch[2];
                
                // Try java.version property
                versionMatch = pomContent.match(/<java\.version>(\d+)<\/java\.version>/);
                if (versionMatch) return versionMatch[1];
            } catch {}

            // Try Gradle build.gradle
            const gradlePath = path.join(dir, 'build.gradle');
            try {
                const gradleContent = await fs.readFile(gradlePath, 'utf-8');
                const versionMatch = gradleContent.match(/sourceCompatibility\s*=\s*['"]?(\d+)['"]?/);
                if (versionMatch) return versionMatch[1];
            } catch {}

            // Try Gradle build.gradle.kts (Kotlin DSL)
            const gradleKtsPath = path.join(dir, 'build.gradle.kts');
            try {
                const gradleKtsContent = await fs.readFile(gradleKtsPath, 'utf-8');
                const versionMatch = gradleKtsContent.match(/sourceCompatibility\s*=\s*JavaVersion\.VERSION_(\d+)/);
                if (versionMatch) return versionMatch[1];
            } catch {}

            return undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * Detect if project uses Spring Boot
     */
    protected async isSpringBootProject(dir: string): Promise<boolean> {
        try {
            // Check Maven pom.xml for Spring Boot
            const pomPath = path.join(dir, 'pom.xml');
            try {
                const pomContent = await fs.readFile(pomPath, 'utf-8');
                if (pomContent.includes('spring-boot')) return true;
            } catch {}

            // Check Gradle build.gradle for Spring Boot
            const gradlePath = path.join(dir, 'build.gradle');
            try {
                const gradleContent = await fs.readFile(gradlePath, 'utf-8');
                if (gradleContent.includes('spring-boot')) return true;
            } catch {}

            // Check for Spring Boot application class
            const javaFiles = await this.findJavaFiles(dir);
            for (const file of javaFiles) {
                const content = await this.readFile(file);
                if (content.includes('@SpringBootApplication')) return true;
            }

            return false;
        } catch {
            return false;
        }
    }

    /**
     * Detect Maven project
     */
    protected async isMavenProject(dir: string): Promise<boolean> {
        try {
            await fs.access(path.join(dir, 'pom.xml'));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Detect Gradle project
     */
    protected async isGradleProject(dir: string): Promise<boolean> {
        try {
            await fs.access(path.join(dir, 'build.gradle'));
            return true;
        } catch {
            try {
                await fs.access(path.join(dir, 'build.gradle.kts'));
                return true;
            } catch {
                return false;
            }
        }
    }
}
