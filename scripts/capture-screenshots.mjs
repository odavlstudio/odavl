#!/usr/bin/env node

/**
 * 📸 ODAVL Studio - Screenshot Capture with Puppeteer
 * Automated screenshot generation for Product Hunt
 */

import puppeteer from 'puppeteer';
import { mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'http://localhost:3001';
const OUTPUT_DIR = join(__dirname, '../sales/screenshots');
const WIDTH = 1920;
const HEIGHT = 1080;

const screenshots = [
  {
    name: '01-hero-dashboard',
    url: `${BASE_URL}/global-insight`,
    description: 'Global Insight Dashboard - Hero view',
    wait: 3000,
  },
  {
    name: '02-detector-grid',
    url: `${BASE_URL}/global-insight`,
    description: '12 Detector Cards',
    wait: 2000,
    scroll: 400,
  },
  {
    name: '03-error-details',
    url: `${BASE_URL}/errors`,
    description: 'Error Details with Fix Recommendations',
    wait: 2000,
  },
  {
    name: '04-guardian-results',
    url: `${BASE_URL}/guardian`,
    description: 'Guardian Test Results Table',
    wait: 2000,
  },
  {
    name: '05-guardian-summary',
    url: `${BASE_URL}/guardian`,
    description: 'Guardian Summary Cards',
    wait: 2000,
    scroll: 300,
  },
  {
    name: '06-beta-signup',
    url: `${BASE_URL}/beta`,
    description: 'Beta Signup Landing Page',
    wait: 2000,
  },
  {
    name: '07-dark-mode',
    url: `${BASE_URL}/global-insight`,
    description: 'Dark Mode Dashboard',
    wait: 2000,
    darkMode: true,
  },
  {
    name: '08-dashboard-light',
    url: `${BASE_URL}/dashboard`,
    description: 'Main Dashboard View',
    wait: 2000,
  },
  {
    name: '09-autopilot-placeholder',
    url: `${BASE_URL}/autopilot`,
    description: 'Autopilot Page (if exists)',
    wait: 2000,
    optional: true,
  },
  {
    name: '10-settings-placeholder',
    url: `${BASE_URL}/settings`,
    description: 'Settings Page (if exists)',
    wait: 2000,
    optional: true,
  },
];

async function ensureDirectory(dir) {
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function captureScreenshot(browser, shot) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });

  console.log(`\n📷 Capturing: ${shot.name}`);
  console.log(`   URL: ${shot.url}`);
  console.log(`   Description: ${shot.description}`);

  try {
    // Navigate
    const response = await page.goto(shot.url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    if (!response.ok() && !shot.optional) {
      console.log(`   ⚠️  Page returned status: ${response.status()}`);
    }

    // Wait for content
    await new Promise(resolve => setTimeout(resolve, shot.wait));

    // Dark mode toggle
    if (shot.darkMode) {
      try {
        // Look for theme toggle button
        await page.evaluate(() => {
          const toggleButton = document.querySelector('[data-theme-toggle]') ||
                              document.querySelector('button[aria-label*="theme"]') ||
                              document.querySelector('button[aria-label*="Theme"]');
          if (toggleButton) toggleButton.click();
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.log(`   ⚠️  Could not toggle dark mode: ${e.message}`);
      }
    }

    // Scroll
    if (shot.scroll) {
      await page.evaluate((scrollY) => {
        window.scrollTo(0, scrollY);
      }, shot.scroll);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Capture
    const outputPath = join(OUTPUT_DIR, `${shot.name}.png`);
    await page.screenshot({
      path: outputPath,
      fullPage: false,
    });

    // Check file size
    const { size } = await import('fs/promises').then(m => m.stat(outputPath));
    const sizeKB = Math.round(size / 1024);
    console.log(`   ✅ Saved: ${shot.name}.png (${sizeKB} KB)`);

    if (sizeKB > 500) {
      console.log(`   ⚠️  File size > 500KB, consider compressing with TinyPNG`);
    }
  } catch (error) {
    if (shot.optional) {
      console.log(`   ⏭️  Skipped (optional): ${error.message}`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('📸 ODAVL Studio - Screenshot Capture Automation');
  console.log('═══════════════════════════════════════════════');
  console.log('');

  // Ensure output directory
  await ensureDirectory(OUTPUT_DIR);
  console.log(`✅ Output directory: ${OUTPUT_DIR}`);

  // Launch browser
  console.log('🌐 Launching Chrome...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    // Capture all screenshots
    for (const shot of screenshots) {
      await captureScreenshot(browser, shot);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ Screenshot Capture Complete!');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Screenshots: ${screenshots.filter(s => !s.optional).length} required, ${screenshots.filter(s => s.optional).length} optional`);
    console.log(`   Output: ${OUTPUT_DIR}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Review screenshots in sales/screenshots/');
    console.log('   2. Compress images > 500KB with TinyPNG');
    console.log('   3. Upload to Product Hunt');
    console.log('');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('🛑 Browser closed');
  }
}

main().catch(console.error);
