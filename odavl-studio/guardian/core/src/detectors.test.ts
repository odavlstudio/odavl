import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../src/browser-manager';
import { WhiteScreenDetector } from '../src/detectors/white-screen';
import { NotFoundDetector } from '../src/detectors/404-error';
import { ConsoleErrorDetector } from '../src/detectors/console-error';
import { ReactErrorDetector } from '../src/detectors/react-error';
import { PerformanceDetector } from '../src/detectors/performance';
import { AccessibilityDetector } from '../src/detectors/accessibility';
import { SecurityDetector } from '../src/detectors/security';
import { SEODetector } from '../src/detectors/seo';
import { MobileDetector } from '../src/detectors/mobile';

describe('Guardian Core - Detectors', () => {
  let browserManager: BrowserManager;

  beforeAll(async () => {
    browserManager = new BrowserManager();
    await browserManager.launch({ headless: true });
  });

  afterAll(async () => {
    await browserManager.close();
  });

  describe('WhiteScreenDetector', () => {
    it('should detect white screen', async () => {
      const detector = new WhiteScreenDetector();
      const page = await browserManager.newPage();
      
      // Navigate to empty page
      await page.goto('about:blank');
      
      const issue = await detector.detect(page);
      expect(issue).toBeDefined();
      expect(issue?.type).toBe('WHITE_SCREEN');
      expect(issue?.severity).toBe('critical');
    });

    it('should not detect white screen on normal page', async () => {
      const detector = new WhiteScreenDetector();
      const page = await browserManager.newPage();
      
      await page.goto('https://example.com');
      
      const issue = await detector.detect(page);
      expect(issue).toBeNull();
    });
  });

  describe('NotFoundDetector', () => {
    it('should detect 404 errors', async () => {
      const detector = new NotFoundDetector();
      const page = await browserManager.newPage();
      
      // Navigate to non-existent page
      await page.goto('https://example.com/this-page-does-not-exist-12345', {
        waitUntil: 'domcontentloaded'
      }).catch(() => {});
      
      const issue = await detector.detect(page);
      expect(issue).toBeDefined();
      expect(issue?.type).toBe('404_ERROR');
    });
  });

  describe('ConsoleErrorDetector', () => {
    it('should capture console errors', async () => {
      const detector = new ConsoleErrorDetector();
      const page = await browserManager.newPage();
      
      detector.startListening(page);
      
      // Trigger console error
      await page.evaluate(() => {
        console.error('Test error message');
      });
      
      const issues = await detector.detect(page);
      expect(detector.hasErrors()).toBe(true);
    });
  });

  describe('PerformanceDetector', () => {
    it('should detect performance issues', async () => {
      const detector = new PerformanceDetector();
      const page = await browserManager.newPage();
      
      await page.goto('https://example.com');
      
      const issues = await detector.detect(page);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should get basic metrics', async () => {
      const detector = new PerformanceDetector();
      const page = await browserManager.newPage();
      
      await page.goto('https://example.com');
      
      const metrics = await detector.getMetrics(page);
      expect(metrics).toBeDefined();
      expect(typeof metrics.domContentLoaded).toBe('number');
    });
  });

  describe('AccessibilityDetector', () => {
    it('should detect accessibility issues', async () => {
      const detector = new AccessibilityDetector();
      const page = await browserManager.newPage();
      
      await page.goto('https://example.com');
      
      const issues = await detector.detect(page);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should calculate accessibility score', async () => {
      const detector = new AccessibilityDetector();
      const page = await browserManager.newPage();
      
      await page.goto('https://example.com');
      
      const score = await detector.getScore(page);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('SecurityDetector', () => {
    it('should detect security issues', async () => {
      const detector = new SecurityDetector();
      const page = await browserManager.newPage();
      
      await page.goto('http://example.com'); // HTTP (insecure)
      
      const issues = await detector.detect(page);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should calculate security score', async () => {
      const detector = new SecurityDetector();
      const page = await browserManager.newPage();
      
      await page.goto('https://example.com');
      
      const score = await detector.getScore(page);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('SEODetector', () => {
    it('should detect SEO issues', async () => {
      const detector = new SEODetector();
      const page = await browserManager.newPage();
      
      await page.goto('https://example.com');
      
      const issues = await detector.detect(page);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should calculate SEO score', async () => {
      const detector = new SEODetector();
      const page = await browserManager.newPage();
      
      await page.goto('https://example.com');
      
      const score = await detector.getScore(page);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('MobileDetector', () => {
    it('should detect mobile issues', async () => {
      const detector = new MobileDetector();
      const page = await browserManager.newPage();
      
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('https://example.com');
      
      const issues = await detector.detect(page);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('should calculate mobile score', async () => {
      const detector = new MobileDetector();
      const page = await browserManager.newPage();
      
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('https://example.com');
      
      const score = await detector.getScore(page);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
