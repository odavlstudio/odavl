/**
 * Maven POM Parser
 * Parses pom.xml files for Java project metadata
 * Week 10 Day 6 - Maven/Gradle Enhancement
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface MavenDependency {
  groupId: string;
  artifactId: string;
  version?: string;
  scope?: 'compile' | 'test' | 'runtime' | 'provided' | 'system';
}

export interface MavenPlugin {
  groupId: string;
  artifactId: string;
  version?: string;
  configuration?: Record<string, unknown>;
}

export interface MavenProject {
  groupId: string;
  artifactId: string;
  version: string;
  packaging?: string;
  name?: string;
  description?: string;
  parent?: {
    groupId: string;
    artifactId: string;
    version: string;
  };
  properties: Record<string, string>;
  dependencies: MavenDependency[];
  plugins: MavenPlugin[];
  modules?: string[];
  javaVersion?: string;
}

export class MavenParser {
  /**
   * Parse pom.xml file
   */
  async parsePom(pomPath: string): Promise<MavenProject | null> {
    try {
      const content = await fs.readFile(pomPath, 'utf-8');
      return this.parsePomContent(content);
    } catch (error) {
      console.error(`Failed to parse pom.xml at ${pomPath}:`, error);
      return null;
    }
  }

  /**
   * Parse pom.xml content (XML string)
   */
  parsePomContent(content: string): MavenProject | null {
    try {
      // Basic XML parsing (no external dependencies)
      const project: Partial<MavenProject> = {
        properties: {},
        dependencies: [],
        plugins: [],
      };

      // Extract project coordinates
      project.groupId = this.extractTag(content, 'groupId') || '';
      project.artifactId = this.extractTag(content, 'artifactId') || '';
      project.version = this.extractTag(content, 'version') || '';
      project.packaging = this.extractTag(content, 'packaging') || 'jar';
      project.name = this.extractTag(content, 'name');
      project.description = this.extractTag(content, 'description');

      // Extract parent
      const parentSection = this.extractSection(content, 'parent');
      if (parentSection) {
        project.parent = {
          groupId: this.extractTag(parentSection, 'groupId') || '',
          artifactId: this.extractTag(parentSection, 'artifactId') || '',
          version: this.extractTag(parentSection, 'version') || '',
        };
      }

      // Extract properties
      const propertiesSection = this.extractSection(content, 'properties');
      if (propertiesSection) {
        project.properties = this.extractProperties(propertiesSection);
      }

      // Extract Java version
      project.javaVersion = 
        project.properties?.['java.version'] ||
        project.properties?.['maven.compiler.source'] ||
        project.properties?.['maven.compiler.target'];

      // Extract dependencies
      const dependenciesSection = this.extractSection(content, 'dependencies');
      if (dependenciesSection) {
        project.dependencies = this.extractDependencies(dependenciesSection);
      }

      // Extract plugins
      const buildSection = this.extractSection(content, 'build');
      if (buildSection) {
        const pluginsSection = this.extractSection(buildSection, 'plugins');
        if (pluginsSection) {
          project.plugins = this.extractPlugins(pluginsSection);
        }
      }

      // Extract modules (multi-module project)
      const modulesSection = this.extractSection(content, 'modules');
      if (modulesSection) {
        project.modules = this.extractModules(modulesSection);
      }

      return project as MavenProject;
    } catch (error) {
      console.error('Failed to parse pom.xml content:', error);
      return null;
    }
  }

  /**
   * Detect if directory contains Maven project
   */
  async isMavenProject(dir: string): Promise<boolean> {
    try {
      const pomPath = path.join(dir, 'pom.xml');
      await fs.access(pomPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Find pom.xml in directory tree
   */
  async findPomFiles(rootDir: string, maxDepth: number = 3): Promise<string[]> {
    const pomFiles: string[] = [];
    
    async function search(dir: string, depth: number) {
      if (depth > maxDepth) return;
      
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip common directories
          if (entry.isDirectory()) {
            if (!['node_modules', 'target', 'build', '.git'].includes(entry.name)) {
              await search(fullPath, depth + 1);
            }
          } else if (entry.name === 'pom.xml') {
            pomFiles.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    await search(rootDir, 0);
    return pomFiles;
  }

  /**
   * Check if project uses Spring Boot
   */
  isSpringBootProject(project: MavenProject): boolean {
    if (project.parent?.artifactId === 'spring-boot-starter-parent') {
      return true;
    }
    
    return project.dependencies.some(dep =>
      dep.groupId === 'org.springframework.boot' &&
      dep.artifactId.startsWith('spring-boot-starter')
    );
  }

  /**
   * Get framework information
   */
  detectFrameworks(project: MavenProject): string[] {
    const frameworks: string[] = [];
    
    for (const dep of project.dependencies) {
      const key = `${dep.groupId}:${dep.artifactId}`;
      
      // Spring Framework
      if (dep.groupId === 'org.springframework.boot') {
        if (!frameworks.includes('Spring Boot')) frameworks.push('Spring Boot');
        
        if (dep.artifactId === 'spring-boot-starter-web') frameworks.push('Spring Web');
        if (dep.artifactId === 'spring-boot-starter-data-jpa') frameworks.push('Spring Data JPA');
        if (dep.artifactId === 'spring-boot-starter-security') frameworks.push('Spring Security');
      }
      
      // Hibernate
      if (dep.groupId === 'org.hibernate' || dep.artifactId.includes('hibernate')) {
        if (!frameworks.includes('Hibernate')) frameworks.push('Hibernate');
      }
      
      // Micronaut
      if (dep.groupId?.startsWith('io.micronaut')) {
        if (!frameworks.includes('Micronaut')) frameworks.push('Micronaut');
      }
      
      // Quarkus
      if (dep.groupId?.startsWith('io.quarkus')) {
        if (!frameworks.includes('Quarkus')) frameworks.push('Quarkus');
      }
      
      // Testing frameworks
      if (dep.artifactId === 'junit-jupiter' || dep.artifactId === 'junit') {
        frameworks.push('JUnit');
      }
      if (dep.artifactId === 'mockito-core') {
        frameworks.push('Mockito');
      }
    }
    
    return frameworks;
  }

  /**
   * Detect common plugins (Lombok, Mapstruct, etc.)
   */
  detectPlugins(project: MavenProject): string[] {
    const detectedPlugins: string[] = [];
    
    // Check dependencies for annotation processors
    for (const dep of project.dependencies) {
      if (dep.groupId === 'org.projectlombok' && dep.artifactId === 'lombok') {
        detectedPlugins.push('Lombok');
      }
      if (dep.groupId === 'org.mapstruct' && dep.artifactId === 'mapstruct') {
        detectedPlugins.push('MapStruct');
      }
    }
    
    // Check plugins
    for (const plugin of project.plugins) {
      if (plugin.artifactId === 'lombok-maven-plugin') {
        detectedPlugins.push('Lombok');
      }
      if (plugin.artifactId === 'mapstruct-processor') {
        detectedPlugins.push('MapStruct');
      }
    }
    
    return [...new Set(detectedPlugins)]; // Remove duplicates
  }

  // === Private Helper Methods ===

  private extractTag(content: string, tagName: string): string | undefined {
    const regex = new RegExp(`<${tagName}>([^<]+)<\/${tagName}>`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
  }

  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`<${sectionName}[^>]*>([\\s\\S]*?)<\/${sectionName}>`, 'i');
    const match = content.match(regex);
    return match ? match[1] : null;
  }

  private extractProperties(propertiesContent: string): Record<string, string> {
    const properties: Record<string, string> = {};
    const propertyRegex = /<([^>/]+)>([^<]+)<\/\1>/g;
    let match;
    
    while ((match = propertyRegex.exec(propertiesContent)) !== null) {
      properties[match[1]] = match[2].trim();
    }
    
    return properties;
  }

  private extractDependencies(dependenciesContent: string): MavenDependency[] {
    const dependencies: MavenDependency[] = [];
    const depRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
    let match;
    
    while ((match = depRegex.exec(dependenciesContent)) !== null) {
      const depContent = match[1];
      dependencies.push({
        groupId: this.extractTag(depContent, 'groupId') || '',
        artifactId: this.extractTag(depContent, 'artifactId') || '',
        version: this.extractTag(depContent, 'version'),
        scope: this.extractTag(depContent, 'scope') as MavenDependency['scope'],
      });
    }
    
    return dependencies;
  }

  private extractPlugins(pluginsContent: string): MavenPlugin[] {
    const plugins: MavenPlugin[] = [];
    const pluginRegex = /<plugin>([\s\S]*?)<\/plugin>/g;
    let match;
    
    while ((match = pluginRegex.exec(pluginsContent)) !== null) {
      const pluginContent = match[1];
      plugins.push({
        groupId: this.extractTag(pluginContent, 'groupId') || '',
        artifactId: this.extractTag(pluginContent, 'artifactId') || '',
        version: this.extractTag(pluginContent, 'version'),
      });
    }
    
    return plugins;
  }

  private extractModules(modulesContent: string): string[] {
    const modules: string[] = [];
    const moduleRegex = /<module>([^<]+)<\/module>/g;
    let match;
    
    while ((match = moduleRegex.exec(modulesContent)) !== null) {
      modules.push(match[1].trim());
    }
    
    return modules;
  }
}
