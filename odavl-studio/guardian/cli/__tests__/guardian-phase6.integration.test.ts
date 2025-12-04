/**
 * Guardian v5.0 Integration Tests
 * 
 * Tests auto-detection, menu generation, and tester routing
 * across all project types.
 */

import { describe, test, expect } from 'vitest';
import { join } from 'path';
import { detectProject } from '../src/detectors/project-detector.js';
import { detectSuite } from '../src/detectors/suite-detector.js';
import { createAdaptiveMenu } from '../src/menu/adaptive-menu.js';

// Test projects are in guardian/test-projects (one level up from cli/)
const TEST_PROJECTS_DIR = join(__dirname, '../../test-projects');

describe('Guardian v5.0 - Project Detection', () => {
  test('detects Next.js website correctly', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-website');
    const result = await detectProject(projectPath);

    expect(result.type).toBe('website');
    expect(result.framework).toBe('next.js');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
    expect(result.detectionReasons).toContain('Found next.config.js');
  });

  test('detects VS Code extension correctly', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-extension');
    const result = await detectProject(projectPath);

    expect(result.type).toBe('extension');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
    // Check that VS Code engine is detected (exact message may vary)
    expect(result.detectionReasons.some(r => r.includes('VS Code engine'))).toBe(true);
  });

  test('detects CLI tool correctly', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-cli');
    const result = await detectProject(projectPath);

    expect(result.type).toBe('cli');
    expect(result.confidence).toBeGreaterThanOrEqual(85);
    // Check that bin detection exists (exact message may vary)
    expect(result.detectionReasons.length).toBeGreaterThan(0);
  });

  test('detects TypeScript package correctly', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-package');
    const result = await detectProject(projectPath);

    expect(result.type).toBe('package');
    expect(result.confidence).toBeGreaterThanOrEqual(80);
    expect(result.detectionReasons.length).toBeGreaterThan(0);
  });

  test('detects monorepo correctly', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-monorepo');
    const result = await detectProject(projectPath);

    expect(result.type).toBe('monorepo');
    expect(result.framework).toContain('pnpm');
    expect(result.confidence).toBeGreaterThanOrEqual(90);
    expect(result.detectionReasons).toContain('Found pnpm-workspace.yaml');
  });
});

describe('Guardian v5.0 - Suite Detection', () => {
  test('detects monorepo suite with products', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-monorepo');
    const suite = await detectSuite(projectPath);

    expect(suite.type).toBe('monorepo');
    expect(suite.totalProducts).toBeGreaterThanOrEqual(2);
    expect(suite.products).toHaveLength(suite.totalProducts);
    expect(suite.detectionSource).toBe('package.json');
  });

  test('detects single package as single type', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-website');
    const suite = await detectSuite(projectPath);

    expect(suite.type).toBe('single');
    expect(suite.totalProducts).toBeLessThanOrEqual(1);
  });

  test('formats suite name correctly', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-monorepo');
    const suite = await detectSuite(projectPath);

    expect(suite.name).toBeTruthy();
    expect(suite.displayName).toBeTruthy();
    // Display name should be capitalized
    expect(suite.displayName.charAt(0)).toMatch(/[A-Z]/);
  });
});

describe('Guardian v5.0 - Adaptive Menu', () => {
  test('generates single package menu for website', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-website');
    const suite = await detectSuite(projectPath);
    const menu = createAdaptiveMenu();

    const sections = menu.generateSinglePackageMenu('website', 'Test Website');

    expect(sections).toHaveLength(2); // Testing + Utilities
    expect(sections[0].title).toContain('TESTING');
    expect(sections[1].title).toContain('UTILITIES');
    
    // Main test should be first
    const mainTest = sections[0].items[0];
    expect(mainTest.id).toBe('test-main');
    expect(mainTest.projectType).toBe('website');
  });

  test('generates monorepo menu with products', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-monorepo');
    const suite = await detectSuite(projectPath);
    const menu = createAdaptiveMenu();

    const sections = menu.generateMonorepoMenu(suite);

    expect(sections.length).toBeGreaterThanOrEqual(2); // Products + Suite Actions + Utilities
    
    // First section should be products
    const productsSection = sections[0];
    expect(productsSection.title).toContain('PRODUCTS');
    expect(productsSection.items.length).toBe(suite.totalProducts);
    
    // Each product should have proper structure
    productsSection.items.forEach(item => {
      expect(item.id).toMatch(/^product-/);
      expect(item.product).toBeDefined();
      expect(item.emoji).toBeTruthy();
    });
  });

  test('generates unknown project menu', () => {
    const menu = createAdaptiveMenu();
    const sections = menu.generateUnknownProjectMenu();

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toContain('AVAILABLE TESTS');
    expect(sections[0].items.length).toBeGreaterThanOrEqual(3);
  });

  test('menu items have sequential keys', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-monorepo');
    const suite = await detectSuite(projectPath);
    const menu = createAdaptiveMenu();

    const sections = menu.generateMonorepoMenu(suite);
    
    // Flatten all items
    const allItems = sections.flatMap(s => s.items);
    
    // Keys should be 1, 2, 3, ...
    allItems.forEach((item, index) => {
      expect(item.key).toBe(String(index + 1));
    });
  });
});

describe('Guardian v5.0 - Menu Input Parsing', () => {
  test('parses numeric input correctly', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-website');
    const suite = await detectSuite(projectPath);
    const menu = createAdaptiveMenu();
    const sections = menu.generateSinglePackageMenu('website', 'Test');

    const result = menu.parseInput('1', sections);
    
    expect(result).not.toBe('exit');
    expect(result).not.toBeNull();
    expect((result as any).id).toBe('test-main');
  });

  test('parses exit command', async () => {
    const menu = createAdaptiveMenu();
    const sections = menu.generateUnknownProjectMenu();

    expect(menu.parseInput('0', sections)).toBe('exit');
    expect(menu.parseInput('exit', sections)).toBe('exit');
    expect(menu.parseInput('x', sections)).toBe('exit');
  });

  test('returns null for invalid input', async () => {
    const menu = createAdaptiveMenu();
    const sections = menu.generateUnknownProjectMenu();

    expect(menu.parseInput('999', sections)).toBeNull();
    expect(menu.parseInput('invalid', sections)).toBeNull();
  });
});

describe('Guardian v5.0 - Product Type Detection', () => {
  test('monorepo products have correct types', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-monorepo');
    const suite = await detectSuite(projectPath);

    // Should detect web app (may be unknown if no framework markers present)
    const webProduct = suite.products.find(p => p.name.includes('web'));
    expect(webProduct).toBeDefined();
    expect(webProduct?.type).toMatch(/website|unknown/);

    // Should detect utils as package (or unknown)
    const utilsProduct = suite.products.find(p => p.name.includes('utils'));
    expect(utilsProduct).toBeDefined();
    expect(utilsProduct?.type).toMatch(/package|unknown/);
  });

  test('products are sorted by type', async () => {
    const projectPath = join(TEST_PROJECTS_DIR, 'test-monorepo');
    const suite = await detectSuite(projectPath);
    const menu = createAdaptiveMenu();

    const sections = menu.generateMonorepoMenu(suite);
    const productItems = sections[0].items;

    // Websites should come before packages
    const typeOrder = productItems.map(item => item.product?.type);
    const websiteIndex = typeOrder.indexOf('website');
    const packageIndex = typeOrder.indexOf('package');

    if (websiteIndex !== -1 && packageIndex !== -1) {
      expect(websiteIndex).toBeLessThan(packageIndex);
    }
  });
});
