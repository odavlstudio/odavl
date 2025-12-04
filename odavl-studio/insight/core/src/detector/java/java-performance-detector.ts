import { Detector } from '../base-detector.js';
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
 * JavaPerformanceDetector - Detects common performance issues in Java code
 * 
 * Patterns detected:
 * 1. Boxing/unboxing in loops (Integer/Double instead of int/double)
 * 2. Collection without pre-allocation (ArrayList/HashMap/HashSet)
 * 3. Regex pattern compilation in loops (Pattern.compile/Pattern.matches)
 * 4. String concatenation in loops (+ or +=)
 * 
 * Target performance: < 100ms per file
 * Target accuracy: 95%+
 */
export class JavaPerformanceDetector implements Detector {
  name = 'java-performance';
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
      // Ignore errors (e.g., permission denied)
    }

    return files;
  }

  private async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  private async analyzeFile(filePath: string): Promise<JavaIssue[]> {
    const issues: JavaIssue[] = [];

    try {
      const ast = await this.parser.parseFile(filePath);
      const content = await this.readFile(filePath);
      const lines = content.split('\n');

      for (const classDecl of ast.classes) {
        // Check each method for performance issues
        for (const method of classDecl.methods) {
          const methodStartLine = method.line;
          const methodEndLine = methodStartLine + method.bodyLines - 1;
          const methodBody = lines.slice(methodStartLine - 1, methodEndLine).join('\n');

          // Pattern 1: Boxing/unboxing in loops
          const boxingIssues = this.checkBoxingInLoops(methodBody, methodStartLine, filePath);
          issues.push(...boxingIssues);

          // Pattern 2: Collection without pre-allocation
          const collectionIssues = this.checkCollectionPreallocation(
            methodBody,
            methodStartLine,
            filePath
          );
          issues.push(...collectionIssues);

          // Pattern 3: Regex pattern compilation in loops
          const regexIssues = this.checkRegexInLoops(methodBody, methodStartLine, filePath);
          issues.push(...regexIssues);

          // Pattern 4: String concatenation in loops
          const stringConcatIssues = this.checkStringConcatenationInLoops(
            methodBody,
            methodStartLine,
            filePath
          );
          issues.push(...stringConcatIssues);
        }
      }
    } catch (error) {
      // Parse errors are ignored
    }

    return issues;
  }

  /**
   * Pattern 1: Boxing/Unboxing in Loops
   * Detects wrapper types (Integer, Double, Long) used as loop variables
   */
  private checkBoxingInLoops(
    code: string,
    startLine: number,
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];
    const lines = code.split('\n');

    // Pattern 1a: for (Integer i = 0; i < limit; i++)
    const boxedForLoopRegex =
      /for\s*\(\s*(Integer|Double|Long|Float|Boolean|Character|Byte|Short)\s+(\w+)\s*=\s*[^;]+;\s*[^;]+;\s*[^)]+\)/g;

    let match;
    while ((match = boxedForLoopRegex.exec(code)) !== null) {
      const wrapperType = match[1];
      const varName = match[2];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      const primitiveType = this.getPrimitiveType(wrapperType);

      issues.push({
        file,
        line,
        column: 0,
        severity: 'warning',
        message: `Boxing in loop: loop variable '${varName}' uses wrapper type '${wrapperType}' instead of primitive '${primitiveType}'`,
        rule: 'PERFORMANCE-001',
        category: 'BOXING-IN-LOOP',
        suggestion: `Use primitive type '${primitiveType} ${varName}' instead of '${wrapperType} ${varName}' to avoid boxing/unboxing overhead`,
        autoFixable: true,
        fixCode: match[0].replace(wrapperType, primitiveType),
      });
    }

    // Pattern 1b: for (Integer value : array) - enhanced for with wrapper
    const enhancedForBoxingRegex =
      /for\s*\(\s*(Integer|Double|Long|Float|Boolean|Character|Byte|Short)\s+(\w+)\s*:\s*(\w+)\s*\)/g;

    while ((match = enhancedForBoxingRegex.exec(code)) !== null) {
      const wrapperType = match[1];
      const varName = match[2];
      const arrayName = match[3];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      // Check if array is primitive type (e.g., int[])
      const arrayDeclarationRegex = new RegExp(
        `(int|double|long|float|boolean|char|byte|short)\\[\\]\\s+${arrayName}`
      );
      if (arrayDeclarationRegex.test(code)) {
        const primitiveType = this.getPrimitiveType(wrapperType);

        issues.push({
          file,
          line,
          column: 0,
          severity: 'warning',
          message: `Auto-boxing in enhanced for-loop: '${varName}' uses wrapper type '${wrapperType}' for primitive array '${arrayName}'`,
          rule: 'PERFORMANCE-001',
          category: 'BOXING-IN-LOOP',
          suggestion: `Use primitive type '${primitiveType} ${varName}' to avoid auto-boxing`,
          autoFixable: true,
          fixCode: match[0].replace(wrapperType, primitiveType),
        });
      }
      
      // Check if collection is wrapper type (e.g., List<Double>)
      const collectionDeclarationRegex = new RegExp(
        `List<${wrapperType}>\\s+${arrayName}`
      );
      if (collectionDeclarationRegex.test(code)) {
        // This is intentional - iterating over List<Double> requires Double
        // But flag if there's unboxing in the loop body (comparison, arithmetic)
        const loopBodyMatch = code.substring(match.index).match(/\{([^}]*)\}/s);
        if (loopBodyMatch) {
          const loopBody = loopBodyMatch[1];
          // Check for unboxing operations: comparison (>, <, ==), arithmetic (+, -, *, /)
          const unboxingOps = /[><=+\-*\/]/g;
          if (unboxingOps.test(loopBody) && loopBody.includes(varName)) {
            issues.push({
              file,
              line,
              column: 0,
              severity: 'info',
              message: `Enhanced for-loop iterates over List<${wrapperType}>, causing unboxing on each iteration`,
              rule: 'PERFORMANCE-001',
              category: 'BOXING-IN-LOOP',
              suggestion: `Consider using primitive stream: ${arrayName}.stream().mapToDouble(Double::doubleValue) or convert to primitive array`,
              autoFixable: false,
            });
          }
        }
      }
    }

    // Pattern 1c: Integer parsed = Integer.parseInt(value); in loop
    const parseWithBoxingRegex =
      /(Integer|Double|Long|Float)\s+(\w+)\s*=\s*(Integer\.parseInt|Double\.parseDouble|Long\.parseLong|Float\.parseFloat)\s*\(/g;

    while ((match = parseWithBoxingRegex.exec(code)) !== null) {
      const wrapperType = match[1];
      const varName = match[2];
      const parseMethod = match[3];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      // Check if inside loop
      const codeBeforeMatch = code.substring(0, match.index);
      const loopKeywords = ['for', 'while', 'do'];
      const inLoop = loopKeywords.some((keyword) => {
        const lastLoopIndex = codeBeforeMatch.lastIndexOf(keyword);
        if (lastLoopIndex === -1) return false;

        // Check if there's a closing brace after the loop but before this line
        const codeAfterLoop = code.substring(lastLoopIndex, match.index);
        const openBraces = (codeAfterLoop.match(/{/g) || []).length;
        const closeBraces = (codeAfterLoop.match(/}/g) || []).length;
        return openBraces > closeBraces; // Still inside loop
      });

      if (inLoop) {
        const primitiveType = this.getPrimitiveType(wrapperType);

        issues.push({
          file,
          line,
          column: 0,
          severity: 'warning',
          message: `Unnecessary boxing in loop: '${parseMethod}' returns primitive '${primitiveType}', but assigned to wrapper '${wrapperType}'`,
          rule: 'PERFORMANCE-001',
          category: 'BOXING-IN-LOOP',
          suggestion: `Use primitive type '${primitiveType} ${varName}' instead of '${wrapperType} ${varName}'`,
          autoFixable: true,
          fixCode: match[0].replace(wrapperType, primitiveType),
        });
      }
    }

    return issues;
  }

  /**
   * Pattern 2: Collection Without Pre-allocation
   * Detects ArrayList/HashMap/HashSet without initial capacity before loops
   */
  private checkCollectionPreallocation(
    code: string,
    startLine: number,
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 2a: new ArrayList<>() without capacity, followed by loop with add()
    const arrayListRegex =
      /(?:List|ArrayList)<[^>]+>\s+(\w+)\s*=\s*new\s+ArrayList<[^>]*>\s*\(\s*\)\s*;/g;

    let match;
    while ((match = arrayListRegex.exec(code)) !== null) {
      const varName = match[1];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      // Check if followed by loop with add()
      const codeAfterDeclaration = code.substring(match.index + match[0].length);
      const loopWithAddRegex = new RegExp(
        `for\\s*\\([^)]+\\)\\s*\\{[^}]*${varName}\\.add\\(`,
        's'
      );

      if (loopWithAddRegex.test(codeAfterDeclaration)) {
        issues.push({
          file,
          line,
          column: 0,
          severity: 'warning',
          message: `ArrayList '${varName}' created without initial capacity before loop with add()`,
          rule: 'PERFORMANCE-002',
          category: 'COLLECTION-PREALLOCATION',
          suggestion: `Pre-allocate capacity: new ArrayList<>(expectedSize) to avoid multiple resizes`,
          autoFixable: false, // Requires knowing expected size
        });
      }
    }

    // Pattern 2b: new HashMap<>() without capacity, followed by loop with put()
    const hashMapRegex =
      /(?:Map|HashMap)<[^>]+,\s*[^>]+>\s+(\w+)\s*=\s*new\s+HashMap<[^>]*>\s*\(\s*\)\s*;/g;

    while ((match = hashMapRegex.exec(code)) !== null) {
      const varName = match[1];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      const codeAfterDeclaration = code.substring(match.index + match[0].length);
      const loopWithPutRegex = new RegExp(
        `for\\s*\\([^)]+\\)\\s*\\{[^}]*${varName}\\.put\\(`,
        's'
      );

      if (loopWithPutRegex.test(codeAfterDeclaration)) {
        issues.push({
          file,
          line,
          column: 0,
          severity: 'warning',
          message: `HashMap '${varName}' created without initial capacity before loop with put()`,
          rule: 'PERFORMANCE-002',
          category: 'COLLECTION-PREALLOCATION',
          suggestion: `Pre-allocate capacity: new HashMap<>((int)(expectedSize / 0.75) + 1) to avoid rehashing`,
          autoFixable: false,
        });
      }
    }

    // Pattern 2c: new HashSet<>() without capacity, followed by loop with add()
    const hashSetRegex =
      /(?:Set|HashSet)<[^>]+>\s+(\w+)\s*=\s*new\s+HashSet<[^>]*>\s*\(\s*\)\s*;/g;

    while ((match = hashSetRegex.exec(code)) !== null) {
      const varName = match[1];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      const codeAfterDeclaration = code.substring(match.index + match[0].length);
      const loopWithAddRegex = new RegExp(
        `for\\s*\\([^)]+\\)\\s*\\{[^}]*${varName}\\.add\\(`,
        's'
      );

      if (loopWithAddRegex.test(codeAfterDeclaration)) {
        issues.push({
          file,
          line,
          column: 0,
          severity: 'warning',
          message: `HashSet '${varName}' created without initial capacity before loop with add()`,
          rule: 'PERFORMANCE-002',
          category: 'COLLECTION-PREALLOCATION',
          suggestion: `Pre-allocate capacity: new HashSet<>((int)(expectedSize / 0.75) + 1) to avoid rehashing`,
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Pattern 3: Regex Pattern Compilation in Loops
   * Detects Pattern.compile() or Pattern.matches() inside loops
   */
  private checkRegexInLoops(
    code: string,
    startLine: number,
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 3a: Pattern.matches("regex", input) inside loop
    const patternMatchesRegex = /Pattern\.matches\s*\(\s*"([^"]+)"\s*,\s*(\w+)\s*\)/g;

    let match;
    while ((match = patternMatchesRegex.exec(code)) !== null) {
      const regex = match[1];
      const input = match[2];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      // Check if inside loop
      const codeBeforeMatch = code.substring(0, match.index);
      if (this.isInsideLoop(codeBeforeMatch, code, match.index)) {
        issues.push({
          file,
          line,
          column: 0,
          severity: 'warning',
          message: `Pattern.matches() compiles regex "${regex}" on every loop iteration`,
          rule: 'PERFORMANCE-003',
          category: 'REGEX-IN-LOOP',
          suggestion: `Compile pattern once outside loop: Pattern pattern = Pattern.compile("${regex}"); then use pattern.matcher(${input}).matches()`,
          autoFixable: false, // Requires code restructuring
        });
      }
    }

    // Pattern 3b: Pattern.compile("regex") inside loop
    const patternCompileRegex = /Pattern\.compile\s*\(\s*"([^"]+)"\s*\)/g;

    while ((match = patternCompileRegex.exec(code)) !== null) {
      const regex = match[1];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      const codeBeforeMatch = code.substring(0, match.index);
      if (this.isInsideLoop(codeBeforeMatch, code, match.index)) {
        issues.push({
          file,
          line,
          column: 0,
          severity: 'warning',
          message: `Pattern.compile() compiles regex "${regex}" on every loop iteration`,
          rule: 'PERFORMANCE-003',
          category: 'REGEX-IN-LOOP',
          suggestion: `Move Pattern.compile("${regex}") outside the loop or use a static final Pattern`,
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Pattern 4: String Concatenation in Loops
   * Detects string += or + inside loops (should use StringBuilder)
   */
  private checkStringConcatenationInLoops(
    code: string,
    startLine: number,
    file: string
  ): JavaIssue[] {
    const issues: JavaIssue[] = [];

    // Pattern 4a: str += "..." inside loop
    const stringConcatRegex = /(\w+)\s*\+=\s*[^;]+;/g;

    let match;
    while ((match = stringConcatRegex.exec(code)) !== null) {
      const varName = match[1];
      const lineOffset = code.substring(0, match.index).split('\n').length - 1;
      const line = startLine + lineOffset;

      // Check if variable is String type
      const stringDeclarationRegex = new RegExp(`String\\s+${varName}\\s*=`);
      if (!stringDeclarationRegex.test(code)) {
        continue; // Not a String variable
      }

      // Check if inside loop
      const codeBeforeMatch = code.substring(0, match.index);
      if (this.isInsideLoop(codeBeforeMatch, code, match.index)) {
        issues.push({
          file,
          line,
          column: 0,
          severity: 'warning',
          message: `String concatenation with += inside loop creates new String object each iteration`,
          rule: 'PERFORMANCE-004',
          category: 'STRING-CONCAT-IN-LOOP',
          suggestion: `Use StringBuilder instead: StringBuilder ${varName} = new StringBuilder(); then ${varName}.append(...)`,
          autoFixable: false, // Requires code restructuring
        });
      }
    }

    // Pattern 4b: String str = ""; followed by loop with str += (stricter check)
    const stringInitRegex = /String\s+(\w+)\s*=\s*"[^"]*"\s*;/g;

    while ((match = stringInitRegex.exec(code)) !== null) {
      const varName = match[1];
      const declarationIndex = match.index;
      const lineOffset = code.substring(0, declarationIndex).split('\n').length - 1;
      const line = startLine + lineOffset;

      // Check if followed by loop with += on this variable
      const codeAfterDeclaration = code.substring(declarationIndex + match[0].length);
      const loopWithConcatRegex = new RegExp(
        `for\\s*\\([^)]+\\)\\s*\\{[^}]*${varName}\\s*\\+=`,
        's'
      );

      if (loopWithConcatRegex.test(codeAfterDeclaration)) {
        // Only report if not already reported by Pattern 4a
        const alreadyReported = issues.some(
          (issue) =>
            issue.line >= line &&
            issue.line <= line + 10 &&
            issue.category === 'STRING-CONCAT-IN-LOOP'
        );

        if (!alreadyReported) {
          issues.push({
            file,
            line,
            column: 0,
            severity: 'warning',
            message: `String '${varName}' initialized and concatenated in loop using +=`,
            rule: 'PERFORMANCE-004',
            category: 'STRING-CONCAT-IN-LOOP',
            suggestion: `Replace with StringBuilder: StringBuilder ${varName} = new StringBuilder(); then use ${varName}.append(...)`,
            autoFixable: false,
          });
        }
      }
    }

    return issues;
  }

  // ==================== Helper Methods ====================

  private getPrimitiveType(wrapperType: string): string {
    const mapping: Record<string, string> = {
      Integer: 'int',
      Double: 'double',
      Long: 'long',
      Float: 'float',
      Boolean: 'boolean',
      Character: 'char',
      Byte: 'byte',
      Short: 'short',
    };
    return mapping[wrapperType] || wrapperType;
  }

  private isInsideLoop(codeBefore: string, fullCode: string, matchIndex: number): boolean {
    const loopKeywords = ['for', 'while', 'do'];

    for (const keyword of loopKeywords) {
      const lastLoopIndex = codeBefore.lastIndexOf(keyword);
      if (lastLoopIndex === -1) continue;

      // Check if there's a closing brace after the loop but before matchIndex
      const codeAfterLoop = fullCode.substring(lastLoopIndex, matchIndex);
      const openBraces = (codeAfterLoop.match(/{/g) || []).length;
      const closeBraces = (codeAfterLoop.match(/}/g) || []).length;

      if (openBraces > closeBraces) {
        return true; // Still inside loop
      }
    }

    return false;
  }
}
