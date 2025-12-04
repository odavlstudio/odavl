/**
 * Simple Website Checker - Reliable Basic Checks
 * Works with localhost and production sites
 */

import chalk from 'chalk';
import ora from 'ora';
import { chromium, type Browser, type Page } from 'playwright';
import { getTheme } from './theme.js';

export async function checkWebsiteSimple(url: string): Promise<void> {
  const theme = getTheme();
  
  console.log(theme.colors.primary('\n🌐 Guardian Website Checker\n'));
  console.log(theme.colors.muted(`URL: ${url}`));
  console.log('═'.repeat(60));
  console.log();

  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    // Launch browser
    const spinner = ora('Launching browser...').start();
    browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });
    
    page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });
    spinner.succeed('Browser ready');

    // Navigate to page
    const navSpinner = ora('Loading website...').start();
    const startTime = Date.now();
    
    try {
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      const loadTime = Date.now() - startTime;
      navSpinner.succeed(`Page loaded in ${loadTime}ms`);
    } catch (navError) {
      navSpinner.fail(`Navigation failed: ${(navError as Error).message}`);
      console.log(theme.colors.error('\n❌ Cannot access website. Is it running?\n'));
      return;
    }

    console.log();

    // Check 1: Get page title
    const titleSpinner = ora('Checking title...').start();
    try {
      const title = await page.title();
      if (title && title.trim() !== '') {
        titleSpinner.succeed(`Title: "${title}"`);
      } else {
        titleSpinner.warn('No title found');
      }
    } catch {
      titleSpinner.fail('Title check failed');
    }

    // Check 2: Console errors
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      if (msg.type() === 'warning') consoleWarnings.push(msg.text());
    });

    // Wait a bit for console messages
    await page.waitForTimeout(2000);

    if (consoleErrors.length === 0 && consoleWarnings.length === 0) {
      console.log(theme.colors.success(`✔ Console: No errors or warnings`));
    } else {
      console.log(theme.colors.warning(`⚠ Console: ${consoleErrors.length} errors, ${consoleWarnings.length} warnings`));
      if (consoleErrors.length > 0) {
        console.log(theme.colors.muted('  Errors:'));
        consoleErrors.slice(0, 3).forEach(err => {
          console.log(theme.colors.error(`    • ${err.substring(0, 100)}`));
        });
      }
    }

    // Check 3: Meta description
    const metaSpinner = ora('Checking meta tags...').start();
    try {
      const description = await page.$eval('meta[name="description"]', el => el.getAttribute('content'))
        .catch(() => null);
      
      if (description) {
        metaSpinner.succeed(`Meta description: "${description.substring(0, 60)}..."`);
      } else {
        metaSpinner.warn('No meta description found');
      }
    } catch {
      metaSpinner.fail('Meta check failed');
    }

    // Check 4: Links count
    const linksSpinner = ora('Counting links...').start();
    try {
      const linkCount = await page.$$eval('a[href]', links => links.length);
      linksSpinner.succeed(`Found ${linkCount} links`);
    } catch {
      linksSpinner.fail('Links check failed');
    }

    // Check 5: Images
    const imagesSpinner = ora('Checking images...').start();
    try {
      const imageCount = await page.$$eval('img', imgs => imgs.length);
      const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
      
      if (imagesWithoutAlt === 0) {
        imagesSpinner.succeed(`${imageCount} images (all have alt text)`);
      } else {
        imagesSpinner.warn(`${imageCount} images (${imagesWithoutAlt} missing alt text)`);
      }
    } catch {
      imagesSpinner.fail('Images check failed');
    }

    // Check 6: HTTPS
    if (url.startsWith('https://')) {
      console.log(theme.colors.success('✔ HTTPS: Secure connection'));
    } else if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      console.log(theme.colors.info('ℹ HTTP: Local development (OK)'));
    } else {
      console.log(theme.colors.warning('⚠ HTTP: Not secure (should use HTTPS)'));
    }

    // Summary
    console.log();
    console.log('═'.repeat(60));
    console.log(theme.colors.success('\n✅ Website check complete!\n'));

  } catch (error) {
    console.error(theme.colors.error(`\n❌ Error: ${(error as Error).message}\n`));
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
