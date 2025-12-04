/**
 * Wrapper Function Detection System v3.0
 * 
 * MAJOR IMPROVEMENTS:
 * 1. Automatically discovers wrapper functions (http.ts, api.ts, etc.)
 * 2. Analyzes wrappers for error handling, timeouts, retry logic
 * 3. Skips false positives when code uses known wrappers
 * 4. Maintains registry of discovered wrappers
 * 
 * Expected Impact: Network false positives 82% → <15%
 * 
 * @author ODAVL Team
 * @version 3.0.0
 */

import * as ts from 'typescript';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

export interface WrapperInfo {
  name: string;
  filePath: string;
  wraps: 'fetch' | 'axios' | 'http' | 'request';
  features: {
    hasErrorHandling: boolean;
    hasTimeout: boolean;
    hasRetry: boolean;
    hasCircuitBreaker: boolean;
  };
  confidence: number; // 0-100
  exports: string[]; // Exported function names
}

export interface WrapperCallSite {
  functionName: string;
  importPath: string;
  wrapper: WrapperInfo | null;
}

export class WrapperDetectionSystem {
  private wrapperRegistry = new Map<string, WrapperInfo>();
  private importMap = new Map<string, string>(); // file -> wrapper path

  /**
   * Build registry of wrapper functions in workspace
   */
  async buildRegistry(workspace: string): Promise<void> {
    console.log('🔍 Building wrapper function registry...');

    // Find potential wrapper files
    const wrapperFiles = await glob(
      '**/lib/**/{http,fetch,api,request,client}*.{ts,js}',
      {
        cwd: workspace,
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
        absolute: true,
      }
    );

    console.log(`📁 Found ${wrapperFiles.length} potential wrapper files`);

    // Analyze each file
    for (const file of wrapperFiles) {
      const wrappers = await this.analyzeWrapperFile(file);
      
      for (const wrapper of wrappers) {
        this.wrapperRegistry.set(wrapper.name, wrapper);
        console.log(`✅ Registered wrapper: ${wrapper.name} (${wrapper.filePath})`);
      }
    }

    console.log(`✅ Wrapper registry built: ${this.wrapperRegistry.size} wrappers found`);
  }

  /**
   * Analyze file to detect wrapper functions
   */
  private async analyzeWrapperFile(filePath: string): Promise<WrapperInfo[]> {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const wrappers: WrapperInfo[] = [];

    const visit = (node: ts.Node) => {
      // Check for function declarations
      if (ts.isFunctionDeclaration(node) && node.name) {
        const wrapper = this.analyzeFunction(node, filePath);
        if (wrapper) wrappers.push(wrapper);
      }

      // Check for arrow function exports
      if (ts.isVariableStatement(node)) {
        const wrapper = this.analyzeVariableStatement(node, filePath);
        if (wrapper) wrappers.push(wrapper);
      }

      // Check for class methods
      if (ts.isClassDeclaration(node)) {
        const classWrappers = this.analyzeClass(node, filePath);
        wrappers.push(...classWrappers);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return wrappers;
  }

  /**
   * Analyze function declaration for wrapper pattern
   */
  private analyzeFunction(
    node: ts.FunctionDeclaration,
    filePath: string
  ): WrapperInfo | null {
    if (!node.name) return null;

    const name = node.name.text;
    const bodyText = node.body?.getText() || '';

    // Check if wraps fetch/axios/http
    const wraps = this.detectWrappedAPI(bodyText);
    if (!wraps) return null;

    // Analyze features
    const features = {
      hasErrorHandling: this.hasErrorHandling(bodyText),
      hasTimeout: this.hasTimeout(bodyText),
      hasRetry: this.hasRetry(bodyText),
      hasCircuitBreaker: this.hasCircuitBreaker(bodyText),
    };

    // Calculate confidence
    const confidence = this.calculateWrapperConfidence(features);

    return {
      name,
      filePath,
      wraps,
      features,
      confidence,
      exports: [name],
    };
  }

  /**
   * Analyze variable statement (arrow functions)
   */
  private analyzeVariableStatement(
    node: ts.VariableStatement,
    filePath: string
  ): WrapperInfo | null {
    const declaration = node.declarationList.declarations[0];
    if (!declaration || !ts.isIdentifier(declaration.name)) return null;

    const name = declaration.name.text;
    const initializer = declaration.initializer;
    if (!initializer) return null;

    const bodyText = initializer.getText();

    // Check if wraps fetch/axios/http
    const wraps = this.detectWrappedAPI(bodyText);
    if (!wraps) return null;

    // Analyze features
    const features = {
      hasErrorHandling: this.hasErrorHandling(bodyText),
      hasTimeout: this.hasTimeout(bodyText),
      hasRetry: this.hasRetry(bodyText),
      hasCircuitBreaker: this.hasCircuitBreaker(bodyText),
    };

    const confidence = this.calculateWrapperConfidence(features);

    return {
      name,
      filePath,
      wraps,
      features,
      confidence,
      exports: [name],
    };
  }

  /**
   * Analyze class for wrapper methods
   */
  private analyzeClass(
    node: ts.ClassDeclaration,
    filePath: string
  ): WrapperInfo[] {
    const className = node.name?.text || 'AnonymousClass';
    const wrappers: WrapperInfo[] = [];

    for (const member of node.members) {
      if (ts.isMethodDeclaration(member) && member.name) {
        const methodName = member.name.getText();
        const bodyText = member.body?.getText() || '';

        const wraps = this.detectWrappedAPI(bodyText);
        if (!wraps) continue;

        const features = {
          hasErrorHandling: this.hasErrorHandling(bodyText),
          hasTimeout: this.hasTimeout(bodyText),
          hasRetry: this.hasRetry(bodyText),
          hasCircuitBreaker: this.hasCircuitBreaker(bodyText),
        };

        const confidence = this.calculateWrapperConfidence(features);

        wrappers.push({
          name: `${className}.${methodName}`,
          filePath,
          wraps,
          features,
          confidence,
          exports: [methodName],
        });
      }
    }

    return wrappers;
  }

  /**
   * Detect which API is wrapped (fetch, axios, etc.)
   */
  private detectWrappedAPI(code: string): 'fetch' | 'axios' | 'http' | 'request' | null {
    if (/\bfetch\s*\(/.test(code)) return 'fetch';
    if (/\baxios\b/.test(code)) return 'axios';
    if (/\bhttp\.(?:get|post|put|delete)/.test(code)) return 'http';
    if (/\brequest\s*\(/.test(code)) return 'request';
    return null;
  }

  /**
   * Check if code has error handling
   */
  private hasErrorHandling(code: string): boolean {
    const patterns = [
      /try\s*\{/,
      /\.catch\s*\(/,
      /catch\s*\(\s*\w+\s*\)/,
      /if\s*\(\s*!.*\.ok\s*\)/,
      /throw\s+new\s+Error/,
    ];

    return patterns.some(pattern => pattern.test(code));
  }

  /**
   * Check if code has timeout configuration
   */
  private hasTimeout(code: string): boolean {
    const patterns = [
      /timeout\s*:/,
      /AbortSignal\.timeout/,
      /setTimeout/,
      /timeoutMs/,
      /maxTimeout/,
    ];

    return patterns.some(pattern => pattern.test(code));
  }

  /**
   * Check if code has retry logic
   */
  private hasRetry(code: string): boolean {
    const patterns = [
      /\bretry\b/i,
      /\bmaxRetries\b/i,
      /\bretryCount\b/i,
      /for\s*\(\s*let\s+\w+\s*=\s*0.*attempts/,
      /while\s*\(.*attempts/,
    ];

    return patterns.some(pattern => pattern.test(code));
  }

  /**
   * Check if code has circuit breaker
   */
  private hasCircuitBreaker(code: string): boolean {
    const patterns = [
      /circuitBreaker/i,
      /breaker\./,
      /failureCount/,
      /isOpen\s*\(/,
      /halfOpen/,
    ];

    return patterns.some(pattern => pattern.test(code));
  }

  /**
   * Calculate wrapper confidence score
   */
  private calculateWrapperConfidence(features: WrapperInfo['features']): number {
    let score = 40; // Base score for wrapping fetch/axios

    if (features.hasErrorHandling) score += 30;
    if (features.hasTimeout) score += 15;
    if (features.hasRetry) score += 10;
    if (features.hasCircuitBreaker) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Check if call site uses a wrapper
   */
  checkCallSite(
    node: ts.CallExpression,
    sourceFile: ts.SourceFile
  ): WrapperCallSite | null {
    const expression = node.expression;

    // Get function name
    let functionName: string;
    if (ts.isIdentifier(expression)) {
      functionName = expression.text;
    } else if (ts.isPropertyAccessExpression(expression)) {
      const object = expression.expression.getText();
      const property = expression.name.text;
      functionName = `${object}.${property}`;
    } else {
      return null;
    }

    // Check if it's a known wrapper
    const wrapper = this.wrapperRegistry.get(functionName);
    if (wrapper) {
      return {
        functionName,
        importPath: wrapper.filePath,
        wrapper,
      };
    }

    // Check import path
    const importPath = this.getImportPath(node, sourceFile);
    if (importPath && this.isWrapperPath(importPath)) {
      return {
        functionName,
        importPath,
        wrapper: null, // Likely a wrapper but not analyzed yet
      };
    }

    return null;
  }

  /**
   * Get import path for a call expression
   */
  private getImportPath(node: ts.Node, sourceFile: ts.SourceFile): string | null {
    // Find import statement for this call
    const imports = sourceFile.statements.filter(ts.isImportDeclaration);

    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.moduleSpecifier;
      if (!ts.isStringLiteral(moduleSpecifier)) continue;

      const importPath = moduleSpecifier.text;
      
      // Check if this import contains the function
      if (importDecl.importClause?.namedBindings) {
        const bindings = importDecl.importClause.namedBindings;
        if (ts.isNamedImports(bindings)) {
          const hasFunction = bindings.elements.some(
            el => el.name.text === node.getText()
          );
          if (hasFunction) return importPath;
        }
      }
    }

    return null;
  }

  /**
   * Check if import path likely contains wrapper
   */
  private isWrapperPath(importPath: string): boolean {
    const wrapperPatterns = [
      /\/lib\/(http|fetch|api|request|client)/,
      /\/utils\/(http|fetch|api|request)/,
      /\/services\/(http|fetch|api)/,
      /@\/(lib|utils)\/(http|fetch|api)/,
    ];

    return wrapperPatterns.some(pattern => pattern.test(importPath));
  }

  /**
   * Get wrapper info by name
   */
  getWrapper(name: string): WrapperInfo | undefined {
    return this.wrapperRegistry.get(name);
  }

  /**
   * Get all registered wrappers
   */
  getAllWrappers(): WrapperInfo[] {
    return Array.from(this.wrapperRegistry.values());
  }
}

/**
 * Factory function for easy usage
 */
export async function createWrapperDetectionSystem(
  workspace: string
): Promise<WrapperDetectionSystem> {
  const system = new WrapperDetectionSystem();
  await system.buildRegistry(workspace);
  return system;
}
