/**
 * ODAVL Guardian - Screenshot Manager
 * Visual regression testing and screenshot comparison
 * 
 * @module screenshot-manager
 * @category Guardian
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Page } from 'playwright';

// ========================================
// Types
// ========================================

export interface ScreenshotOptions {
  /** Screenshot name (without extension) */
  name: string;
  
  /** Full page screenshot (default: true) */
  fullPage?: boolean;
  
  /** Wait for selector before taking screenshot */
  waitForSelector?: string;
  
  /** Wait time in milliseconds before screenshot */
  delay?: number;
  
  /** Device viewport */
  viewport?: {
    width: number;
    height: number;
  };
  
  /** Browser type */
  browser?: 'chromium' | 'firefox' | 'webkit';
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface ScreenshotMetadata {
  /** Screenshot name */
  name: string;
  
  /** URL captured */
  url: string;
  
  /** Timestamp */
  timestamp: string;
  
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  
  /** Browser used */
  browser: string;
  
  /** File path */
  path: string;
  
  /** File size in bytes */
  size: number;
  
  /** Comparison result (if compared) */
  comparison?: {
    differencePercentage: number;
    pixelsDifferent: number;
    diffImagePath?: string;
  };
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface ComparisonResult {
  /** Are images identical? */
  identical: boolean;
  
  /** Difference percentage (0-100) */
  differencePercentage: number;
  
  /** Number of pixels different */
  pixelsDifferent: number;
  
  /** Total pixels */
  totalPixels: number;
  
  /** Path to diff image (if generated) */
  diffImagePath?: string;
  
  /** Baseline dimensions */
  baselineDimensions: { width: number; height: number };
  
  /** Current dimensions */
  currentDimensions: { width: number; height: number };
}

// ========================================
// Configuration
// ========================================

const SCREENSHOTS_DIR = '.odavl/guardian/screenshots';
const BASELINE_DIR = path.join(SCREENSHOTS_DIR, 'baseline');
const CURRENT_DIR = path.join(SCREENSHOTS_DIR, 'current');
const DIFFS_DIR = path.join(SCREENSHOTS_DIR, 'diffs');
const METADATA_FILE = path.join(SCREENSHOTS_DIR, 'metadata.json');

// Comparison threshold (percentage)
const DEFAULT_THRESHOLD = 0.1; // 0.1% difference allowed

// ========================================
// Core Functions
// ========================================

/**
 * Initialize screenshot system
 */
export async function initializeScreenshots(): Promise<void> {
  // Create directories
  await fs.mkdir(BASELINE_DIR, { recursive: true });
  await fs.mkdir(CURRENT_DIR, { recursive: true });
  await fs.mkdir(DIFFS_DIR, { recursive: true });
  
  // Initialize metadata file if doesn't exist
  try {
    await fs.access(METADATA_FILE);
  } catch {
    await saveMetadata([]);
  }
}

/**
 * Capture screenshot
 */
export async function captureScreenshot(
  page: Page,
  options: ScreenshotOptions
): Promise<string> {
  const {
    name,
    fullPage = true,
    waitForSelector,
    delay = 0,
    viewport,
    browser = 'chromium',
    metadata: customMetadata,
  } = options;
  
  // Set viewport if specified
  if (viewport) {
    await page.setViewportSize(viewport);
  }
  
  // Wait for selector if specified
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 10000 });
  }
  
  // Wait for delay
  if (delay > 0) {
    await page.waitForTimeout(delay);
  }
  
  // Take screenshot
  const screenshotPath = path.join(CURRENT_DIR, `${name}.png`);
  await page.screenshot({
    path: screenshotPath,
    fullPage,
  });
  
  // Get metadata
  const url = page.url();
  const viewportSize = page.viewportSize() || { width: 1280, height: 720 };
  const stat = await fs.stat(screenshotPath);
  
  const metadata: ScreenshotMetadata = {
    name,
    url,
    timestamp: new Date().toISOString(),
    viewport: viewportSize,
    browser,
    path: screenshotPath,
    size: stat.size,
    metadata: customMetadata,
  };
  
  // Save metadata
  await addMetadata(metadata);
  
  console.log(`📸 Screenshot captured: ${name} (${url})`);
  
  return screenshotPath;
}

/**
 * Set screenshot as baseline
 */
export async function setBaseline(name: string): Promise<void> {
  const currentPath = path.join(CURRENT_DIR, `${name}.png`);
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  
  // Copy current to baseline
  await fs.copyFile(currentPath, baselinePath);
  
  console.log(`✅ Baseline set: ${name}`);
}

/**
 * Compare screenshot with baseline
 */
export async function compareWithBaseline(
  name: string,
  threshold: number = DEFAULT_THRESHOLD
): Promise<ComparisonResult> {
  const baselinePath = path.join(BASELINE_DIR, `${name}.png`);
  const currentPath = path.join(CURRENT_DIR, `${name}.png`);
  
  // Check if baseline exists
  try {
    await fs.access(baselinePath);
  } catch {
    throw new Error(`Baseline not found for: ${name}. Run setBaseline() first.`);
  }
  
  // Check if current exists
  try {
    await fs.access(currentPath);
  } catch {
    throw new Error(`Current screenshot not found: ${name}`);
  }
  
  // Compare images (using pixelmatch or similar library)
  const result = await compareImages(baselinePath, currentPath);
  
  // Generate diff image if different
  if (result.differencePercentage > threshold) {
    const diffPath = path.join(DIFFS_DIR, `${name}-diff.png`);
    await generateDiffImage(baselinePath, currentPath, diffPath);
    result.diffImagePath = diffPath;
    
    console.log(`⚠️  Visual difference detected: ${name} (${result.differencePercentage.toFixed(2)}%)`);
  } else {
    console.log(`✅ Visual match: ${name}`);
  }
  
  // Update metadata with comparison
  await updateMetadataComparison(name, {
    differencePercentage: result.differencePercentage,
    pixelsDifferent: result.pixelsDifferent,
    diffImagePath: result.diffImagePath,
  });
  
  return result;
}

/**
 * Capture and compare in one step
 */
export async function captureAndCompare(
  page: Page,
  options: ScreenshotOptions,
  threshold: number = DEFAULT_THRESHOLD
): Promise<ComparisonResult | null> {
  // Capture current screenshot
  await captureScreenshot(page, options);
  
  // Compare with baseline (if exists)
  try {
    return await compareWithBaseline(options.name, threshold);
  } catch (error) {
    // No baseline exists yet
    console.log(`ℹ️  No baseline found for: ${options.name}. Use setBaseline() to create one.`);
    return null;
  }
}

/**
 * Get all screenshots metadata
 */
export async function getAllMetadata(): Promise<ScreenshotMetadata[]> {
  try {
    const content = await fs.readFile(METADATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Get metadata for specific screenshot
 */
export async function getMetadata(name: string): Promise<ScreenshotMetadata | null> {
  const allMetadata = await getAllMetadata();
  return allMetadata.find((m) => m.name === name) || null;
}

/**
 * List all baseline screenshots
 */
export async function listBaselines(): Promise<string[]> {
  try {
    const files = await fs.readdir(BASELINE_DIR);
    return files
      .filter((f) => f.endsWith('.png'))
      .map((f) => f.replace('.png', ''));
  } catch {
    return [];
  }
}

/**
 * Delete screenshot and its metadata
 */
export async function deleteScreenshot(name: string): Promise<void> {
  // Delete files
  const files = [
    path.join(BASELINE_DIR, `${name}.png`),
    path.join(CURRENT_DIR, `${name}.png`),
    path.join(DIFFS_DIR, `${name}-diff.png`),
  ];
  
  await Promise.all(
    files.map((file) =>
      fs.unlink(file).catch(() => {
        /* ignore if doesn't exist */
      })
    )
  );
  
  // Remove from metadata
  const allMetadata = await getAllMetadata();
  const filtered = allMetadata.filter((m) => m.name !== name);
  await saveMetadata(filtered);
  
  console.log(`🗑️  Deleted screenshot: ${name}`);
}

// ========================================
// Helper Functions
// ========================================

/**
 * Save metadata
 */
async function saveMetadata(metadata: ScreenshotMetadata[]): Promise<void> {
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf-8');
}

/**
 * Add metadata entry
 */
async function addMetadata(metadata: ScreenshotMetadata): Promise<void> {
  const allMetadata = await getAllMetadata();
  
  // Remove existing entry with same name
  const filtered = allMetadata.filter((m) => m.name !== metadata.name);
  
  // Add new entry
  filtered.push(metadata);
  
  await saveMetadata(filtered);
}

/**
 * Update metadata with comparison results
 */
async function updateMetadataComparison(
  name: string,
  comparison: ScreenshotMetadata['comparison']
): Promise<void> {
  const allMetadata = await getAllMetadata();
  const entry = allMetadata.find((m) => m.name === name);
  
  if (entry) {
    entry.comparison = comparison;
    await saveMetadata(allMetadata);
  }
}

/**
 * Compare two images (simplified - use pixelmatch in production)
 */
async function compareImages(
  baselinePath: string,
  currentPath: string
): Promise<ComparisonResult> {
  // In production, use pixelmatch or similar library
  // This is a placeholder implementation
  
  try {
    // For now, just compare file sizes as a simple check
    const [baselineStat, currentStat] = await Promise.all([
      fs.stat(baselinePath),
      fs.stat(currentPath),
    ]);
    
    // Simple size comparison (not accurate, just for demonstration)
    const sizeDiff = Math.abs(baselineStat.size - currentStat.size);
    const avgSize = (baselineStat.size + currentStat.size) / 2;
    const differencePercentage = (sizeDiff / avgSize) * 100;
    
    return {
      identical: differencePercentage < 0.01,
      differencePercentage,
      pixelsDifferent: Math.floor(sizeDiff / 4), // Rough estimate
      totalPixels: 1280 * 720, // Placeholder
      baselineDimensions: { width: 1280, height: 720 },
      currentDimensions: { width: 1280, height: 720 },
    };
  } catch (error) {
    throw new Error(`Failed to compare images: ${error}`);
  }
}

/**
 * Generate diff image (placeholder - use pixelmatch in production)
 */
async function generateDiffImage(
  baselinePath: string,
  currentPath: string,
  diffPath: string
): Promise<void> {
  // In production, use pixelmatch to generate visual diff
  // For now, just copy current as placeholder
  await fs.copyFile(currentPath, diffPath);
}

// ========================================
// Exports
// ========================================

export default {
  initializeScreenshots,
  captureScreenshot,
  setBaseline,
  compareWithBaseline,
  captureAndCompare,
  getAllMetadata,
  getMetadata,
  listBaselines,
  deleteScreenshot,
};
