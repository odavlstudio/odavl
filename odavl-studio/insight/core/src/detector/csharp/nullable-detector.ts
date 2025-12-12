/**
 * @fileoverview Detects nullable reference type issues in C#
 * C# 8.0+ introduced nullable reference types for null safety
 */

import { CSharpBaseDetector, type CSharpDetectorOptions, type CSharpIssue } from './csharp-base-detector';
import type { DetectorResult } from '../../types';

export class NullableDetector extends CSharpBaseDetector {
  constructor(options: CSharpDetectorOptions = {}) {
    super(options);
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isCSharpFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'nullable' };
    }

    const issues: CSharpIssue[] = [];
    const lines = content.split('\n');

    // Check if nullable is enabled
    const nullableEnabled = /<Nullable>enable<\/Nullable>/.test(content) || 
                           /#nullable enable/.test(content);

    if (!nullableEnabled && !this.isCSharpTestFile(filePath)) {
      issues.push(
        this.createIssue(
          'nullable',
          'Nullable reference types not enabled - add #nullable enable',
          filePath,
          1,
          0,
          'info',
          'nullable-detector',
          'CS8600',
          'Add #nullable enable at top of file or <Nullable>enable</Nullable> to .csproj'
        )
      );
    }

    // Check for null-forgiving operator abuse
    this.detectNullForgivingAbuse(lines, filePath, issues);

    // Check for missing null checks
    this.detectMissingNullChecks(lines, filePath, issues);

    // Check for nullable value types without value check
    this.detectNullableValueTypes(lines, filePath, issues);

    // Check for implicit nullable conversions
    this.detectImplicitNullable(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'nullable',
    };
  }

  /**
   * Detect excessive use of ! (null-forgiving operator)
   */
  private detectNullForgivingAbuse(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    let nullForgivingCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: variable! or method()!
      const matches = line.match(/\w+!/g);
      if (matches) {
        nullForgivingCount += matches.length;

        for (const match of matches) {
          issues.push(
            this.createIssue(
              'nullable',
              `Null-forgiving operator '!' on '${match}' - add proper null check`,
              filePath,
              i + 1,
              line.indexOf(match),
              'high',
              'nullable-detector',
              'CS8602',
              'Replace with if (value != null) or use ?. operator'
            )
          );
        }
      }
    }

    if (nullForgivingCount > 5) {
      issues.push(
        this.createIssue(
          'nullable',
          `Excessive null-forgiving operators (${nullForgivingCount}) - review nullable design`,
          filePath,
          1,
          0,
          'info',
          'nullable-detector',
          undefined,
          'Consider making types nullable (T?) or using proper null checks'
        )
      );
    }
  }

  /**
   * Detect potential null reference without check
   */
  private detectMissingNullChecks(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: parameter.Method() or field.Property without null check
      const memberAccess = line.match(/(\w+)\.(\w+)/g);
      if (memberAccess) {
        for (const access of memberAccess) {
          const [varName] = access.split('.');
          
          // Check if variable is nullable type
          let isNullable = false;
          for (let j = Math.max(0, i - 10); j < i; j++) {
            if (new RegExp(`\\b${varName}\\?\\s*=|\\?\\s+${varName}\\s*=`).test(lines[j])) {
              isNullable = true;
              break;
            }
          }

          if (isNullable) {
            // Check if there's a null check before this line
            let hasNullCheck = false;
            for (let j = Math.max(0, i - 3); j < i; j++) {
              if (new RegExp(`${varName}\\s*[!=]=\\s*null|${varName}\\s+is\\s+not\\s+null`).test(lines[j])) {
                hasNullCheck = true;
                break;
              }
            }

            if (!hasNullCheck && !/\?\./.test(line)) {
              issues.push(
                this.createIssue(
                  'nullable',
                  `Possible null reference on '${varName}' - add null check`,
                  filePath,
                  i + 1,
                  line.indexOf(access),
                  'high',
                  'nullable-detector',
                  'CS8602',
                  `Use ${varName}?. or add: if (${varName} != null)`
                )
              );
            }
          }
        }
      }
    }
  }

  /**
   * Detect nullable value types without .HasValue check
   */
  private detectNullableValueTypes(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: int? x = ...; ... x.Value
      const nullableMatch = line.match(/(?:int|long|double|float|decimal|bool|DateTime)\?\s+(\w+)/);
      if (nullableMatch) {
        const varName = nullableMatch[1];
        
        // Look for .Value access without .HasValue check
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          if (new RegExp(`${varName}\\.Value\\b`).test(lines[j])) {
            // Check for HasValue in between
            let hasValueCheck = false;
            for (let k = i; k < j; k++) {
              if (new RegExp(`${varName}\\.HasValue`).test(lines[k])) {
                hasValueCheck = true;
                break;
              }
            }

            if (!hasValueCheck) {
              issues.push(
                this.createIssue(
                  'nullable',
                  `Accessing .Value on nullable '${varName}' without .HasValue check`,
                  filePath,
                  j + 1,
                  lines[j].indexOf('.Value'),
                  'critical',
                  'nullable-detector',
                  'CS8629',
                  `Add: if (${varName}.HasValue) { var value = ${varName}.Value; }`
                )
              );
            }
          }
        }
      }
    }
  }

  /**
   * Detect implicit nullable conversions
   */
  private detectImplicitNullable(
    lines: string[],
    filePath: string,
    issues: CSharpIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Pattern: string x = GetNullableString(); (where GetNullableString returns string?)
      const assignMatch = line.match(/\b(string|object|class)\s+(\w+)\s*=\s*(\w+)\(/);
      if (assignMatch && !/\?/.test(assignMatch[1])) {
        const [, type, varName, methodName] = assignMatch;
        
        issues.push(
          this.createIssue(
            'nullable',
            `Possible null assignment to non-nullable '${varName}' - declare as ${type}?`,
            filePath,
            i + 1,
            line.indexOf(assignMatch[0]),
            'high',
            'nullable-detector',
            'CS8600',
            `Change to: ${type}? ${varName} = ${methodName}();`
          )
        );
      }
    }
  }
}
