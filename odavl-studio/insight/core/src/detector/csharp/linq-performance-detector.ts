/**
 * @fileoverview Detects LINQ performance issues in C#
 * LINQ is elegant but can be slow if misused
 */

import { CSharpBaseDetector, type CSharpDetectorOptions, type CSharpIssue } from './csharp-base-detector';
import type { DetectorResult } from '../../types';

export class LinqPerformanceDetector extends CSharpBaseDetector {
  constructor(options: CSharpDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isCSharpFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'linq-performance' };
    }

    const issues: CSharpIssue[] = [];
    const lines = content.split('\n');

    // Check for multiple enumeration
    this.detectMultipleEnumeration(lines, filePath, issues);

    // Check for Count() when Length/Count property exists
    this.detectCountVsLength(lines, filePath, issues);

    // Check for Any() existence check before Count()
    this.detectAnyBeforeCount(lines, filePath, issues);

    // Check for FirstOrDefault() + null check vs Find()
    this.detectFirstOrDefaultCheck(lines, filePath, issues);

    // Check for ToList() in loops
    this.detectToListInLoops(lines, filePath, issues);

    // Check for Select().Where() instead of Where().Select()
    this.detectSelectBeforeWhere(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'linq-performance',
    };
  }

  /**
   * Detect multiple enumeration of IEnumerable
   */
  private detectMultipleEnumeration(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    const enumerableVars = new Map<string, number>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Track IEnumerable assignments
      const enumerableMatch = line.match(/(?:var|IEnumerable<\w+>)\s+(\w+)\s*=.*(?:Where|Select|OrderBy)/);
      if (enumerableMatch) {
        const varName = enumerableMatch[1];
        enumerableVars.set(varName, 0);
      }

      // Track usage of tracked variables
      for (const [varName, useCount] of enumerableVars.entries()) {
        const usageRegex = new RegExp(`\\b${varName}\\.(Count|ToList|ToArray|First|Any|Sum)`, 'g');
        const matches = line.match(usageRegex);
        if (matches) {
          const newCount = useCount + matches.length;
          enumerableVars.set(varName, newCount);

          if (newCount > 1) {
            issues.push(
              this.createIssue(
                'linq',
                `Multiple enumeration of '${varName}' detected - call .ToList() once`,
                filePath,
                i + 1,
                line.indexOf(varName),
                'high',
                'linq-performance-detector',
                'CA1851',
                `var list = ${varName}.ToList(); // Enumerate once`
              )
            );
          }
        }
      }
    }
  }

  /**
   * Detect .Count() when .Length or .Count property exists
   */
  private detectCountVsLength(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: array.Count() or list.Count()
      if (/(?:array|list|\[\])\.Count\(\)/.test(line)) {
        issues.push(
          this.createIssue(
            'linq',
            'Use .Count or .Length property instead of .Count() method',
            filePath,
            i + 1,
            line.indexOf('.Count()'),
            'info',
            'linq-performance-detector',
            'CA1829',
            'Replace .Count() with .Count or .Length (O(1) vs O(n))'
          )
        );
      }
    }
  }

  /**
   * Detect Any() existence check before Count()
   */
  private detectAnyBeforeCount(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: if (collection.Count() > 0)
      if (/\.Count\(\)\s*[>!=]=\s*0/.test(line)) {
        issues.push(
          this.createIssue(
            'linq',
            'Use .Any() instead of .Count() > 0 for existence check',
            filePath,
            i + 1,
            line.indexOf('.Count()'),
            'info',
            'linq-performance-detector',
            'CA1860',
            'Replace .Count() > 0 with .Any() (stops at first match)'
          )
        );
      }

      // Pattern: if (!collection.Any()) collection.Count()
      if (/!.*\.Any\(\)/.test(line)) {
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          if (/\.Count\(\)/.test(lines[j])) {
            issues.push(
              this.createIssue(
                'linq',
                'Redundant .Any() check before .Count() - remove .Any()',
                filePath,
                i + 1,
                line.indexOf('.Any()'),
                'info',
                'linq-performance-detector',
                undefined,
                'Check .Count() directly'
              )
            );
            break;
          }
        }
      }
    }
  }

  /**
   * Detect FirstOrDefault() + null check vs Find()
   */
  private detectFirstOrDefaultCheck(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: var x = list.FirstOrDefault(predicate); if (x != null)
      const firstMatch = line.match(/(\w+)\s*=.*\.FirstOrDefault\(/);
      if (firstMatch) {
        const varName = firstMatch[1];
        
        // Check next few lines for null check
        for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
          if (new RegExp(`${varName}\\s*[!=]=\\s*null`).test(lines[j])) {
            issues.push(
              this.createIssue(
                'linq',
                'Use Find() or TryGetValue() instead of FirstOrDefault() + null check',
                filePath,
                i + 1,
                line.indexOf('.FirstOrDefault'),
                'info',
                'linq-performance-detector',
                undefined,
                'Replace with .Find() or use pattern matching: if (list.FirstOrDefault() is var x)'
              )
            );
            break;
          }
        }
      }
    }
  }

  /**
   * Detect ToList() called in loop
   */
  private detectToListInLoops(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    let inLoop = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/\b(for|foreach|while)\b/.test(line)) {
        inLoop = true;
      } else if (inLoop && /^\s*\}/.test(line)) {
        inLoop = false;
      }

      if (inLoop && /\.ToList\(\)|\.ToArray\(\)/.test(line)) {
        issues.push(
          this.createIssue(
            'linq',
            'ToList()/ToArray() in loop - move outside loop if possible',
            filePath,
            i + 1,
            line.search(/\.To(?:List|Array)/),
            'high',
            'linq-performance-detector',
            'CA1851',
            'Materialize collection once before loop'
          )
        );
      }
    }
  }

  /**
   * Detect Select().Where() when Where().Select() is more efficient
   */
  private detectSelectBeforeWhere(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: .Select(...).Where(...)
      if (/\.Select\([^)]+\)\.Where\(/.test(line)) {
        issues.push(
          this.createIssue(
            'linq',
            'Use .Where().Select() instead of .Select().Where() - filter first',
            filePath,
            i + 1,
            line.indexOf('.Select'),
            'info',
            'linq-performance-detector',
            undefined,
            'Swap order: .Where() filters fewer items before projection'
          )
        );
      }
    }
  }
}
