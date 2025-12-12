/**
 * @fileoverview Detects Rails-specific anti-patterns and issues
 * Rails: The most popular Ruby web framework
 */

import { RubyBaseDetector, type RubyDetectorOptions, type RubyIssue } from './ruby-base-detector';
import type { DetectorResult } from '../../types';

export class RailsDetector extends RubyBaseDetector {
  constructor(options: RubyDetectorOptions = {}) {
    super({ ...options, isRailsProject: true });
  }

  async detect(filePath: string, content: string): Promise<DetectorResult> {
    if (!this.isRubyFile(filePath)) {
      return { issues: [], duration: 0, detectorName: 'rails' };
    }

    const issues: RubyIssue[] = [];
    const lines = content.split('\n');

    // N+1 query detection
    this.detectNPlusOneQueries(lines, filePath, issues);

    // Mass assignment vulnerabilities
    this.detectMassAssignment(lines, filePath, issues);

    // SQL injection in raw queries
    this.detectSqlInjection(lines, filePath, issues);

    // Missing validations
    this.detectMissingValidations(lines, filePath, content, issues);

    // Callback hell
    this.detectCallbackHell(lines, filePath, issues);

    return {
      issues,
      duration: 0,
      detectorName: 'rails',
    };
  }

  /**
   * Detect N+1 query problems in Rails
   */
  private detectNPlusOneQueries(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: .each followed by association access
      if (/\.each\s+do\s*\|/.test(line)) {
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const innerLine = lines[j];
          
          // Association access inside loop
          if (/\w+\.(posts|comments|users|author|category)/.test(innerLine)) {
            issues.push(
              this.createIssue(
                'rails',
                'N+1 Query: Association accessed inside loop - use .includes() or .joins()',
                filePath,
                j + 1,
                innerLine.search(/\.(posts|comments|users)/), 'high' ,
                'rails-detector',
                'Rails/NPlusOne',
                'Add eager loading: User.includes(:posts).each { |user| user.posts }'
              )
            );
            break;
          }

          if (/^\s*end/.test(innerLine)) break;
        }
      }
    }
  }

  /**
   * Detect mass assignment vulnerabilities (Rails < 4)
   */
  private detectMassAssignment(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: Model.new(params[:model]) without strong parameters
      if (/\.(?:new|create|update)\s*\(\s*params\[/.test(line) && !/permit/.test(line)) {
        issues.push(
          this.createIssue(
            'rails',
            'Mass Assignment: Use strong parameters to whitelist attributes',
            filePath,
            i + 1,
            line.indexOf('params'), 'critical' ,
            'rails-detector',
            'Rails/MassAssignment',
            'Use: params.require(:user).permit(:name, :email)'
          )
        );
      }
    }
  }

  /**
   * Detect SQL injection in raw queries
   */
  private detectSqlInjection(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Pattern: where("string interpolation #{}")
      if (/\.where\s*\(\s*["'].*#\{/.test(line)) {
        issues.push(
          this.createIssue(
            'rails',
            'SQL Injection: String interpolation in where clause',
            filePath,
            i + 1,
            line.indexOf('.where'), 'critical' ,
            'rails-detector',
            'Rails/SqlInjection',
            'Use placeholders: .where("name = ?", params[:name])'
          )
        );
      }

      // Pattern: find_by_sql with interpolation
      if (/find_by_sql\s*\(.*#\{/.test(line)) {
        issues.push(
          this.createIssue(
            'rails',
            'SQL Injection: String interpolation in find_by_sql',
            filePath,
            i + 1,
            line.indexOf('find_by_sql'), 'critical' ,
            'rails-detector',
            'Rails/SqlInjection',
            'Use bind parameters: find_by_sql([sql, param1, param2])'
          )
        );
      }
    }
  }

  /**
   * Detect missing model validations
   */
  private detectMissingValidations(
    lines: string[],
    filePath: string,
    content: string,
    issues: RubyIssue[]
  ): void {
    // Check if file is a model
    if (!/class\s+\w+\s*<\s*(?:ApplicationRecord|ActiveRecord::Base)/.test(content)) {
      return;
    }

    let hasValidations = false;

    for (const line of lines) {
      if (/validates?|validate/.test(line)) {
        hasValidations = true;
        break;
      }
    }

    if (!hasValidations && !/concerns\//.test(filePath)) {
      issues.push(
        this.createIssue(
          'rails',
          'Missing Validations: ActiveRecord model without validations',
          filePath,
          1,
          0, 'high' ,
          'rails-detector',
          'Rails/MissingValidations',
          'Add validations: validates :name, presence: true'
        )
      );
    }
  }

  /**
   * Detect callback hell in models
   */
  private detectCallbackHell(
    lines: string[],
    filePath: string,
    issues: RubyIssue[]
  ): void {
    let callbackCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (/before_|after_|around_/.test(line)) {
        callbackCount++;
      }
    }

    if (callbackCount > 5) {
      issues.push(
        this.createIssue(
          'rails',
          `Callback Hell: ${callbackCount} callbacks - consider service objects`,
          filePath,
          1,
          0, 'high' ,
          'rails-detector',
          'Rails/CallbackHell',
          'Refactor complex callbacks into service objects or concerns'
        )
      );
    }
  }
}
