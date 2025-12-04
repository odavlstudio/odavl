/**
 * Java Spring Boot Detector
 * Detects Spring Framework and Spring Boot specific issues
 * 
 * Focuses on best practices for dependency injection, transactions, and REST APIs
 * Enhanced with Maven/Gradle build metadata for accurate framework detection
 */

import { BaseJavaDetector, type JavaIssue } from './base-java-detector.js';
import { MavenParser } from '../maven-parser.js';
import { GradleParser } from '../gradle-parser.js';
import * as path from 'path';

interface SpringIssue {
    line: number;
    type: 'transactional' | 'bean-scope' | 'field-injection' | 'rest-api' | 'security' | 'configuration';
    severity: 'error' | 'warning' | 'info';
    message: string;
    recommendation: string;
    code: string;
}

export class JavaSpringDetector extends BaseJavaDetector {
    private mavenParser: MavenParser;
    private gradleParser: GradleParser;
    private detectedFrameworks: string[] = [];

    constructor(workspaceRoot: string) {
        super(workspaceRoot, 'java-spring');
        this.mavenParser = new MavenParser();
        this.gradleParser = new GradleParser();
    }

    async detect(): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            // Check if this is a Java project
            const isJava = await this.isJavaProject(this.workspaceRoot);
            if (!isJava) return [];

            // Check if it's a Spring Boot project using build metadata
            const isSpring = await this.isSpringBootProjectEnhanced(this.workspaceRoot);
            if (!isSpring) {
                console.log('[JavaSpringDetector] Not a Spring Boot project, skipping');
                return [];
            }

            console.log(`[JavaSpringDetector] Spring Boot project detected with frameworks: ${this.detectedFrameworks.join(', ')}`);
            console.log(`[JavaSpringDetector] Using enhanced detection with build metadata`);

            // Find all Java files
            const javaFiles = await this.findJavaFiles(this.workspaceRoot);
            if (javaFiles.length === 0) return [];

            console.log(`[JavaSpringDetector] Found ${javaFiles.length} Java files in Spring Boot project`);

            // Analyze each file
            for (const file of javaFiles) {
                const fileIssues = await this.analyzeFile(file);
                issues.push(...fileIssues);
            }

            return issues;
        } catch (error) {
            console.error('[JavaSpringDetector] Error:', error);
            return [this.createErrorIssue(error instanceof Error ? error.message : 'Unknown error')];
        }
    }

    /**
     * Analyze a single Java file for Spring issues
     */
    private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
        const issues: JavaIssue[] = [];

        try {
            const content = await this.readFile(filePath);
            const lines = content.split('\n');

            // Detect all Spring issues
            const springIssues = [
                ...this.detectMissingTransactional(lines),
                ...this.detectBeanScopeIssues(lines),
                ...this.detectFieldInjection(lines),
                ...this.detectRestApiIssues(lines),
                ...this.detectSecurityIssues(lines),
                ...this.detectConfigurationIssues(lines),
            ];

            // Convert to JavaIssue format
            for (const issue of springIssues) {
                const codeSnippet = await this.extractCodeSnippet(filePath, issue.line, 3);

                issues.push({
                    id: `spring-${issue.code}-${issue.line}`,
                    file: path.relative(this.workspaceRoot, filePath),
                    line: issue.line,
                    column: 0,
                    severity: issue.severity,
                    category: 'spring-boot',
                    message: issue.message,
                    recommendation: issue.recommendation,
                    code: issue.code,
                    codeSnippet,
                });
            }

        } catch (error) {
            console.error(`[JavaSpringDetector] Failed to analyze ${filePath}:`, error);
        }

        return issues;
    }

    /**
     * Detect missing @Transactional on database operations
     */
    private detectMissingTransactional(lines: string[]): SpringIssue[] {
        const issues: SpringIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for @Service or @Repository class
            if (!line.includes('@Service') && !line.includes('@Repository')) continue;

            // Look for methods with multiple DB operations
            for (let j = i + 1; j < Math.min(i + 100, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Match: public method
                const methodMatch = nextLine.match(/public\s+\w+\s+(\w+)\s*\(/);
                if (!methodMatch) continue;

                const methodName = methodMatch[1];

                // Check for @Transactional before method
                let hasTransactional = false;
                for (let k = Math.max(0, j - 5); k < j; k++) {
                    if (lines[k].includes('@Transactional')) {
                        hasTransactional = true;
                        break;
                    }
                }

                // Count DB operations in method (save, update, delete, persist)
                let dbOperations = 0;
                let braceCount = 0;
                for (let k = j; k < Math.min(j + 50, lines.length); k++) {
                    const methodLine = lines[k].trim();

                    braceCount += (methodLine.match(/{/g) || []).length;
                    braceCount -= (methodLine.match(/}/g) || []).length;

                    if (methodLine.match(/\.(save|update|delete|persist|merge|remove)\(/)) {
                        dbOperations++;
                    }

                    // End of method
                    if (braceCount === 0 && k > j) break;
                }

                // If 2+ DB operations without @Transactional, report
                if (dbOperations >= 2 && !hasTransactional) {
                    issues.push({
                        line: j + 1,
                        type: 'transactional',
                        severity: 'warning',
                        message: `Method '${methodName}' has ${dbOperations} DB operations but no @Transactional`,
                        recommendation: `Add @Transactional annotation:\n@Transactional\npublic ${methodName}(...) {\n    // DB operations will be in single transaction\n}`,
                        code: 'SPRING-001',
                    });
                }
            }
        }

        return issues;
    }

    /**
     * Detect incorrect bean scope (prototype beans with @Autowired)
     */
    private detectBeanScopeIssues(lines: string[]): SpringIssue[] {
        const issues: SpringIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for @Component with @Scope("prototype")
            if (!line.includes('@Scope') || !line.includes('prototype')) continue;

            // Find the class name
            let className = '';
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const classMatch = lines[j].match(/class\s+(\w+)/);
                if (classMatch) {
                    className = classMatch[1];
                    break;
                }
            }

            if (!className) continue;

            // Check if this prototype bean is @Autowired somewhere
            // (This would require cross-file analysis, so we just warn about common misuse)
            issues.push({
                line: i + 1,
                type: 'bean-scope',
                severity: 'info',
                message: `Prototype-scoped bean '${className}' - ensure it's not @Autowired in singleton beans`,
                recommendation: `Prototype beans should be created via:\n1. Provider<${className}> or ObjectFactory<${className}>\n2. ApplicationContext.getBean()\n3. @Lookup method\n\nDo NOT use @Autowired directly (will create only 1 instance).`,
                code: 'SPRING-002',
            });
        }

        return issues;
    }

    /**
     * Detect field injection (should use constructor injection)
     */
    private detectFieldInjection(lines: string[]): SpringIssue[] {
        const issues: SpringIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Match: @Autowired on field
            if (!line.includes('@Autowired')) continue;

            // Check next line for field declaration
            if (i + 1 >= lines.length) continue;
            const nextLine = lines[i + 1].trim();

            const fieldMatch = nextLine.match(/private\s+(\w+)\s+(\w+);/);
            if (!fieldMatch) continue;

            const fieldType = fieldMatch[1];
            const fieldName = fieldMatch[2];

            issues.push({
                line: i + 1,
                type: 'field-injection',
                severity: 'info',
                message: `Field injection for '${fieldName}' - constructor injection is preferred`,
                recommendation: `Use constructor injection:\nprivate final ${fieldType} ${fieldName};\n\n@Autowired // or use Lombok @RequiredArgsConstructor\npublic ClassName(${fieldType} ${fieldName}) {\n    this.${fieldName} = ${fieldName};\n}`,
                code: 'SPRING-003',
            });
        }

        return issues;
    }

    /**
     * Detect REST API issues (missing validation, incorrect HTTP methods)
     */
    private detectRestApiIssues(lines: string[]): SpringIssue[] {
        const issues: SpringIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for @RestController or @Controller
            if (!line.includes('@RestController') && !line.includes('@Controller')) continue;

            // Look for endpoint methods
            for (let j = i + 1; j < Math.min(i + 200, lines.length); j++) {
                const nextLine = lines[j].trim();

                // Match: @PostMapping, @PutMapping, @PatchMapping
                const mappingMatch = nextLine.match(/@(Post|Put|Patch)Mapping/);
                if (!mappingMatch) continue;

                const httpMethod = mappingMatch[1];

                // Look for method signature
                for (let k = j + 1; k < Math.min(j + 5, lines.length); k++) {
                    const methodLine = lines[k].trim();
                    const methodMatch = methodLine.match(/public\s+\w+\s+\w+\s*\(([^)]*)\)/);
                    if (!methodMatch) continue;

                    const params = methodMatch[1];

                    // Check for missing @Valid or @Validated on @RequestBody
                    if (params.includes('@RequestBody') && 
                        !params.includes('@Valid') && 
                        !params.includes('@Validated')) {
                        issues.push({
                            line: k + 1,
                            type: 'rest-api',
                            severity: 'warning',
                            message: `${httpMethod} endpoint missing @Valid on @RequestBody`,
                            recommendation: `Add validation:\npublic ResponseEntity<?> method(@Valid @RequestBody YourDTO dto) {\n    // Spring will validate automatically\n}`,
                            code: 'SPRING-004',
                        });
                    }

                    break;
                }
            }
        }

        return issues;
    }

    /**
     * Detect security issues (endpoints without security)
     */
    private detectSecurityIssues(lines: string[]): SpringIssue[] {
        const issues: SpringIssue[] = [];

        // Check if Spring Security is in use
        let hasSecurityConfig = false;
        for (const line of lines) {
            if (line.includes('@EnableWebSecurity') || line.includes('SecurityConfig')) {
                hasSecurityConfig = true;
                break;
            }
        }

        if (!hasSecurityConfig) return issues;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for endpoint mappings
            if (!line.match(/@(Get|Post|Put|Delete|Patch)Mapping/)) continue;

            // Check for @PreAuthorize or @Secured before endpoint
            let hasSecurityAnnotation = false;
            for (let j = Math.max(0, i - 5); j < i; j++) {
                if (lines[j].includes('@PreAuthorize') || 
                    lines[j].includes('@Secured') ||
                    lines[j].includes('@RolesAllowed')) {
                    hasSecurityAnnotation = true;
                    break;
                }
            }

            // If endpoint is not public and has no security annotation, warn
            const isPublic = line.includes('/public/') || line.includes('/health') || line.includes('/actuator');
            if (!hasSecurityAnnotation && !isPublic) {
                issues.push({
                    line: i + 1,
                    type: 'security',
                    severity: 'warning',
                    message: `Endpoint has no security annotation - may be accessible to everyone`,
                    recommendation: `Add security:\n@PreAuthorize("hasRole('USER')") // or hasAuthority, permitAll\n@GetMapping(...)\npublic ResponseEntity<?> method() { ... }`,
                    code: 'SPRING-005',
                });
            }
        }

        return issues;
    }

    /**
     * Detect configuration issues
     */
    private detectConfigurationIssues(lines: string[]): SpringIssue[] {
        const issues: SpringIssue[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Check for @Value without default value
            const valueMatch = line.match(/@Value\("?\$\{([^}]+)\}"?\)/);
            if (!valueMatch) continue;

            const propertyKey = valueMatch[1];

            // Check if it has a default value (format: ${key:default})
            if (!propertyKey.includes(':')) {
                issues.push({
                    line: i + 1,
                    type: 'configuration',
                    severity: 'info',
                    message: `@Value property '${propertyKey}' has no default value`,
                    recommendation: `Provide default value:\n@Value("\${${propertyKey}:defaultValue}")\nprivate String property;\n\nThis prevents startup failures if property is missing.`,
                    code: 'SPRING-006',
                });
            }
        }

        return issues;
    }

    /**
     * Enhanced Spring Boot detection using build metadata
     * Uses Maven/Gradle parsers for 100% accuracy
     */
    private async isSpringBootProjectEnhanced(dir: string): Promise<boolean> {
        try {
            // Try Maven first
            const isMaven = await this.mavenParser.isMavenProject(dir);
            if (isMaven) {
                const pomPath = path.join(dir, 'pom.xml');
                const project = await this.mavenParser.parsePom(pomPath);
                
                if (project && this.mavenParser.isSpringBootProject(project)) {
                    this.detectedFrameworks = this.mavenParser.detectFrameworks(project);
                    console.log('[JavaSpringDetector] Maven: Spring Boot detected with frameworks:', this.detectedFrameworks);
                    return true;
                }
            }

            // Try Gradle
            const isGradle = await this.gradleParser.isGradleProject(dir);
            if (isGradle) {
                const groovyBuild = path.join(dir, 'build.gradle');
                const kotlinBuild = path.join(dir, 'build.gradle.kts');
                
                let project = await this.gradleParser.parseGradleBuild(groovyBuild);
                if (!project) {
                    project = await this.gradleParser.parseGradleBuild(kotlinBuild);
                }
                
                if (project && this.gradleParser.isSpringBootProject(project)) {
                    this.detectedFrameworks = this.gradleParser.detectFrameworks(project);
                    console.log('[JavaSpringDetector] Gradle: Spring Boot detected with frameworks:', this.detectedFrameworks);
                    return true;
                }
            }

            // Fallback to pattern-based detection
            console.log('[JavaSpringDetector] No build file found, using pattern-based detection');
            return await this.isSpringBootProject(dir);
        } catch (error) {
            console.error('[JavaSpringDetector] Enhanced detection failed:', error);
            return await this.isSpringBootProject(dir);
        }
    }
}
