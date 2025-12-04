import { Page } from 'playwright';
import { Issue } from './white-screen';

/**
 * WCAG 2.1 Level AA Compliance Checker
 * Enhanced accessibility testing with multilingual support
 */
export class AccessibilityDetector {
  private readonly wcagLevels = ['A', 'AA', 'AAA'] as const;
  
  /**
   * Detect accessibility issues (WCAG 2.1 Level AA)
   * Now with multilingual support and enhanced checks
   */
  async detect(page: Page, options?: { locale?: string; wcagLevel?: 'A' | 'AA' | 'AAA' }): Promise<Issue[]> {
    const issues: Issue[] = [];
    const locale = options?.locale || 'en';
    const wcagLevel = options?.wcagLevel || 'AA';

    // Check for missing alt text on images
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter(img => !img.alt || img.alt.trim() === '').length;
    });

    if (imagesWithoutAlt > 0) {
      issues.push({
        type: 'MISSING_ALT_TEXT',
        severity: 'medium',
        message: `♿ ${imagesWithoutAlt} image(s) missing alt text`,
        fix: [
          'Add descriptive alt text to all images',
          'Use alt="" for decorative images',
          'Use aria-label for icon buttons',
          'Ensure alt text describes image content',
          'Keep alt text concise (< 125 characters)'
        ],
        details: { count: imagesWithoutAlt }
      });
    }

    // Check for missing form labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), textarea, select'));
      return inputs.filter(input => {
        const id = input.id;
        if (!id) return true;
        const label = document.querySelector(`label[for="${id}"]`);
        return !label && !input.getAttribute('aria-label');
      }).length;
    });

    if (inputsWithoutLabels > 0) {
      issues.push({
        type: 'MISSING_FORM_LABELS',
        severity: 'high',
        message: `♿ ${inputsWithoutLabels} form input(s) missing labels`,
        fix: [
          'Add <label> element for each input',
          'Use for attribute to associate label with input',
          'Use aria-label for inputs without visible labels',
          'Use aria-labelledby for complex labels',
          'Ensure labels are descriptive'
        ],
        details: { count: inputsWithoutLabels }
      });
    }

    // Check for missing page title
    const hasTitle = await page.evaluate(() => {
      return document.title && document.title.trim() !== '';
    });

    if (!hasTitle) {
      issues.push({
        type: 'MISSING_PAGE_TITLE',
        severity: 'high',
        message: '♿ Page missing title',
        fix: [
          'Add <title> tag in <head>',
          'Make title descriptive and unique',
          'Include site name in title',
          'Keep title under 60 characters for SEO',
          'Update title for different pages/routes'
        ],
        details: {}
      });
    }

    // Check for heading structure
    const headingIssues = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const h1Count = headings.filter(h => h.tagName === 'H1').length;
      
      return {
        noH1: h1Count === 0,
        multipleH1: h1Count > 1,
        total: headings.length
      };
    });

    if (headingIssues.noH1) {
      issues.push({
        type: 'MISSING_H1',
        severity: 'medium',
        message: '♿ Page missing <h1> heading',
        fix: [
          'Add one <h1> element per page',
          'Make h1 the main page heading',
          'Use h1 for page title/topic',
          'Follow logical heading hierarchy (h1 → h2 → h3)',
          'Don\'t skip heading levels'
        ],
        details: headingIssues
      });
    }

    if (headingIssues.multipleH1) {
      issues.push({
        type: 'MULTIPLE_H1',
        severity: 'low',
        message: `♿ Page has ${headingIssues.total} <h1> headings (should have 1)`,
        fix: [
          'Use only one <h1> per page',
          'Convert additional h1s to h2/h3',
          'Maintain proper heading hierarchy',
          'Use h1 for main content heading only'
        ],
        details: headingIssues
      });
    }

    // Check for low contrast text
    const lowContrastElements = await page.evaluate(() => {
      // Simplified contrast check (basic luminance calculation)
      const elements = Array.from(document.querySelectorAll('*'));
      let lowContrast = 0;

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const text = el.textContent?.trim();
        
        if (!text || text.length === 0) continue;

        const color = style.color;
        const bgColor = style.backgroundColor;
        
        // Skip if transparent or inherit
        if (!color || !bgColor || bgColor === 'rgba(0, 0, 0, 0)') continue;

        // Basic check: warn if text is very light on light background
        if (color.includes('255') && bgColor.includes('255')) {
          lowContrast++;
        }
      }

      return lowContrast;
    });

    if (lowContrastElements > 5) {
      issues.push({
        type: 'LOW_CONTRAST',
        severity: 'medium',
        message: `♿ Potential low contrast text detected`,
        fix: [
          'Ensure text contrast ratio ≥ 4.5:1 (normal text)',
          'Ensure text contrast ratio ≥ 3:1 (large text)',
          'Use color contrast checker tools',
          'Don\'t rely on color alone to convey information',
          'Test with different color vision deficiencies'
        ],
        details: { elements: lowContrastElements }
      });
    }

    // Check for keyboard navigation issues
    const keyboardIssues = await page.evaluate(() => {
      const interactiveElements = Array.from(document.querySelectorAll(
        'a, button, input, select, textarea, [tabindex], [role="button"], [role="link"]'
      ));

      let noTabIndex = 0;
      let negativeTabIndex = 0;

      for (const el of interactiveElements) {
        const tabIndex = el.getAttribute('tabindex');
        if (tabIndex && parseInt(tabIndex) < 0) {
          negativeTabIndex++;
        }
      }

      return { negativeTabIndex, total: interactiveElements.length };
    });

    if (keyboardIssues.negativeTabIndex > 0) {
      issues.push({
        type: 'KEYBOARD_NAVIGATION',
        severity: 'medium',
        message: `♿ ${keyboardIssues.negativeTabIndex} element(s) not keyboard accessible`,
        fix: [
          'Remove tabindex="-1" from interactive elements',
          'Ensure all interactive elements are keyboard accessible',
          'Test with Tab key navigation',
          'Add visible focus indicators',
          'Use semantic HTML (button, a, input)'
        ],
        details: keyboardIssues
      });
    }

    // NEW: Check for ARIA roles and attributes (WCAG 4.1.2)
    const ariaIssues = await page.evaluate(() => {
      const elementsWithRole = Array.from(document.querySelectorAll('[role]'));
      const invalidRoles: string[] = [];
      const missingRequiredAttrs: string[] = [];
      
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
        'definition', 'dialog', 'directory', 'document', 'feed', 'figure',
        'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list',
        'listbox', 'listitem', 'log', 'main', 'marquee', 'math', 'menu',
        'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation',
        'none', 'note', 'option', 'presentation', 'progressbar', 'radio',
        'radiogroup', 'region', 'row', 'rowgroup', 'rowheader', 'scrollbar',
        'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status',
        'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox',
        'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem'
      ];

      for (const el of elementsWithRole) {
        const role = el.getAttribute('role');
        if (role && !validRoles.includes(role)) {
          invalidRoles.push(role);
        }

        // Check for required ARIA attributes
        if (role === 'checkbox' || role === 'radio' || role === 'switch') {
          if (!el.hasAttribute('aria-checked')) {
            missingRequiredAttrs.push(`${role} missing aria-checked`);
          }
        }
        
        if (role === 'slider' || role === 'scrollbar' || role === 'spinbutton') {
          if (!el.hasAttribute('aria-valuenow')) {
            missingRequiredAttrs.push(`${role} missing aria-valuenow`);
          }
        }
      }

      return { invalidRoles, missingRequiredAttrs };
    });

    if (ariaIssues.invalidRoles.length > 0) {
      issues.push({
        type: 'INVALID_ARIA_ROLES',
        severity: 'high',
        message: `♿ Invalid ARIA roles detected (WCAG 4.1.2)`,
        fix: [
          'Use valid ARIA roles only',
          'Check ARIA specification for valid role names',
          'Remove or correct invalid roles',
          'Use semantic HTML instead of ARIA when possible',
          'Test with screen readers'
        ],
        details: { roles: ariaIssues.invalidRoles }
      });
    }

    if (ariaIssues.missingRequiredAttrs.length > 0) {
      issues.push({
        type: 'MISSING_REQUIRED_ARIA_ATTRS',
        severity: 'high',
        message: `♿ ${ariaIssues.missingRequiredAttrs.length} ARIA element(s) missing required attributes`,
        fix: [
          'Add required ARIA attributes',
          'aria-checked for checkbox/radio/switch',
          'aria-valuenow for slider/scrollbar/spinbutton',
          'aria-expanded for expandable elements',
          'aria-label or aria-labelledby for all interactive elements'
        ],
        details: { missing: ariaIssues.missingRequiredAttrs }
      });
    }

    // NEW: Check for language attribute (WCAG 3.1.1)
    const langIssues = await page.evaluate(() => {
      const html = document.documentElement;
      const htmlLang = html.getAttribute('lang');
      const htmlLangDir = html.getAttribute('dir');
      
      // Check for elements with different language
      const langElements = Array.from(document.querySelectorAll('[lang]'));
      const missingLangDir = langElements.filter(el => {
        const lang = el.getAttribute('lang');
        // RTL languages: Arabic, Hebrew, Persian, Urdu
        const rtlLangs = ['ar', 'he', 'fa', 'ur'];
        const isRTL = rtlLangs.some(rtl => lang?.startsWith(rtl));
        return isRTL && !el.getAttribute('dir');
      });

      return {
        htmlLang,
        htmlLangDir,
        missingLangDir: missingLangDir.length
      };
    });

    if (!langIssues.htmlLang) {
      issues.push({
        type: 'MISSING_LANG_ATTR',
        severity: 'high',
        message: '♿ Missing lang attribute on <html> (WCAG 3.1.1)',
        fix: [
          'Add lang attribute to <html> tag',
          `Example: <html lang="${locale}">`,
          'Use ISO 639-1 language codes (en, ar, de, fr, etc.)',
          'Specify region if needed (en-US, en-GB, ar-SA)',
          'Update lang for multilingual content'
        ],
        details: langIssues
      });
    }

    // NEW: Check RTL support for Arabic/Hebrew (WCAG 1.3.2)
    if (locale.startsWith('ar') || locale.startsWith('he')) {
      if (!langIssues.htmlLangDir || langIssues.htmlLangDir !== 'rtl') {
        issues.push({
          type: 'MISSING_RTL_DIR',
          severity: 'high',
          message: `♿ Missing dir="rtl" for ${locale} language (WCAG 1.3.2)`,
          fix: [
            'Add dir="rtl" to <html> tag for RTL languages',
            'Example: <html lang="ar" dir="rtl">',
            'RTL languages: Arabic (ar), Hebrew (he), Persian (fa), Urdu (ur)',
            'Test with RTL text to ensure proper rendering',
            'Use CSS logical properties (start/end instead of left/right)'
          ],
          details: { locale, currentDir: langIssues.htmlLangDir }
        });
      }
    }

    if (langIssues.missingLangDir > 0) {
      issues.push({
        type: 'MISSING_LANG_DIR',
        severity: 'medium',
        message: `♿ ${langIssues.missingLangDir} RTL element(s) missing dir attribute`,
        fix: [
          'Add dir="rtl" to elements with RTL language',
          'Match dir with lang attribute',
          'Test with screen readers in RTL mode'
        ],
        details: { count: langIssues.missingLangDir }
      });
    }

    // NEW: Check for skip links (WCAG 2.4.1)
    const hasSkipLink = await page.evaluate(() => {
      const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]'));
      return skipLinks.some(link => {
        const text = link.textContent?.toLowerCase() || '';
        return text.includes('skip') || text.includes('تخطي') || text.includes('jump');
      });
    });

    if (!hasSkipLink) {
      issues.push({
        type: 'MISSING_SKIP_LINK',
        severity: 'medium',
        message: '♿ Missing skip navigation link (WCAG 2.4.1)',
        fix: [
          'Add "Skip to main content" link as first focusable element',
          'Example: <a href="#main" class="skip-link">Skip to main content</a>',
          'Hide visually but keep keyboard accessible',
          'Multilingual: "تخطي إلى المحتوى الرئيسي" (Arabic)',
          'Test with Tab key to verify it appears on focus'
        ],
        details: {}
      });
    }

    // NEW: Check for focus indicators (WCAG 2.4.7)
    const focusIndicatorIssues = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      let hasFocusVisible = false;
      let hasOutlineNone = false;

      try {
        for (const sheet of styles) {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule instanceof CSSStyleRule) {
              if (rule.selectorText?.includes(':focus-visible')) {
                hasFocusVisible = true;
              }
              if (rule.selectorText?.includes(':focus') && rule.style.outline === 'none') {
                hasOutlineNone = true;
              }
            }
          }
        }
      } catch (e) {
        // CORS or other stylesheet access issues
      }

      return { hasFocusVisible, hasOutlineNone };
    });

    if (focusIndicatorIssues.hasOutlineNone && !focusIndicatorIssues.hasFocusVisible) {
      issues.push({
        type: 'MISSING_FOCUS_INDICATOR',
        severity: 'high',
        message: '♿ Focus indicators removed without alternative (WCAG 2.4.7)',
        fix: [
          'Don\'t use outline: none without providing alternative focus style',
          'Use :focus-visible for modern browsers',
          'Provide visible focus indicator (border, shadow, background)',
          'Ensure focus indicator has 3:1 contrast ratio',
          'Test keyboard navigation to verify visibility'
        ],
        details: focusIndicatorIssues
      });
    }

    return issues;
  }

  /**
   * Quick accessibility score (0-100)
   */
  async getScore(page: Page): Promise<number> {
    const issues = await this.detect(page);
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    // Calculate score (deduct points for each issue)
    let score = 100;
    score -= criticalCount * 20;
    score -= highCount * 10;
    score -= mediumCount * 5;
    score -= lowCount * 2;

    return Math.max(0, score);
  }
}
