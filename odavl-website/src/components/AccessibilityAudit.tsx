'use client';

import { useEffect, useState } from 'react';
import { calculateContrast, prefersReducedMotion } from '@/utils/a11y.utils';

interface AccessibilityIssue {
  type: 'contrast' | 'focus' | 'aria' | 'keyboard' | 'motion';
  severity: 'error' | 'warning' | 'info';
  message: string;
  element?: string;
  fix?: string;
}

export function useAccessibilityAudit() {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const auditIssues: AccessibilityIssue[] = [];

    // Color Contrast Tests
    const contrastTests = [
      { colors: ['#0f3460', '#ffffff'], name: 'Navy on White' },
      { colors: ['#00d4ff', '#0f3460'], name: 'Cyan on Navy' },
      { colors: ['#ffffff', '#0f3460'], name: 'White on Navy' },
      { colors: ['#64748b', '#ffffff'], name: 'Gray text on White' },
    ];

    contrastTests.forEach(test => {
      const result = calculateContrast(test.colors[0], test.colors[1]);
      if (!result.passes) {
        auditIssues.push({
          type: 'contrast',
          severity: 'error',
          message: `${test.name} contrast ratio ${result.ratio}:1 fails WCAG AA (requires 4.5:1)`,
          fix: 'Adjust colors to meet minimum contrast requirements'
        });
      }
    });

    // Check for missing alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-hidden')) {
        auditIssues.push({
          type: 'aria',
          severity: 'error',
          message: `Image ${index + 1} missing alt text`,
          element: `img[src="${img.src}"]`,
          fix: 'Add descriptive alt text or aria-hidden="true" for decorative images'
        });
      }
    });

    // Check for focus indicators
    const focusableElements = document.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    
    let missingFocusCount = 0;
    focusableElements.forEach(element => {
      const styles = window.getComputedStyle(element, ':focus');
      if (styles.outline === 'none' && !styles.boxShadow.includes('inset')) {
        missingFocusCount++;
      }
    });

    if (missingFocusCount > 0) {
      auditIssues.push({
        type: 'focus',
        severity: 'warning',
        message: `${missingFocusCount} elements lack visible focus indicators`,
        fix: 'Add visible focus styles using outline or box-shadow'
      });
    }

    // Check for motion preferences
    if (!prefersReducedMotion()) {
      const motionElements = document.querySelectorAll('[data-motion], .animate-pulse, .animate-bounce');
      if (motionElements.length > 0) {
        auditIssues.push({
          type: 'motion',
          severity: 'info',
          message: 'Motion animations detected - ensure they respect prefers-reduced-motion',
          fix: 'Wrap animations in prefers-reduced-motion media queries'
        });
      }
    }

    // Check for proper heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.slice(1));
      if (index === 0 && currentLevel !== 1) {
        auditIssues.push({
          type: 'aria',
          severity: 'warning',
          message: 'Page should start with h1 heading',
          element: heading.tagName.toLowerCase(),
          fix: 'Use h1 as the main page heading'
        });
      } else if (currentLevel > lastLevel + 1) {
        auditIssues.push({
          type: 'aria',
          severity: 'warning',
          message: `Heading hierarchy skip from h${lastLevel} to h${currentLevel}`,
          element: heading.tagName.toLowerCase(),
          fix: 'Use sequential heading levels (h1 → h2 → h3...)'
        });
      }
      lastLevel = currentLevel;
    });

    setIssues(auditIssues);
    
    // Calculate score (100 - penalty points)
    const errorPenalty = auditIssues.filter(i => i.severity === 'error').length * 15;
    const warningPenalty = auditIssues.filter(i => i.severity === 'warning').length * 5;
    const infoPenalty = auditIssues.filter(i => i.severity === 'info').length * 1;
    
    setScore(Math.max(0, 100 - errorPenalty - warningPenalty - infoPenalty));
  }, []);

  return { issues, score };
}

function getScoreColor(score: number) {
  if (score >= 95) return 'bg-green-100 text-green-800';
  if (score >= 80) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function getIssueSeverityStyles(severity: string) {
  if (severity === 'error') return 'bg-red-50 border-l-2 border-red-500';
  if (severity === 'warning') return 'bg-yellow-50 border-l-2 border-yellow-500';
  return 'bg-blue-50 border-l-2 border-blue-500';
}

export function AccessibilityPanel() {
  const { issues, score } = useAccessibilityAudit();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">A11y Audit</h3>
        <div className={`px-2 py-1 rounded text-sm font-medium ${getScoreColor(score)}`}>
          {score}/100
        </div>
      </div>
      
      {issues.length === 0 ? (
        <p className="text-sm text-green-600">✅ No accessibility issues found!</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {issues.map((issue) => (
            <div key={`${issue.type}-${issue.message}`} className={`p-2 rounded text-xs ${getIssueSeverityStyles(issue.severity)}`}>
              <p className="font-medium">{issue.message}</p>
              {issue.fix && <p className="text-gray-600 mt-1">{issue.fix}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}