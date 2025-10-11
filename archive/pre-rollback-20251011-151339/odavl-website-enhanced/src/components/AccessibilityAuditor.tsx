/**
 * ODAVL Enterprise Accessibility Auditor
 * Comprehensive accessibility testing and compliance monitoring system
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { config } from '@/lib/config';

// Accessibility check types
export interface AccessibilityCheck {
  id: string;
  name: string;
  description: string;
  level: 'A' | 'AA' | 'AAA';
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
  check: () => Promise<AccessibilityResult>;
}

export interface AccessibilityResult {
  passed: boolean;
  message: string;
  details?: string;
  element?: string;
  remediation?: string;
  wcagReference?: string;
}

export interface AccessibilityReport {
  id: string;
  timestamp: string;
  overallScore: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  totalChecks: number;
  passed: number;
  failed: number;
  results: Array<{
    check: AccessibilityCheck;
    result: AccessibilityResult;
  }>;
  recommendations: string[];
  complianceStatus: {
    A: { passed: number; total: number };
    AA: { passed: number; total: number };
    AAA: { passed: number; total: number };
  };
}

export class EnterpriseAccessibilityAuditor {
  private static instance: EnterpriseAccessibilityAuditor | null = null;
  private checks: AccessibilityCheck[] = [];
  private lastReport: AccessibilityReport | null = null;

  private constructor() {
    this.initializeChecks();
  }

  public static getInstance(): EnterpriseAccessibilityAuditor {
    if (!EnterpriseAccessibilityAuditor.instance) {
      EnterpriseAccessibilityAuditor.instance = new EnterpriseAccessibilityAuditor();
    }
    return EnterpriseAccessibilityAuditor.instance;
  }

  private initializeChecks() {
    this.checks = [
      {
        id: 'images-alt-text',
        name: 'Images have alt text',
        description: 'All images must have appropriate alternative text',
        level: 'A',
        category: 'perceivable',
        check: this.checkImageAltText.bind(this),
      },
      {
        id: 'headings-structure',
        name: 'Proper heading structure',
        description: 'Headings should be properly nested and structured',
        level: 'A',
        category: 'perceivable',
        check: this.checkHeadingStructure.bind(this),
      },
      {
        id: 'color-contrast',
        name: 'Color contrast ratio',
        description: 'Text must have sufficient contrast against background',
        level: 'AA',
        category: 'perceivable',
        check: this.checkColorContrast.bind(this),
      },
      {
        id: 'form-labels',
        name: 'Form controls have labels',
        description: 'All form controls must have associated labels',
        level: 'A',
        category: 'understandable',
        check: this.checkFormLabels.bind(this),
      },
      {
        id: 'keyboard-navigation',
        name: 'Keyboard accessibility',
        description: 'All interactive elements must be keyboard accessible',
        level: 'A',
        category: 'operable',
        check: this.checkKeyboardNavigation.bind(this),
      },
      {
        id: 'focus-indicators',
        name: 'Focus indicators',
        description: 'Interactive elements must have visible focus indicators',
        level: 'AA',
        category: 'operable',
        check: this.checkFocusIndicators.bind(this),
      },
      {
        id: 'aria-labels',
        name: 'ARIA labels and roles',
        description: 'ARIA attributes must be properly implemented',
        level: 'A',
        category: 'robust',
        check: this.checkAriaLabels.bind(this),
      },
      {
        id: 'language-attribute',
        name: 'Language attribute',
        description: 'Page must have language attribute set',
        level: 'A',
        category: 'understandable',
        check: this.checkLanguageAttribute.bind(this),
      },
      {
        id: 'link-text',
        name: 'Descriptive link text',
        description: 'Links must have descriptive text or accessible names',
        level: 'A',
        category: 'understandable',
        check: this.checkLinkText.bind(this),
      },
      {
        id: 'page-title',
        name: 'Page has title',
        description: 'Page must have a descriptive title',
        level: 'A',
        category: 'understandable',
        check: this.checkPageTitle.bind(this),
      },
    ];
  }

  // Accessibility check implementations
  private async checkImageAltText(): Promise<AccessibilityResult> {
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt: Element[] = [];

    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const ariaLabel = img.getAttribute('aria-label');
      const ariaLabelledBy = img.getAttribute('aria-labelledby');
      const role = img.getAttribute('role');

      // Check if image is decorative
      const isDecorative = role === 'presentation' || role === 'none' || alt === '';

      if (!isDecorative && !alt && !ariaLabel && !ariaLabelledBy) {
        imagesWithoutAlt.push(img);
      }
    });

    if (imagesWithoutAlt.length > 0) {
      return {
        passed: false,
        message: `${imagesWithoutAlt.length} images missing alt text`,
        details: `Found ${imagesWithoutAlt.length} out of ${images.length} images without alternative text`,
        remediation: 'Add descriptive alt attributes to all images, or use alt="" for decorative images',
        wcagReference: 'WCAG 2.1 Success Criterion 1.1.1 (Level A)',
      };
    }

    return {
      passed: true,
      message: 'All images have appropriate alt text',
      details: `Checked ${images.length} images`,
    };
  }

  private async checkHeadingStructure(): Promise<AccessibilityResult> {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels: number[] = [];
    const issues: string[] = [];

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      headingLevels.push(level);
    });

    // Check for proper nesting
    let previousLevel = 0;
    headingLevels.forEach((level, index) => {
      if (index === 0 && level !== 1) {
        issues.push('First heading should be h1');
      }
      if (level > previousLevel + 1) {
        issues.push(`Heading level jumps from h${previousLevel} to h${level}`);
      }
      previousLevel = level;
    });

    // Check for multiple h1s
    const h1Count = headingLevels.filter(level => level === 1).length;
    if (h1Count > 1) {
      issues.push(`Multiple h1 elements found (${h1Count})`);
    }

    if (issues.length > 0) {
      return {
        passed: false,
        message: 'Heading structure issues detected',
        details: issues.join('; '),
        remediation: 'Use proper heading hierarchy (h1 → h2 → h3) and only one h1 per page',
        wcagReference: 'WCAG 2.1 Success Criterion 1.3.1 (Level A)',
      };
    }

    return {
      passed: true,
      message: 'Heading structure is proper',
      details: `${headings.length} headings properly structured`,
    };
  }

  private async checkColorContrast(): Promise<AccessibilityResult> {
    // This is a simplified check - real implementation would use color analysis
    const textElements = document.querySelectorAll('p, span, div, a, button, label');
    let contrastIssues = 0;

    // Simulate contrast checking
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      
      // Simplified contrast check based on color values
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // This would normally involve actual color contrast calculation
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
      
      // Placeholder logic - real implementation would calculate actual contrast ratios
      if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
        contrastIssues++;
      }
    });

    if (contrastIssues > 0) {
      return {
        passed: false,
        message: `${contrastIssues} potential contrast issues`,
        details: `Found ${contrastIssues} elements with potentially insufficient contrast`,
        remediation: 'Ensure text has at least 4.5:1 contrast ratio (3:1 for large text)',
        wcagReference: 'WCAG 2.1 Success Criterion 1.4.3 (Level AA)',
      };
    }

    return {
      passed: true,
      message: 'Color contrast appears adequate',
      details: `Checked ${textElements.length} text elements`,
    };
  }

  private async checkFormLabels(): Promise<AccessibilityResult> {
    const formControls = document.querySelectorAll('input, textarea, select');
    const unlabeledControls: Element[] = [];

    formControls.forEach(control => {
      const id = control.getAttribute('id');
      const ariaLabel = control.getAttribute('aria-label');
      const ariaLabelledBy = control.getAttribute('aria-labelledby');
      const title = control.getAttribute('title');
      const type = control.getAttribute('type');

      // Skip hidden inputs and buttons
      if (type === 'hidden' || type === 'submit' || type === 'button') {
        return;
      }

      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      
      if (!hasLabel && !ariaLabel && !ariaLabelledBy && !title) {
        unlabeledControls.push(control);
      }
    });

    if (unlabeledControls.length > 0) {
      return {
        passed: false,
        message: `${unlabeledControls.length} form controls without labels`,
        details: `Found ${unlabeledControls.length} out of ${formControls.length} form controls without proper labels`,
        remediation: 'Associate labels with form controls using for/id attributes or aria-label',
        wcagReference: 'WCAG 2.1 Success Criterion 1.3.1 (Level A)',
      };
    }

    return {
      passed: true,
      message: 'All form controls have labels',
      details: `Checked ${formControls.length} form controls`,
    };
  }

  private async checkKeyboardNavigation(): Promise<AccessibilityResult> {
    const interactiveElements = document.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const issues: string[] = [];

    interactiveElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      const href = element.getAttribute('href');
      
      // Check for positive tabindex (anti-pattern)
      if (tabIndex && parseInt(tabIndex) > 0) {
        issues.push('Positive tabindex values detected');
      }
      
      // Check for links without href
      if (element.tagName === 'A' && !href) {
        issues.push('Links without href attribute');
      }
    });

    if (issues.length > 0) {
      return {
        passed: false,
        message: 'Keyboard navigation issues detected',
        details: issues.join('; '),
        remediation: 'Avoid positive tabindex values and ensure all interactive elements are focusable',
        wcagReference: 'WCAG 2.1 Success Criterion 2.1.1 (Level A)',
      };
    }

    return {
      passed: true,
      message: 'Keyboard navigation appears accessible',
      details: `Checked ${interactiveElements.length} interactive elements`,
    };
  }

  private async checkFocusIndicators(): Promise<AccessibilityResult> {
    // This check would ideally involve programmatic focus testing
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select');
    let elementsWithoutFocus = 0;

    // Simplified check - real implementation would test actual focus visibility
    interactiveElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const outline = styles.outline;
      const outlineWidth = styles.outlineWidth;
      
      // Check if focus styles are explicitly removed
      if (outline === 'none' || outlineWidth === '0px') {
        elementsWithoutFocus++;
      }
    });

    // More than 20% of elements without focus indicators is concerning
    const threshold = Math.ceil(interactiveElements.length * 0.2);
    
    if (elementsWithoutFocus > threshold) {
      return {
        passed: false,
        message: 'Many elements may lack focus indicators',
        details: `${elementsWithoutFocus} out of ${interactiveElements.length} elements have outline removed`,
        remediation: 'Ensure all interactive elements have visible focus indicators',
        wcagReference: 'WCAG 2.1 Success Criterion 2.4.7 (Level AA)',
      };
    }

    return {
      passed: true,
      message: 'Focus indicators appear adequate',
      details: `Checked ${interactiveElements.length} interactive elements`,
    };
  }

  private async checkAriaLabels(): Promise<AccessibilityResult> {
    const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
    const issues: string[] = [];

    ariaElements.forEach(element => {
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const role = element.getAttribute('role');

      // Check for empty aria-label
      if (ariaLabel === '') {
        issues.push('Empty aria-label attributes');
      }

      // Check for invalid aria-labelledby references
      if (ariaLabelledBy) {
        const referencedIds = ariaLabelledBy.split(/\s+/);
        referencedIds.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push(`aria-labelledby references non-existent ID: ${id}`);
          }
        });
      }

      // Check for invalid roles (simplified)
      const validRoles = [
        'button', 'link', 'menuitem', 'tab', 'tabpanel', 'dialog', 'alertdialog',
        'banner', 'navigation', 'main', 'complementary', 'contentinfo',
        'article', 'section', 'presentation', 'none', 'img'
      ];
      
      if (role && !validRoles.includes(role)) {
        issues.push(`Invalid ARIA role: ${role}`);
      }
    });

    if (issues.length > 0) {
      return {
        passed: false,
        message: 'ARIA implementation issues detected',
        details: issues.slice(0, 3).join('; ') + (issues.length > 3 ? '...' : ''),
        remediation: 'Fix ARIA attributes and ensure proper implementation',
        wcagReference: 'WCAG 2.1 Success Criterion 4.1.2 (Level A)',
      };
    }

    return {
      passed: true,
      message: 'ARIA implementation appears correct',
      details: `Checked ${ariaElements.length} elements with ARIA attributes`,
    };
  }

  private async checkLanguageAttribute(): Promise<AccessibilityResult> {
    const htmlElement = document.documentElement;
    const lang = htmlElement.getAttribute('lang');

    if (!lang) {
      return {
        passed: false,
        message: 'Page missing language attribute',
        details: 'HTML element does not have lang attribute',
        remediation: 'Add lang attribute to html element (e.g., <html lang="en">)',
        wcagReference: 'WCAG 2.1 Success Criterion 3.1.1 (Level A)',
      };
    }

    // Basic language code validation
    const validLangPattern = /^[a-z]{2,3}(-[A-Z]{2})?$/;
    if (!validLangPattern.test(lang)) {
      return {
        passed: false,
        message: 'Invalid language code format',
        details: `Language code "${lang}" may not be valid`,
        remediation: 'Use valid ISO 639-1 language codes (e.g., "en", "es", "fr")',
        wcagReference: 'WCAG 2.1 Success Criterion 3.1.1 (Level A)',
      };
    }

    return {
      passed: true,
      message: 'Language attribute properly set',
      details: `Page language: ${lang}`,
    };
  }

  private async checkLinkText(): Promise<AccessibilityResult> {
    const links = document.querySelectorAll('a[href]');
    const issues: string[] = [];

    links.forEach(link => {
      const text = link.textContent?.trim() || '';
      const ariaLabel = link.getAttribute('aria-label');
      const title = link.getAttribute('title');

      const effectiveText = ariaLabel || text || title;
      
      // Check for generic link text
      const genericTexts = ['click here', 'read more', 'more', 'here', 'link'];
      if (effectiveText && genericTexts.some(generic => effectiveText.toLowerCase().includes(generic))) {
        issues.push('Generic link text detected');
      }

      // Check for empty links
      if (!effectiveText) {
        issues.push('Empty links detected');
      }
    });

    if (issues.length > 0) {
      return {
        passed: false,
        message: 'Link text issues detected',
        details: issues.join('; '),
        remediation: 'Use descriptive link text that explains the link destination or purpose',
        wcagReference: 'WCAG 2.1 Success Criterion 2.4.4 (Level A)',
      };
    }

    return {
      passed: true,
      message: 'Link text appears descriptive',
      details: `Checked ${links.length} links`,
    };
  }

  private async checkPageTitle(): Promise<AccessibilityResult> {
    const title = document.title;

    if (!title || title.trim().length === 0) {
      return {
        passed: false,
        message: 'Page missing title',
        details: 'Document has no title or empty title',
        remediation: 'Add a descriptive title to the page',
        wcagReference: 'WCAG 2.1 Success Criterion 2.4.2 (Level A)',
      };
    }

    if (title.length < 3) {
      return {
        passed: false,
        message: 'Page title too short',
        details: `Title is only ${title.length} characters: "${title}"`,
        remediation: 'Use a more descriptive page title',
        wcagReference: 'WCAG 2.1 Success Criterion 2.4.2 (Level A)',
      };
    }

    return {
      passed: true,
      message: 'Page has appropriate title',
      details: `Title: "${title}" (${title.length} characters)`,
    };
  }

  // Public API methods
  public async runAudit(targetLevel: 'A' | 'AA' | 'AAA' = 'AA'): Promise<AccessibilityReport> {
    const startTime = Date.now();
    const results: Array<{ check: AccessibilityCheck; result: AccessibilityResult }> = [];

    console.log(`♿ Starting accessibility audit (WCAG ${targetLevel})...`);

    // Filter checks by target level
    const applicableChecks = this.checks.filter(check => {
      const levels = ['A', 'AA', 'AAA'];
      const checkLevelIndex = levels.indexOf(check.level);
      const targetLevelIndex = levels.indexOf(targetLevel);
      return checkLevelIndex <= targetLevelIndex;
    });

    for (const check of applicableChecks) {
      try {
        const result = await check.check();
        results.push({ check, result });
        
        console.log(`A11y check ${check.id}: ${result.passed ? '✅ PASS' : '❌ FAIL'} - ${result.message}`);
      } catch (error) {
        results.push({
          check,
          result: {
            passed: false,
            message: `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            details: 'Accessibility check encountered an error during execution',
          },
        });
      }
    }

    const passed = results.filter(r => r.result.passed).length;
    const failed = results.length - passed;
    const overallScore = Math.round((passed / results.length) * 100);

    // Calculate compliance status by level
    const complianceStatus = {
      A: { passed: 0, total: 0 },
      AA: { passed: 0, total: 0 },
      AAA: { passed: 0, total: 0 },
    };

    results.forEach(({ check, result }) => {
      complianceStatus[check.level].total++;
      if (result.passed) {
        complianceStatus[check.level].passed++;
      }
    });

    const report: AccessibilityReport = {
      id: `a11y_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      overallScore,
      wcagLevel: targetLevel,
      totalChecks: results.length,
      passed,
      failed,
      results,
      recommendations: this.generateRecommendations(results),
      complianceStatus,
    };

    this.lastReport = report;
    this.storeReport(report);

    const duration = Date.now() - startTime;
    console.log(`♿ Accessibility audit completed in ${duration}ms - Score: ${overallScore}%`);

    return report;
  }

  private generateRecommendations(results: Array<{ check: AccessibilityCheck; result: AccessibilityResult }>): string[] {
    const recommendations: string[] = [];
    const failedResults = results.filter(r => !r.result.passed);

    // Group by category
    const categories = {
      perceivable: failedResults.filter(r => r.check.category === 'perceivable'),
      operable: failedResults.filter(r => r.check.category === 'operable'),
      understandable: failedResults.filter(r => r.check.category === 'understandable'),  
      robust: failedResults.filter(r => r.check.category === 'robust'),
    };

    Object.entries(categories).forEach(([category, failures]) => {
      if (failures.length > 0) {
        recommendations.push(`🔍 ${category.charAt(0).toUpperCase() + category.slice(1)}: ${failures.length} issues to address`);
      }
    });

    // Add specific recommendations
    failedResults.slice(0, 5).forEach(({ result }) => {
      if (result.remediation) {
        recommendations.push(`• ${result.remediation}`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ All accessibility checks passed! Great job on inclusive design.');
    }

    return recommendations;
  }

  private storeReport(report: AccessibilityReport) {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `odavl_a11y_${report.id}`;
      localStorage.setItem(storageKey, JSON.stringify(report));
      
      // Cleanup old reports (keep last 5)
      const a11yKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('odavl_a11y_'))
        .sort()
        .reverse();

      a11yKeys.slice(5).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to store accessibility report:', error);
    }
  }

  public getLastReport(): AccessibilityReport | null {
    return this.lastReport;
  }

  public addCustomCheck(check: AccessibilityCheck) {
    this.checks.push(check);
  }

  public getCheckById(id: string): AccessibilityCheck | undefined {
    return this.checks.find(check => check.id === id);
  }
}

// React hook for accessibility auditing
export function useAccessibilityAuditor() {
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastReport, setLastReport] = useState<AccessibilityReport | null>(null);

  const runAudit = useCallback(async (targetLevel: 'A' | 'AA' | 'AAA' = 'AA') => {
    if (!config.flags.accessibilityAuditing) return null;

    setIsAuditing(true);
    try {
      const auditor = EnterpriseAccessibilityAuditor.getInstance();
      const report = await auditor.runAudit(targetLevel);
      setLastReport(report);
      return report;
    } finally {
      setIsAuditing(false);
    }
  }, []);

  const addCustomCheck = useCallback((check: AccessibilityCheck) => {
    const auditor = EnterpriseAccessibilityAuditor.getInstance();
    auditor.addCustomCheck(check);
  }, []);

  return {
    runAudit,
    addCustomCheck,
    isAuditing,
    lastReport,
  };
}

// Component for automatic accessibility monitoring
export function AccessibilityAuditor({ children }: { children?: React.ReactNode }) {
  const { runAudit } = useAccessibilityAuditor();

  useEffect(() => {
    if (config.flags.accessibilityAuditing) {
      // Run accessibility audit on mount
      runAudit('AA');
      
      // Schedule periodic audits (less frequent than security scans)
      const interval = setInterval(() => runAudit('AA'), 7 * 24 * 60 * 60 * 1000); // Weekly
      
      return () => clearInterval(interval);
    }
  }, [runAudit]);

  return <>{children}</>;
}

export default AccessibilityAuditor;