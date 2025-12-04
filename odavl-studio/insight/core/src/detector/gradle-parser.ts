/**
 * Gradle Build File Parser for ODAVL Insight
 * 
 * Parses Gradle build.gradle and build.gradle.kts files to extract:
 * - Project dependencies
 * - Plugins
 * - Java version configuration
 * - Framework detection (Spring Boot, Micronaut, Quarkus, etc.)
 * - Build tool detection (Groovy DSL vs Kotlin DSL)
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface GradleProject {
  projectDir: string;
  buildFile: string;
  dslType: 'groovy' | 'kotlin';
  plugins: GradlePlugin[];
  dependencies: GradleDependency[];
  javaVersion?: string;
  sourceCompatibility?: string;
  targetCompatibility?: string;
  repositories: string[];
}

export interface GradlePlugin {
  id: string;
  version?: string;
}

export interface GradleDependency {
  configuration: string; // implementation, api, testImplementation, etc.
  group?: string;
  name?: string;
  version?: string;
  notation?: string; // e.g., "org.springframework.boot:spring-boot-starter-web:3.2.0"
}

export class GradleParser {
  /**
   * Check if directory contains a Gradle build file
   */
  async isGradleProject(dir: string): Promise<boolean> {
    try {
      const groovyBuild = path.join(dir, 'build.gradle');
      const kotlinBuild = path.join(dir, 'build.gradle.kts');
      
      const hasGroovy = await fs.access(groovyBuild).then(() => true).catch(() => false);
      const hasKotlin = await fs.access(kotlinBuild).then(() => true).catch(() => false);
      
      return hasGroovy || hasKotlin;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find all Gradle build files recursively
   */
  async findGradleFiles(rootDir: string, maxDepth = 3): Promise<string[]> {
    const buildFiles: string[] = [];
    
    async function search(dir: string, depth: number): Promise<void> {
      if (depth > maxDepth) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          // Skip build directories
          if (entry.isDirectory()) {
            const skipDirs = ['build', 'node_modules', '.gradle', 'gradle', 'target', 'dist', 'out'];
            if (skipDirs.includes(entry.name)) continue;

            await search(fullPath, depth + 1);
          } else if (entry.isFile()) {
            if (entry.name === 'build.gradle' || entry.name === 'build.gradle.kts') {
              buildFiles.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore permission errors, etc.
      }
    }

    await search(rootDir, 1);
    return buildFiles;
  }

  /**
   * Parse a Gradle build file
   */
  async parseGradleBuild(buildFilePath: string): Promise<GradleProject | null> {
    try {
      const content = await fs.readFile(buildFilePath, 'utf-8');
      const dslType: 'groovy' | 'kotlin' = buildFilePath.endsWith('.kts') ? 'kotlin' : 'groovy';
      
      return this.parseGradleContent(content, buildFilePath, dslType);
    } catch (error) {
      console.error(`Error parsing Gradle build file ${buildFilePath}:`, error);
      return null;
    }
  }

  /**
   * Parse Gradle build file content
   */
  parseGradleContent(content: string, buildFilePath: string, dslType: 'groovy' | 'kotlin'): GradleProject | null {
    try {
      const project: GradleProject = {
        projectDir: path.dirname(buildFilePath),
        buildFile: path.basename(buildFilePath),
        dslType,
        plugins: this.extractPlugins(content, dslType),
        dependencies: this.extractDependencies(content, dslType),
        javaVersion: this.extractJavaVersion(content, dslType),
        sourceCompatibility: this.extractCompatibility(content, 'sourceCompatibility', dslType),
        targetCompatibility: this.extractCompatibility(content, 'targetCompatibility', dslType),
        repositories: this.extractRepositories(content, dslType),
      };

      return project;
    } catch (error) {
      console.error('Error parsing Gradle content:', error);
      return null;
    }
  }

  /**
   * Extract plugins from build file
   */
  private extractPlugins(content: string, dslType: 'groovy' | 'kotlin'): GradlePlugin[] {
    const plugins: GradlePlugin[] = [];

    if (dslType === 'groovy') {
      // Groovy DSL: id 'plugin-id' version 'version'
      const pluginRegex = /id\s+['"]([^'"]+)['"]\s*(?:version\s+['"]([^'"]+)['"])?/g;
      let match;
      while ((match = pluginRegex.exec(content)) !== null) {
        plugins.push({
          id: match[1],
          version: match[2],
        });
      }

      // Also check for apply plugin: pattern
      const applyPluginRegex = /apply\s+plugin:\s*['"]([^'"]+)['"]/g;
      while ((match = applyPluginRegex.exec(content)) !== null) {
        if (!plugins.some(p => p.id === match[1])) {
          plugins.push({ id: match[1] });
        }
      }
    } else {
      // Kotlin DSL: id("plugin-id") version "version"
      const pluginRegex = /id\s*\(\s*"([^"]+)"\s*\)\s*(?:version\s+"([^"]+)")?/g;
      let match;
      while ((match = pluginRegex.exec(content)) !== null) {
        plugins.push({
          id: match[1],
          version: match[2],
        });
      }
    }

    return plugins;
  }

  /**
   * Extract dependencies from build file
   */
  private extractDependencies(content: string, dslType: 'groovy' | 'kotlin'): GradleDependency[] {
    const dependencies: GradleDependency[] = [];

    if (dslType === 'groovy') {
      // Groovy DSL: implementation 'group:name:version'
      const depRegex = /(implementation|api|testImplementation|runtimeOnly|compileOnly|annotationProcessor)\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = depRegex.exec(content)) !== null) {
        const notation = match[2];
        const parts = notation.split(':');
        
        dependencies.push({
          configuration: match[1],
          group: parts[0],
          name: parts[1],
          version: parts[2],
          notation,
        });
      }
    } else {
      // Kotlin DSL: implementation("group:name:version")
      const depRegex = /(implementation|api|testImplementation|runtimeOnly|compileOnly|kapt|annotationProcessor)\s*\(\s*"([^"]+)"\s*\)/g;
      let match;
      while ((match = depRegex.exec(content)) !== null) {
        const notation = match[2];
        const parts = notation.split(':');
        
        dependencies.push({
          configuration: match[1],
          group: parts[0],
          name: parts[1],
          version: parts[2],
          notation,
        });
      }
    }

    return dependencies;
  }

  /**
   * Extract Java version configuration
   */
  private extractJavaVersion(content: string, dslType: 'groovy' | 'kotlin'): string | undefined {
    // Try multiple patterns

    // Pattern 1: java.toolchain.languageVersion
    let match = content.match(/java\s*\{[^}]*toolchain\s*\{[^}]*languageVersion\s*=?\s*JavaLanguageVersion\.of\((\d+)\)/);
    if (match) return match[1];

    match = content.match(/toolchain\s*\{[^}]*languageVersion\s*\.set\s*\(\s*JavaLanguageVersion\.of\((\d+)\)\s*\)/);
    if (match) return match[1];

    // Pattern 2: sourceCompatibility / targetCompatibility
    match = content.match(/sourceCompatibility\s*=\s*['"]([\d.]+)['"]/);
    if (match) return match[1];

    match = content.match(/targetCompatibility\s*=\s*['"]([\d.]+)['"]/);
    if (match) return match[1];

    // Pattern 3: JavaVersion enum
    match = content.match(/sourceCompatibility\s*=\s*JavaVersion\.VERSION_(\d+)_(\d+)/);
    if (match) return `${match[1]}.${match[2]}`;

    match = content.match(/sourceCompatibility\s*=\s*JavaVersion\.VERSION_(\d+)/);
    if (match) return match[1];

    return undefined;
  }

  /**
   * Extract source/target compatibility
   */
  private extractCompatibility(content: string, compatType: 'sourceCompatibility' | 'targetCompatibility', dslType: 'groovy' | 'kotlin'): string | undefined {
    const regex = new RegExp(`${compatType}\\s*=\\s*['"]([\d.]+)['"]`);
    const match = content.match(regex);
    return match?.[1];
  }

  /**
   * Extract repositories
   */
  private extractRepositories(content: string, dslType: 'groovy' | 'kotlin'): string[] {
    const repos: string[] = [];

    // Check for common repositories
    if (/mavenCentral\(\)/.test(content)) repos.push('mavenCentral');
    if (/google\(\)/.test(content)) repos.push('google');
    if (/gradlePluginPortal\(\)/.test(content)) repos.push('gradlePluginPortal');
    if (/mavenLocal\(\)/.test(content)) repos.push('mavenLocal');
    if (/jcenter\(\)/.test(content)) repos.push('jcenter');

    // Custom maven repositories
    const mavenRegex = /maven\s*\{\s*url\s*(?:=\s*uri\()?['"]([^'"]+)['"]\)?/g;
    let match;
    while ((match = mavenRegex.exec(content)) !== null) {
      repos.push(match[1]);
    }

    return repos;
  }

  /**
   * Detect if project is Spring Boot
   */
  isSpringBootProject(project: GradleProject): boolean {
    // Check for Spring Boot plugin
    const hasSpringBootPlugin = project.plugins.some(
      p => p.id === 'org.springframework.boot' || p.id === 'io.spring.dependency-management'
    );

    if (hasSpringBootPlugin) return true;

    // Check for Spring Boot dependencies
    const hasSpringBootDep = project.dependencies.some(
      d => d.group === 'org.springframework.boot' && d.name?.startsWith('spring-boot-starter')
    );

    return hasSpringBootDep;
  }

  /**
   * Detect frameworks used in project
   */
  detectFrameworks(project: GradleProject): string[] {
    const frameworks = new Set<string>();

    // Spring Boot
    if (this.isSpringBootProject(project)) {
      frameworks.add('Spring Boot');
    }

    // Spring Framework sub-projects
    const springDeps = project.dependencies.filter(d => d.group === 'org.springframework.boot');
    for (const dep of springDeps) {
      if (dep.name?.includes('spring-boot-starter-web')) frameworks.add('Spring Web');
      if (dep.name?.includes('spring-boot-starter-data-jpa')) frameworks.add('Spring Data JPA');
      if (dep.name?.includes('spring-boot-starter-security')) frameworks.add('Spring Security');
      if (dep.name?.includes('spring-boot-starter-webflux')) frameworks.add('Spring WebFlux');
      if (dep.name?.includes('spring-boot-starter-test')) frameworks.add('Spring Test');
    }

    // Hibernate
    if (project.dependencies.some(d => d.group === 'org.hibernate' || d.name?.includes('hibernate'))) {
      frameworks.add('Hibernate');
    }

    // Micronaut
    if (project.plugins.some(p => p.id === 'io.micronaut.application')) {
      frameworks.add('Micronaut');
    }

    // Quarkus
    if (project.plugins.some(p => p.id === 'io.quarkus')) {
      frameworks.add('Quarkus');
    }

    // JUnit
    if (project.dependencies.some(d => d.group === 'org.junit.jupiter' || d.name?.includes('junit'))) {
      frameworks.add('JUnit');
    }

    // Mockito
    if (project.dependencies.some(d => d.name?.includes('mockito'))) {
      frameworks.add('Mockito');
    }

    // Kotlin
    if (project.plugins.some(p => p.id === 'org.jetbrains.kotlin.jvm' || p.id.startsWith('kotlin'))) {
      frameworks.add('Kotlin');
    }

    return Array.from(frameworks);
  }

  /**
   * Detect annotation processors and code generators
   */
  detectPlugins(project: GradleProject): string[] {
    const plugins = new Set<string>();

    // Lombok
    const hasLombok = project.dependencies.some(
      d => (d.group === 'org.projectlombok' && d.name === 'lombok') ||
           d.notation?.includes('lombok')
    );
    if (hasLombok) plugins.add('Lombok');

    // MapStruct
    const hasMapStruct = project.dependencies.some(
      d => d.group === 'org.mapstruct' || d.notation?.includes('mapstruct')
    );
    if (hasMapStruct) plugins.add('MapStruct');

    // Kotlin annotation processing (kapt)
    if (project.plugins.some(p => p.id === 'kotlin-kapt')) {
      plugins.add('Kotlin KAPT');
    }

    // Java annotation processing
    if (project.dependencies.some(d => d.configuration === 'annotationProcessor')) {
      plugins.add('Java Annotation Processor');
    }

    return Array.from(plugins);
  }
}
