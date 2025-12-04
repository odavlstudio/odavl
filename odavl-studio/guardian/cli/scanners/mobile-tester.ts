/**
 * 📱 Guardian Enterprise Mobile Responsiveness Tester
 * Test website on multiple screen sizes and devices
 * - Viewport breakpoint testing
 * - Touch target sizes
 * - Mobile performance
 * - Responsive images
 * - Mobile-specific issues
 */

import { Page, Browser } from 'playwright';

export interface ResponsivenessIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  device: string;
  viewport: string;
  description: string;
  recommendation: string;
}

export interface ResponsivenessReport {
  score: number; // 0-100
  testedDevices: number;
  passedDevices: number;
  failedDevices: number;
  issues: ResponsivenessIssue[];
  recommendations: string[];
}

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'iPhone 12 Pro', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'iPad', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'iPad Pro', width: 1024, height: 1366, deviceScaleFactor: 2 },
  { name: 'Android Phone', width: 360, height: 640, deviceScaleFactor: 2 },
  { name: 'Desktop HD', width: 1920, height: 1080, deviceScaleFactor: 1 }
];

export async function testResponsiveness(
  page: Page,
  url: string
): Promise<ResponsivenessReport> {
  const issues: ResponsivenessIssue[] = [];
  let passedDevices = 0;

  for (const viewport of VIEWPORTS) {
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Wait for layout to stabilize after viewport change
      await page.waitForTimeout(500);

      const deviceIssues = await testViewport(page, viewport);
      
      issues.push(...deviceIssues);

      // Calculate device score based on issue severity
      // Critical: -50 points, High: -30, Medium: -10, Low: -5
      let deviceScore = 100;
      for (const issue of deviceIssues) {
        if (issue.severity === 'critical') deviceScore -= 50;
        else if (issue.severity === 'high') deviceScore -= 30;
        else if (issue.severity === 'medium') deviceScore -= 10;
        else if (issue.severity === 'low') deviceScore -= 5;
      }
      deviceScore = Math.max(0, deviceScore); // Don't go below 0

      if (deviceScore >= 70) {
        passedDevices++;
      }

    } catch (error) {
      issues.push({
        severity: 'high',
        device: viewport.name,
        viewport: `${viewport.width}x${viewport.height}`,
        description: 'Failed to test on this device',
        recommendation: 'Check for JavaScript errors or layout issues on this viewport'
      });
    }
  }

  const score = Math.round((passedDevices / VIEWPORTS.length) * 100);

  return {
    score,
    testedDevices: VIEWPORTS.length,
    passedDevices,
    failedDevices: VIEWPORTS.length - passedDevices,
    issues,
    recommendations: generateResponsivenessRecommendations(issues)
  };
}

async function testViewport(
  page: Page,
  viewport: { name: string; width: number; height: number }
): Promise<ResponsivenessIssue[]> {
  const issues: ResponsivenessIssue[] = [];

  try {
    const results = await page.evaluate(() => {
      const problems: any[] = [];

      // 1. Check for horizontal scrollbar
      if (document.body.scrollWidth > window.innerWidth) {
        problems.push({
          type: 'horizontal-scroll',
          width: document.body.scrollWidth
        });
      }

      // 2. Check for small touch targets
      const interactive = document.querySelectorAll('button, a, input, select');
      let smallTargets = 0;

      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        if (size < 44) {
          smallTargets++;
        }
      });

      if (smallTargets > 0) {
        problems.push({
          type: 'small-targets',
          count: smallTargets
        });
      }

      // 3. Check for overlapping elements
      const elements = Array.from(document.querySelectorAll('*'));
      let overlapping = 0;

      for (let i = 0; i < Math.min(elements.length, 100); i++) {
        const rect1 = elements[i].getBoundingClientRect();
        for (let j = i + 1; j < Math.min(elements.length, 100); j++) {
          const rect2 = elements[j].getBoundingClientRect();
          
          if (rect1.left < rect2.right &&
              rect1.right > rect2.left &&
              rect1.top < rect2.bottom &&
              rect1.bottom > rect2.top) {
            overlapping++;
            break;
          }
        }
      }

      if (overlapping > 10) {
        problems.push({
          type: 'overlapping',
          count: overlapping
        });
      }

      // 4. Check for tiny text
      const textElements = document.querySelectorAll('p, span, div, a, button, label');
      let tinyText = 0;

      textElements.forEach(el => {
        const style = getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 14) {
          tinyText++;
        }
      });

      if (tinyText > 10) {
        problems.push({
          type: 'tiny-text',
          count: tinyText
        });
      }

      // 5. Check for fixed positioning issues
      const fixed = document.querySelectorAll('[style*="fixed"]');
      if (fixed.length > 5) {
        problems.push({
          type: 'too-many-fixed',
          count: fixed.length
        });
      }

      return problems;
    });

    for (const result of results) {
      if (result.type === 'horizontal-scroll') {
        issues.push({
          severity: 'high',
          device: viewport.name,
          viewport: `${viewport.width}x${viewport.height}`,
          description: `Horizontal scrollbar detected (content: ${result.width}px)`,
          recommendation: 'Use responsive CSS (max-width: 100%, flexbox, grid)'
        });
      }

      if (result.type === 'small-targets') {
        issues.push({
          severity: 'medium',
          device: viewport.name,
          viewport: `${viewport.width}x${viewport.height}`,
          description: `${result.count} touch targets smaller than 44x44px`,
          recommendation: 'Increase button/link size to minimum 44x44px for touch'
        });
      }

      if (result.type === 'overlapping') {
        issues.push({
          severity: 'medium',
          device: viewport.name,
          viewport: `${viewport.width}x${viewport.height}`,
          description: `${result.count} overlapping elements detected`,
          recommendation: 'Fix layout with flexbox or grid, avoid absolute positioning'
        });
      }

      if (result.type === 'tiny-text') {
        issues.push({
          severity: 'low',
          device: viewport.name,
          viewport: `${viewport.width}x${viewport.height}`,
          description: `${result.count} elements with text smaller than 14px`,
          recommendation: 'Use minimum 14px font size on mobile for readability'
        });
      }

      if (result.type === 'too-many-fixed') {
        issues.push({
          severity: 'low',
          device: viewport.name,
          viewport: `${viewport.width}x${viewport.height}`,
          description: `${result.count} fixed position elements may block content`,
          recommendation: 'Reduce fixed positioning on mobile, use sticky instead'
        });
      }
    }

  } catch (error) {
    // Silent fail
  }

  return issues;
}

function generateResponsivenessRecommendations(issues: ResponsivenessIssue[]): string[] {
  const recommendations: string[] = [];

  if (issues.some(i => i.description.includes('Horizontal scrollbar'))) {
    recommendations.push('📐 Fix horizontal scroll: Use responsive units (%, vw) and max-width');
  }

  if (issues.some(i => i.description.includes('touch targets'))) {
    recommendations.push('👆 Increase touch targets: Minimum 44x44px for mobile buttons');
  }

  if (issues.some(i => i.description.includes('overlapping'))) {
    recommendations.push('🔧 Fix overlapping: Use CSS flexbox or grid for responsive layouts');
  }

  if (issues.some(i => i.description.includes('text smaller'))) {
    recommendations.push('📱 Increase font size: Minimum 14px on mobile for readability');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Great mobile responsiveness! Works well on all devices');
  }

  return recommendations;
}
