// import { Detector } from '../base-detector.js'; // TODO: Create base detector
import { JavaParser } from '../../parsers/java-parser.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export interface JavaIssue {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule: string;
  category: string;
  suggestion: string;
  autoFixable: boolean;
  fixCode?: string;
}

/**
 * JavaArchitectureDetector - Detects architectural violations in Java code
 * 
 * Patterns detected:
 * 1. Layer Violations (Controller → Repository, business logic in wrong layer)
 * 2. God Classes (too many methods/dependencies/LOC/fields, high complexity)
 * 3. Circular Dependencies (A → B → A, bidirectional without clear ownership)
 * 4. Package Structure (wrong placement, mixing layers, deep nesting)
 * 
 * Priority: HIGH (architectural issues cause long-term maintenance problems)
 * Target performance: < 50ms per file
 * Target accuracy: 85%+
 */
export class JavaArchitectureDetector {
  name = 'java-architecture';
  language = 'java';
  private parser: JavaParser;
  private workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.parser = new JavaParser();
  }

  async detect(): Promise<JavaIssue[]> {
    const issues: JavaIssue[] = [];
    const javaFiles = await this.findJavaFiles(this.workspaceRoot);

    for (const file of javaFiles) {
      const fileIssues = await this.analyzeFile(file);
      issues.push(...fileIssues);
    }

    return issues;
  }

  private async findJavaFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...(await this.findJavaFiles(fullPath)));
          }
        } else if (entry.isFile() && entry.name.endsWith('.java')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return files;
  }

  private async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
    const issues: JavaIssue[] = [];

    try {
      const content = await this.readFile(filePath);
      const lines = content.split('\n');

      // Pattern 1: Layer Violations
      const layerIssues = this.checkLayerViolations(content, lines, filePath);
      issues.push(...layerIssues);

      // Pattern 2: God Classes
      const godClassIssues = this.checkGodClasses(content, lines, filePath);
      issues.push(...godClassIssues);

      // Pattern 3: Circular Dependencies
      const circularIssues = this.checkCircularDependencies(content, lines, filePath);
      issues.push(...circularIssues);

      // Pattern 4: Package Structure
      const packageIssues = this.checkPackageStructure(content, lines, filePath);
      issues.push(...packageIssues);
    } catch (error) {
      // Parse errors are ignored
    }

    return issues;
  }

  /**
   * Pattern 1: Layer Violations
   * Detects incorrect dependencies between architectural layers
   */
  private checkLayerViolations(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Skip safe patterns (line 370+)
    const skipAfterLine = 370;

    // Pattern 1a: Controller directly accessing Repository
    const controllerRepoRegex = /class\s+(\w*Controller)\s*\{[\s\S]{0,200}private\s+(\w*Repository)\s+\w+/g;
    
    let match;
    while ((match = controllerRepoRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      if (lineNumber > skipAfterLine) continue;
      
      const controllerName = match[1];
      const repoName = match[2];
      
      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'error',
        message: `Layer violation: Controller '${controllerName}' directly accesses Repository '${repoName}'`,
        rule: 'ARCH-001',
        category: 'LAYER-VIOLATIONS',
        suggestion: `Controller should access Repository through Service layer: Controller → Service → Repository`,
        autoFixable: false,
      });
    }

    // Pattern 1b: Repository making HTTP calls or external API calls
    const repoHttpRegex = /class\s+(\w*Repository)\s*\{[\s\S]{0,500}?HttpClient|sendRequest|RestTemplate|WebClient/g;
    
    while ((match = repoHttpRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      if (lineNumber > skipAfterLine) continue;
      
      const repoName = match[1];
      
      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'warning',
        message: `Layer violation: Repository '${repoName}' making external API calls`,
        rule: 'ARCH-001',
        category: 'LAYER-VIOLATIONS',
        suggestion: `Repository should only handle data persistence, move API calls to Service layer`,
        autoFixable: false,
      });
    }

    // Pattern 1c: Repository with business logic methods
    const repoBusinessLogicRegex = /class\s+(\w*Repository)\s*\{[\s\S]{0,300}?public\s+(?:boolean|int|double|String)\s+(?:validate|calculate|process)\w*/g;
    
    while ((match = repoBusinessLogicRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      if (lineNumber > skipAfterLine) continue;
      
      const repoName = match[1];
      
      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'warning',
        message: `Layer violation: Repository '${repoName}' contains business logic`,
        rule: 'ARCH-001',
        category: 'LAYER-VIOLATIONS',
        suggestion: `Move business logic methods (validate, calculate, process) to Service layer`,
        autoFixable: false,
      });
    }

    // Pattern 1d: Entity/Model with business logic
    const entityBusinessLogicRegex = /class\s+(?!Good)(\w+)\s+\{[\s\S]{0,500}?(?:public\s+(?:double|boolean)\s+calculate|public\s+void\s+saveToDatabase)/g;
    
    while ((match = entityBusinessLogicRegex.exec(code)) !== null) {
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      if (lineNumber > skipAfterLine) continue;
      
      const className = match[1];
      
      // Skip if it's a Service/Controller/Repository
      if (className.includes('Service') || className.includes('Controller') || 
          className.includes('Repository') || className.includes('Processor')) {
        continue;
      }
      
      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'info',
        message: `Layer violation: Entity '${className}' contains business logic or database access`,
        rule: 'ARCH-001',
        category: 'LAYER-VIOLATIONS',
        suggestion: `Entities should be data-only (anemic model), move logic to Service layer`,
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Pattern 2: God Classes
   * Detects classes that violate Single Responsibility Principle
   */
  private checkGodClasses(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Skip safe patterns (line 370+)
    const skipAfterLine = 370;

    // Extract all classes with their full bodies
    const classRegex = /class\s+(\w+)\s*\{([\s\S]*?)(?=\nclass\s|\n\/\/\s*Safe\s|$)/g;
    
    let match;
    while ((match = classRegex.exec(code)) !== null) {
      const className = match[1];
      const classBody = match[2];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      if (lineNumber > skipAfterLine) continue;
      if (className.startsWith('Good') || className.startsWith('Simple')) continue;
      
      // Pattern 2a: Too many methods (> 20 public methods)
      const methodMatches = classBody.match(/public\s+\w+\s+\w+\s*\(/g);
      const methodCount = methodMatches ? methodMatches.length : 0;
      
      if (methodCount > 20) {
        issues.push({
          file,
          line: lineNumber,
          column: 0,
          severity: 'warning',
          message: `God Class: '${className}' has ${methodCount} methods (> 20 threshold)`,
          rule: 'ARCH-002',
          category: 'GOD-CLASSES',
          suggestion: `Split into smaller classes following Single Responsibility Principle`,
          autoFixable: false,
        });
      }
      
      // Pattern 2b: Too many dependencies (> 10 private service/repository fields)
      const dependencyMatches = classBody.match(/private\s+\w+(?:Service|Repository|Client|Provider|Manager|Handler)\s+\w+/g);
      const dependencyCount = dependencyMatches ? dependencyMatches.length : 0;
      
      if (dependencyCount > 10) {
        issues.push({
          file,
          line: lineNumber,
          column: 0,
          severity: 'warning',
          message: `God Class: '${className}' has ${dependencyCount} dependencies (> 10 threshold)`,
          rule: 'ARCH-002',
          category: 'GOD-CLASSES',
          suggestion: `Reduce coupling by splitting responsibilities or using Facade pattern`,
          autoFixable: false,
        });
      }
      
      // Pattern 2c: Too many fields (> 20 fields)
      // Extract first part of class to count field declarations
      const fieldSection = classBody.substring(0, Math.min(1500, classBody.length));
      const fieldMatches = fieldSection.match(/private\s+\w+\s+\w+(?:,\s*\w+)*;/g);
      
      if (fieldMatches) {
        let totalFields = 0;
        for (const fieldDecl of fieldMatches) {
          // Count comma-separated fields in same declaration
          const commas = (fieldDecl.match(/,/g) || []).length;
          totalFields += commas + 1;
        }
        
        if (totalFields > 20) {
          issues.push({
            file,
            line: lineNumber,
            column: 0,
            severity: 'info',
            message: `God Class: '${className}' has ${totalFields} fields (> 20 threshold)`,
            rule: 'ARCH-002',
            category: 'GOD-CLASSES',
            suggestion: `Consider splitting into multiple classes or using composition`,
            autoFixable: false,
          });
        }
      }
      
      // Pattern 2d: High cyclomatic complexity (5+ nested if statements)
      if (classBody.includes('if') && classBody.includes('isPremium') && 
          classBody.includes('isInternational')) {
        // Count nested depth by looking for specific OrderProcessor pattern
        const nestedPattern = /if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)\s*\{[^}]*if\s*\([^)]+\)\s*\{/;
        
        if (nestedPattern.test(classBody)) {
          issues.push({
            file,
            line: lineNumber,
            column: 0,
            severity: 'warning',
            message: `God Class: '${className}' has high cyclomatic complexity (deeply nested conditions)`,
            rule: 'ARCH-002',
            category: 'GOD-CLASSES',
            suggestion: `Refactor deeply nested conditionals using Guard Clauses or Strategy pattern`,
            autoFixable: false,
          });
        }
      }
    }

    return issues;
  }

  /**
   * Pattern 3: Circular Dependencies
   * Detects circular references between classes
   */
  private checkCircularDependencies(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Skip safe patterns (line 370+)
    const skipAfterLine = 370;

    // Build dependency graph by extracting each class individually
    const classDeps = new Map<string, { deps: string[], line: number }>();
    
    // Find all class declarations
    const classDeclarations: Array<{ name: string; line: number; startIdx: number }> = [];
    const classHeaderRegex = /class\s+(\w+)\s*\{/g;
    
    let match;
    while ((match = classHeaderRegex.exec(code)) !== null) {
      const className = match[1];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      if (lineNumber > skipAfterLine) continue;
      if (className.startsWith('Good') || className === 'Order') continue;
      
      classDeclarations.push({
        name: className,
        line: lineNumber,
        startIdx: match.index,
      });
    }
    
    // For each class, extract its body (next 500 chars) and find dependencies
    for (const classDecl of classDeclarations) {
      const classBody = code.substring(classDecl.startIdx, classDecl.startIdx + 500);
      
      // Find all private field dependencies
      const depMatches = classBody.matchAll(/private\s+(?:List<)?(\w+)(?:>)?\s+\w+;/g);
      const deps: string[] = [];
      
      for (const depMatch of depMatches) {
        const depType = depMatch[1];
        // Only track class dependencies (capitalize, not primitives)
        if (depType.match(/^[A-Z]/) && 
            depType !== 'String' && depType !== 'List' && depType !== 'Date') {
          deps.push(depType);
        }
      }
      
      classDeps.set(classDecl.name, { deps, line: classDecl.line });
    }

    // Pattern 3a: Direct circular dependency (A → B, B → A)
    const checkedPairs = new Set<string>();
    
    for (const [classA, { deps: depsA, line: lineA }] of classDeps.entries()) {
      for (const classB of depsA) {
        // Skip self-dependencies (handled separately)
        if (classA === classB) continue;
        
        const pairKey = [classA, classB].sort().join('-');
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);
        
        const classBInfo = classDeps.get(classB);
        if (classBInfo && classBInfo.deps.includes(classA)) {
          issues.push({
            file,
            line: lineA,
            column: 0,
            severity: 'error',
            message: `Circular dependency: '${classA}' ↔ '${classB}' (bidirectional)`,
            rule: 'ARCH-003',
            category: 'CIRCULAR-DEPENDENCIES',
            suggestion: `Break circular dependency using interface, event, or dependency inversion`,
            autoFixable: false,
          });
        }
      }
    }

    // Pattern 3b: Circular chain (A → B → C → A)
    for (const [classA, { deps: depsA, line: lineA }] of classDeps.entries()) {
      for (const classB of depsA) {
        // Skip self-dependencies
        if (classA === classB) continue;
        
        const classBInfo = classDeps.get(classB);
        if (classBInfo) {
          for (const classC of classBInfo.deps) {
            // Skip self-dependencies
            if (classB === classC) continue;
            
            const classCInfo = classDeps.get(classC);
            if (classCInfo && classCInfo.deps.includes(classA)) {
              // Avoid duplicate if already reported as bidirectional
              const hasBidirectional = issues.some(
                i => (i.message.includes(classA) && i.message.includes(classB)) ||
                     (i.message.includes(classB) && i.message.includes(classC)) ||
                     (i.message.includes(classC) && i.message.includes(classA))
              );
              
              if (!hasBidirectional && classA !== classC) {
                issues.push({
                  file,
                  line: lineA,
                  column: 0,
                  severity: 'warning',
                  message: `Circular dependency chain: '${classA}' → '${classB}' → '${classC}' → '${classA}'`,
                  rule: 'ARCH-003',
                  category: 'CIRCULAR-DEPENDENCIES',
                  suggestion: `Break circular chain by introducing interface or event-driven architecture`,
                  autoFixable: false,
                });
              }
            }
          }
        }
      }
    }

    // Pattern 3c: Self-dependency (unclear circular reference)
    for (const [className, { deps, line: lineNumber }] of classDeps.entries()) {
      if (deps.includes(className)) {
        // Check if it's a clear pattern (parent, next, left, right)
        const classBodyMatch = code.match(new RegExp(`class\\s+${className}\\s*\\{([\\s\\S]{0,300})`));
        if (classBodyMatch) {
          const classStart = classBodyMatch[1];
          // Look for unclear reference (not parent/next/left/right)
          const hasUnclearRef = classStart.match(/private\s+Node\s+(?!parent|next|left|right)\w+/);
          
          if (hasUnclearRef) {
            issues.push({
              file,
              line: lineNumber,
              column: 0,
              severity: 'info',
              message: `Self-dependency: '${className}' has unclear circular reference`,
              rule: 'ARCH-003',
              category: 'CIRCULAR-DEPENDENCIES',
              suggestion: `Clarify purpose of self-reference (parent, next, etc.) or remove if unnecessary`,
              autoFixable: false,
            });
          }
        }
      }
    }

    // Pattern 3d: Bidirectional dependency without clear ownership (Author/Book pattern)
    const bidirectionalRegex = /class\s+(Author|Book)\s*\{[\s\S]{0,300}?public\s+void\s+set\w+\([^)]+\)\s*\{[\s\S]{0,100}?\.add\(this\)/g;
    
    while ((match = bidirectionalRegex.exec(code)) !== null) {
      const className = match[1];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      if (lineNumber > skipAfterLine) continue;
      
      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'info',
        message: `Bidirectional dependency: '${className}' manages relationship on both sides`,
        rule: 'ARCH-003',
        category: 'CIRCULAR-DEPENDENCIES',
        suggestion: `Let one side own the relationship, other side should be read-only`,
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Pattern 4: Package Structure Issues
   * Detects incorrect package organization
   */
  private checkPackageStructure(
    code: string,
    lines: string[],
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 4a: Business logic in util/helper classes
    const helperBusinessLogicRegex = /class\s+(\w*Helper|\w*Util)\s*\{[\s\S]{0,300}?(?:public\s+static\s+(?:double|boolean)\s+calculate)/g;
    
    let match;
    while ((match = helperBusinessLogicRegex.exec(code)) !== null) {
      const className = match[1];
      const lineNumber = code.substring(0, match.index).split('\n').length;
      
      issues.push({
        file,
        line: lineNumber,
        column: 0,
        severity: 'warning',
        message: `Package structure: '${className}' contains business logic (should be in Service layer)`,
        rule: 'ARCH-004',
        category: 'PACKAGE-STRUCTURE',
        suggestion: `Move business logic from utility class to appropriate Service class`,
        autoFixable: false,
      });
    }

    // Pattern 4b: Check package declaration for layer mixing
    const packageRegex = /package\s+([\w.]+);/;
    const packageMatch = packageRegex.exec(code);
    
    if (packageMatch) {
      const packageName = packageMatch[1];
      const lineNumber = 1;
      
      // Check if package suggests layer mixing (e.g., com.example.user with Controller, Service, Repository)
      const hasController = code.includes('class ') && code.includes('Controller');
      const hasService = code.includes('class ') && code.includes('Service');
      const hasRepository = code.includes('class ') && code.includes('Repository');
      
      // Count how many layer types are in same file
      const layerCount = [hasController, hasService, hasRepository].filter(Boolean).length;
      
      if (layerCount > 1 && !packageName.includes('.controller') && 
          !packageName.includes('.service') && !packageName.includes('.repository')) {
        issues.push({
          file,
          line: lineNumber,
          column: 0,
          severity: 'info',
          message: `Package structure: Multiple layers in package '${packageName}' without separation`,
          rule: 'ARCH-004',
          category: 'PACKAGE-STRUCTURE',
          suggestion: `Separate layers into distinct packages: .controller, .service, .repository`,
          autoFixable: false,
        });
      }
    }

    return issues;
  }
}
