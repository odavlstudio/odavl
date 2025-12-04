/**
 * Test script for ODAVL Guardian Screenshot System
 * Run: pnpm tsx scripts/test-screenshots.ts
 * 
 * Note: Requires Playwright to be installed
 * pnpm add -D playwright
 * pnpm playwright install chromium
 */

import { chromium } from 'playwright';
import {
  initializeScreenshots,
  captureScreenshot,
  setBaseline,
  compareWithBaseline,
  captureAndCompare,
  getAllMetadata,
  listBaselines,
  deleteScreenshot,
} from '../odavl-studio/guardian/core/src/screenshot-manager';

async function main() {
  console.log('📸 Testing ODAVL Guardian Screenshot System\n');
  
  // 1. Initialize
  console.log('1️⃣ Initializing screenshot system...');
  await initializeScreenshots();
  console.log('   ✅ Initialized\n');
  
  // 2. Launch browser
  console.log('2️⃣ Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  console.log('   ✅ Browser launched\n');
  
  // 3. Capture screenshot of example.com
  console.log('3️⃣ Capturing screenshot of example.com...');
  await page.goto('https://example.com');
  await captureScreenshot(page, {
    name: 'example-homepage',
    fullPage: true,
    delay: 500,
  });
  console.log('   ✅ Screenshot captured\n');
  
  // 4. Set as baseline
  console.log('4️⃣ Setting as baseline...');
  await setBaseline('example-homepage');
  console.log('   ✅ Baseline set\n');
  
  // 5. Capture again and compare
  console.log('5️⃣ Capturing again and comparing...');
  await page.goto('https://example.com');
  const result = await captureAndCompare(
    page,
    { name: 'example-homepage', fullPage: true, delay: 500 },
    0.1
  );
  
  if (result) {
    console.log(`   Comparison result:`);
    console.log(`   - Identical: ${result.identical}`);
    console.log(`   - Difference: ${result.differencePercentage.toFixed(4)}%`);
    console.log(`   - Pixels different: ${result.pixelsDifferent}`);
    if (result.diffImagePath) {
      console.log(`   - Diff image: ${result.diffImagePath}`);
    }
  } else {
    console.log('   ℹ️  No baseline comparison (first capture)');
  }
  console.log('');
  
  // 6. Test with different viewport
  console.log('6️⃣ Testing mobile viewport...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://example.com');
  await captureScreenshot(page, {
    name: 'example-mobile',
    fullPage: true,
    viewport: { width: 375, height: 667 },
  });
  await setBaseline('example-mobile');
  console.log('   ✅ Mobile screenshot captured\n');
  
  // 7. Get all metadata
  console.log('7️⃣ Getting all metadata...');
  const allMetadata = await getAllMetadata();
  console.log(`   Total screenshots: ${allMetadata.length}`);
  for (const meta of allMetadata) {
    console.log(`   - ${meta.name}: ${meta.url} (${(meta.size / 1024).toFixed(2)} KB)`);
  }
  console.log('');
  
  // 8. List baselines
  console.log('8️⃣ Listing baselines...');
  const baselines = await listBaselines();
  console.log(`   Baselines: ${baselines.join(', ')}`);
  console.log('');
  
  // 9. Cleanup (optional)
  console.log('9️⃣ Cleaning up test screenshots...');
  for (const baseline of baselines) {
    await deleteScreenshot(baseline);
  }
  console.log('   ✅ Cleaned up\n');
  
  // 10. Close browser
  await browser.close();
  console.log('✅ All tests passed!');
  console.log('\n📂 Check .odavl/guardian/screenshots/ for generated files');
  console.log('   - baseline/  → Reference screenshots');
  console.log('   - current/   → Latest captures');
  console.log('   - diffs/     → Visual differences');
  console.log('   - metadata.json → Screenshot metadata');
}

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
