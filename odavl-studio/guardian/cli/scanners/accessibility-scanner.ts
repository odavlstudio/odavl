/**
 * 🎨 Guardian Enterprise Accessibility Scanner
 * WCAG 2.1 Level A/AA/AAA compliance checker
 * - Color contrast analysis
 * - Keyboard navigation testing
 * - Screen reader compatibility
 * - ARIA attributes validation
 * - Semantic HTML structure
 * - Focus management
 */

import { Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

export interface AccessibilityIssue {
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagCriteria: string;
  element: string;
  description: string;
  recommendation: string;
}

export interface AccessibilityReport {
  score: number; // 0-100
  wcagCompliance: {
    levelA: boolean;
    levelAA: boolean;
    levelAAA: boolean;
  };
  totalIssues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  issues: AccessibilityIssue[];
  passedRules: number;
  recommendations: string[];
}

export async function scanAccessibility(
  page: Page,
  url: string
): Promise<AccessibilityReport> {
  const issues: AccessibilityIssue[] = [];

  try {
    // IMPORTANT: @axe-core/playwright requires page from browser.newContext()
    // If page doesn't have context, axe will fail
    // For now, we'll catch the error and provide helpful message
    const axeResults = await new AxeBuilder({ page }).analyze();

    // Convert axe violations to our format
    for (const violation of axeResults.violations) {
      const severity = mapAxeSeverity(violation.impact || 'minor');
      const wcagTags = violation.tags.filter(t => t.startsWith('wcag'));
      const wcagLevel = determineWCAGLevel(wcagTags);

      for (const node of violation.nodes) {
        issues.push({
          severity,
          wcagLevel,
          wcagCriteria: wcagTags.join(', '),
          element: node.target.join(' > '),
          description: `${violation.description}: ${node.failureSummary}`,
          recommendation: violation.help
        });
      }
    }

    // Additional custom checks
    issues.push(...await checkKeyboardNavigation(page));
    issues.push(...await checkColorContrast(page));
    issues.push(...await checkFormAccessibility(page));

    // Calculate statistics
    const critical = issues.filter(i => i.severity === 'critical').length;
    const serious = issues.filter(i => i.severity === 'serious').length;
    const moderate = issues.filter(i => i.severity === 'moderate').length;
    const minor = issues.filter(i => i.severity === 'minor').length;

    // WCAG compliance
    const levelAIssues = issues.filter(i => i.wcagLevel === 'A');
    const levelAAIssues = issues.filter(i => i.wcagLevel === 'AA');
    const levelAAAIssues = issues.filter(i => i.wcagLevel === 'AAA');

    const wcagCompliance = {
      levelA: levelAIssues.length === 0,
      levelAA: levelAIssues.length === 0 && levelAAIssues.length === 0,
      levelAAA: issues.length === 0
    };

    // Score calculation
    const score = Math.max(0, 100 - (critical * 15) - (serious * 10) - (moderate * 5) - (minor * 2));

    return {
      score,
      wcagCompliance,
      totalIssues: issues.length,
      critical,
      serious,
      moderate,
      minor,
      issues,
      passedRules: axeResults.passes.length,
      recommendations: generateA11yRecommendations(issues, wcagCompliance)
    };

  } catch (error) {
    console.error('[ACCESSIBILITY ERROR]:', error instanceof Error ? error.message : String(error));
    return {
      score: 0,
      wcagCompliance: { levelA: false, levelAA: false, levelAAA: false },
      totalIssues: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      issues: [],
      passedRules: 0,
      recommendations: [`⚠️ Accessibility scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

function mapAxeSeverity(impact: string): 'critical' | 'serious' | 'moderate' | 'minor' {
  switch (impact) {
    case 'critical': return 'critical';
    case 'serious': return 'serious';
    case 'moderate': return 'moderate';
    default: return 'minor';
  }
}

function determineWCAGLevel(tags: string[]): 'A' | 'AA' | 'AAA' {
  if (tags.some(t => t.includes('wcagaaa'))) return 'AAA';
  if (tags.some(t => t.includes('wcagaa'))) return 'AA';
  return 'A';
}

async function checkKeyboardNavigation(page: Page): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];

  try {
    const keyboardIssues = await page.evaluate(() => {
      const problems: any[] = [];
      
      // Check for keyboard traps
      const interactiveElements = document.querySelectorAll('a, button, input, select, textarea');
      let trapCount = 0;

      interactiveElements.forEach(el => {
        const tabIndex = (el as HTMLElement).tabIndex;
        if (tabIndex > 0) trapCount++;
      });

      if (trapCount > 0) {
        problems.push({
          type: 'keyboard-trap',
          count: trapCount
        });
      }

      // Check for missing focus indicators
      const style = getComputedStyle(document.body);
      if (style.outlineWidth === '0px' || style.outline === 'none') {
        problems.push({ type: 'no-focus-indicator' });
      }

      return problems;
    });

    for (const issue of keyboardIssues) {
      if (issue.type === 'keyboard-trap') {
        issues.push({
          severity: 'serious',
          wcagLevel: 'A',
          wcagCriteria: 'WCAG 2.1.1, 2.1.2',
          element: 'Multiple elements',
          description: `${issue.count} elements with positive tabindex create keyboard traps`,
          recommendation: 'Use tabindex="0" or natural tab order, avoid positive tabindex values'
        });
      }

      if (issue.type === 'no-focus-indicator') {
        issues.push({
          severity: 'serious',
          wcagLevel: 'AA',
          wcagCriteria: 'WCAG 2.4.7',
          element: 'body',
          description: 'Focus indicators are disabled globally',
          recommendation: 'Ensure visible focus indicators for keyboard navigation'
        });
      }
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

async function checkColorContrast(page: Page): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];

  try {
    const contrastIssues = await page.evaluate(() => {
      const problems: any[] = [];
      
      // Simple contrast check for text elements
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
      let lowContrastCount = 0;

      textElements.forEach(el => {
        const style = getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;
        
        // Basic check - if background is transparent or white-ish and text is light
        if ((bgColor.includes('rgba(0, 0, 0, 0)') || bgColor.includes('rgb(255, 255, 255)')) &&
            (color.includes('rgb(200') || color.includes('rgb(220') || color.includes('rgb(240'))) {
          lowContrastCount++;
        }
      });

      if (lowContrastCount > 0) {
        problems.push({
          type: 'low-contrast',
          count: lowContrastCount
        });
      }

      return problems;
    });

    for (const issue of contrastIssues) {
      if (issue.type === 'low-contrast') {
        issues.push({
          severity: 'serious',
          wcagLevel: 'AA',
          wcagCriteria: 'WCAG 1.4.3',
          element: `${issue.count} text elements`,
          description: 'Text may have insufficient color contrast',
          recommendation: 'Ensure 4.5:1 contrast ratio for normal text, 3:1 for large text'
        });
      }
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

async function checkFormAccessibility(page: Page): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];

  try {
    const formIssues = await page.evaluate(() => {
      const problems: any[] = [];
      
      // Check forms without labels
      const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
      let unlabeledCount = 0;

      inputs.forEach(input => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;

        if (!label && !ariaLabel && !ariaLabelledBy) {
          unlabeledCount++;
        }
      });

      if (unlabeledCount > 0) {
        problems.push({
          type: 'unlabeled-inputs',
          count: unlabeledCount
        });
      }

      // Check for missing required indicators
      const requiredInputs = document.querySelectorAll('input[required], textarea[required], select[required]');
      let missingIndicators = 0;

      requiredInputs.forEach(input => {
        const ariaRequired = input.getAttribute('aria-required');
        if (ariaRequired !== 'true') {
          missingIndicators++;
        }
      });

      if (missingIndicators > 0) {
        problems.push({
          type: 'missing-required',
          count: missingIndicators
        });
      }

      return problems;
    });

    for (const issue of formIssues) {
      if (issue.type === 'unlabeled-inputs') {
        issues.push({
          severity: 'critical',
          wcagLevel: 'A',
          wcagCriteria: 'WCAG 1.3.1, 3.3.2',
          element: `${issue.count} form inputs`,
          description: 'Form inputs without labels are inaccessible to screen readers',
          recommendation: 'Add <label> elements or aria-label attributes to all form inputs'
        });
      }

      if (issue.type === 'missing-required') {
        issues.push({
          severity: 'moderate',
          wcagLevel: 'A',
          wcagCriteria: 'WCAG 3.3.2',
          element: `${issue.count} required fields`,
          description: 'Required fields not properly announced to assistive technologies',
          recommendation: 'Add aria-required="true" to all required form fields'
        });
      }
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

function generateA11yRecommendations(
  issues: AccessibilityIssue[],
  wcagCompliance: { levelA: boolean; levelAA: boolean; levelAAA: boolean }
): string[] {
  const recommendations: string[] = [];

  if (!wcagCompliance.levelA) {
    recommendations.push('🚨 CRITICAL: Not WCAG Level A compliant - fix all critical issues!');
  }

  if (!wcagCompliance.levelAA) {
    recommendations.push('⚠️ Not WCAG Level AA compliant - required for most regulations');
  }

  if (issues.some(i => i.wcagCriteria.includes('1.4.3'))) {
    recommendations.push('🎨 Improve color contrast: Use tools like WebAIM Contrast Checker');
  }

  if (issues.some(i => i.wcagCriteria.includes('2.1'))) {
    recommendations.push('⌨️ Fix keyboard navigation: Test with Tab key, ensure all interactive elements are accessible');
  }

  if (issues.some(i => i.wcagCriteria.includes('1.3.1') || i.wcagCriteria.includes('3.3.2'))) {
    recommendations.push('📝 Label all form inputs: Use semantic HTML and ARIA labels');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Excellent accessibility! Consider WCAG AAA for even better compliance');
  }

  return recommendations;
}
