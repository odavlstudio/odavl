/**
 * Real Testing Module - Guardian v4.0
 * التحليل الحقيقي بدلاً من simulation
 */

import { chromium, Browser, Page } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

// ============================================================================
// Types
// ============================================================================

export interface RealTestResult {
  success: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  screenshots?: string[];
  aiAnalysis?: string;
}

export interface VSCodeExtensionTest {
  activationTime: number;
  commandsRegistered: string[];
  errors: string[];
  warnings?: string[];
}

export interface WebsiteTest {
  loadTime: number;
  statusCode: number;
  errors: string[];
  performance: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
  };
  screenshots?: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
}

export interface DeviceViewport {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
}

export const DEVICE_PRESETS: Record<string, DeviceViewport> = {
  desktop: {
    name: 'Desktop 1920x1080',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
  },
  tablet: {
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    isMobile: false,
  },
  mobile: {
    name: 'iPhone 12 Pro',
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
  },
};

// ============================================================================
// VS Code Extension Testing (Real)
// ============================================================================

export interface ExtensionHostTestResult {
  launched: boolean;
  activationTime: number;
  commandsExecuted: string[];
  errors: string[];
}

export async function launchExtensionHost(extensionPath: string): Promise<ExtensionHostTestResult> {
  const result: ExtensionHostTestResult = {
    launched: false,
    activationTime: 0,
    commandsExecuted: [],
    errors: [],
  };

  try {
    // Check if 'code' CLI is available
    const startTime = Date.now();
    
    try {
      execSync('code --version', { stdio: 'pipe' });
    } catch {
      result.errors.push('VS Code CLI not found. Install: https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line');
      return result;
    }

    // Try to launch extension host
    try {
      const output = execSync(
        `code --extensionDevelopmentPath="${extensionPath}" --disable-extensions`,
        { 
          encoding: 'utf8',
          timeout: 10000,
          stdio: 'pipe'
        }
      );
      
      result.launched = true;
      result.activationTime = Date.now() - startTime;
      
      // Parse output for activation info (placeholder)
      if (output.includes('Extension activated')) {
        result.commandsExecuted.push('Extension Host launched');
      }
    } catch (error) {
      result.errors.push(`Failed to launch Extension Host: ${(error as Error).message}`);
    }

    return result;
  } catch (error) {
    result.errors.push(`Extension Host test failed: ${(error as Error).message}`);
    return result;
  }
}

export async function testVSCodeExtension(extensionPath: string): Promise<VSCodeExtensionTest> {
  const result: VSCodeExtensionTest = {
    activationTime: 0,
    commandsRegistered: [],
    errors: []
  };

  try {
    // 1. Check extension manifest
    const packageJsonPath = join(extensionPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      result.errors.push('package.json not found');
      return result;
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

    // 2. Extract commands
    if (packageJson.contributes?.commands) {
      result.commandsRegistered = packageJson.contributes.commands.map((cmd: { command: string }) => cmd.command);
    }

    // 3. Check activation events
    if (!packageJson.activationEvents || packageJson.activationEvents.length === 0) {
      result.warnings = ['No activation events defined'];
    }

    // 4. Simulate activation time (في المستقبل: نشغل Extension Host حقيقي)
    const startTime = Date.now();
    
    // Check if dist/ or out/ exists (compiled extension)
    const hasDistFolder = existsSync(join(extensionPath, 'dist')) || existsSync(join(extensionPath, 'out'));
    
    if (!hasDistFolder) {
      result.errors.push('Extension not compiled (no dist/ or out/ folder)');
    }
    
    result.activationTime = Date.now() - startTime;

    return result;
  } catch (error) {
    result.errors.push(`Extension test failed: ${(error as Error).message}`);
    return result;
  }
}

// ============================================================================
// Website Testing with Playwright (Real)
// ============================================================================

export async function captureMultiDeviceScreenshots(
  url: string,
  screenshotDir: string
): Promise<{ desktop: string; tablet: string; mobile: string }> {
  const browser = await chromium.launch({ headless: true });
  const screenshots = { desktop: '', tablet: '', mobile: '' };

  try {
    // Create screenshots directory
    if (!existsSync(screenshotDir)) {
      mkdirSync(screenshotDir, { recursive: true });
    }

    // Capture for each device
    for (const [deviceName, viewport] of Object.entries(DEVICE_PRESETS)) {
      const page = await browser.newPage({
        viewport: {
          width: viewport.width,
          height: viewport.height,
        },
        deviceScaleFactor: viewport.deviceScaleFactor,
        isMobile: viewport.isMobile,
      });

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        const screenshotPath = join(screenshotDir, `${deviceName}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        screenshots[deviceName as keyof typeof screenshots] = screenshotPath;
      } finally {
        await page.close();
      }
    }

    return screenshots;
  } finally {
    await browser.close();
  }
}

export async function testWebsite(url: string, screenshotDir: string): Promise<WebsiteTest> {
  let browser: Browser | null = null;
  let page: Page | null = null;

  const result: WebsiteTest = {
    loadTime: 0,
    statusCode: 0,
    errors: [],
    performance: { fcp: 0, lcp: 0, cls: 0 }
  };

  try {
    // Create screenshots directory
    if (!existsSync(screenshotDir)) {
      mkdirSync(screenshotDir, { recursive: true });
    }

    // Launch browser
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        result.errors.push(`Console error: ${msg.text()}`);
      }
    });

    // Track page errors
    page.on('pageerror', (error) => {
      result.errors.push(`Page error: ${error.message}`);
    });

    // Measure load time
    const startTime = Date.now();
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    result.loadTime = Date.now() - startTime;
    result.statusCode = response?.status() || 0;

    // Capture performance metrics
    const metrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint');
      
      return {
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        lcp: 0, // يحتاج observer خاص
        cls: 0  // يحتاج observer خاص
      };
    });

    result.performance = metrics;

    // Take multi-device screenshots
    await page.close();
    await browser.close();
    browser = null;
    page = null;

    const screenshots = await captureMultiDeviceScreenshots(url, screenshotDir);
    result.screenshots = screenshots;

    return result;
  } catch (error) {
    result.errors.push(`Website test failed: ${(error as Error).message}`);
    return result;
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// ============================================================================
// Visual Regression Testing (TODO #3)
// ============================================================================

export interface ScreenshotComparison {
  device: string;
  baselinePath: string;
  currentPath: string;
  diffPath: string;
  pixelDiffCount: number;
  percentageDiff: number;
  hasDifference: boolean;
}

export async function compareScreenshots(
  baselineDir: string,
  currentDir: string,
  outputDir: string
): Promise<ScreenshotComparison[]> {
  const comparisons: ScreenshotComparison[] = [];
  
  // Create output directory for diffs
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Compare each device type
  for (const device of ['desktop', 'tablet', 'mobile']) {
    const baselinePath = join(baselineDir, `${device}.png`);
    const currentPath = join(currentDir, `${device}.png`);
    const diffPath = join(outputDir, `${device}-diff.png`);

    if (!existsSync(baselinePath) || !existsSync(currentPath)) {
      continue; // Skip if files don't exist
    }

    // Simple pixel comparison (في المستقبل: استخدام pixelmatch library)
    const baseline = await readFile(baselinePath);
    const current = await readFile(currentPath);
    
    const hasDifference = !baseline.equals(current);
    const pixelDiffCount = hasDifference ? 1000 : 0; // Placeholder
    const percentageDiff = hasDifference ? 5.0 : 0.0; // Placeholder

    if (hasDifference) {
      // Save diff (currently just copy current, في المستقبل: highlight differences)
      await writeFile(diffPath, current);
    }

    comparisons.push({
      device,
      baselinePath,
      currentPath,
      diffPath: hasDifference ? diffPath : '',
      pixelDiffCount,
      percentageDiff,
      hasDifference,
    });
  }

  return comparisons;
}

export async function saveAsBaseline(screenshotDir: string, baselineDir: string): Promise<void> {
  if (!existsSync(baselineDir)) {
    mkdirSync(baselineDir, { recursive: true });
  }

  for (const device of ['desktop', 'tablet', 'mobile']) {
    const sourcePath = join(screenshotDir, `${device}.png`);
    const targetPath = join(baselineDir, `${device}.png`);

    if (existsSync(sourcePath)) {
      const content = await readFile(sourcePath);
      await writeFile(targetPath, content);
    }
  }
}

// ============================================================================
// CLI Tool Testing (Real)
// ============================================================================

export async function testCLITool(cliPath: string): Promise<RealTestResult> {
  const result: RealTestResult = {
    success: true,
    duration: 0,
    errors: [],
    warnings: []
  };

  try {
    const startTime = Date.now();

    // 1. Check if CLI is executable
    const packageJsonPath = join(cliPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      result.errors.push('package.json not found');
      result.success = false;
      return result;
    }

    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

    // 2. Check bin entry
    if (!packageJson.bin) {
      result.errors.push('No "bin" entry in package.json');
      result.success = false;
    }

    // 3. Try running --help
    try {
      const binPath = Object.values(packageJson.bin || {})[0] as string;
      const fullBinPath = join(cliPath, binPath);
      
      if (existsSync(fullBinPath)) {
        // Test help command
        execSync(`node "${fullBinPath}" --help`, { 
          encoding: 'utf8',
          timeout: 5000 
        });
      } else {
        result.errors.push(`Binary not found: ${fullBinPath}`);
        result.success = false;
      }
    } catch (error) {
      result.errors.push(`CLI execution failed: ${(error as Error).message}`);
      result.success = false;
    }

    result.duration = Date.now() - startTime;
    return result;
  } catch (error) {
    result.errors.push(`CLI test failed: ${(error as Error).message}`);
    result.success = false;
    return result;
  }
}

// ============================================================================
// AI Visual Analysis with Claude (Real)
// ============================================================================

export async function analyzeScreenshotWithAI(
  screenshotPath: string,
  apiKey: string
): Promise<string> {
  try {
    if (!existsSync(screenshotPath)) {
      return 'Screenshot not found';
    }

    const anthropic = new Anthropic({ apiKey });

    // Read screenshot
    const imageBuffer = await readFile(screenshotPath);
    const base64Image = imageBuffer.toString('base64');

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: `Analyze this UI screenshot for:
1. Layout issues (misaligned elements, overlapping content)
2. Visual bugs (broken images, missing styles)
3. Accessibility problems (poor contrast, tiny fonts)
4. Overall design quality

Provide specific, actionable feedback in Arabic and English.`
            }
          ]
        }
      ]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : 'No analysis available';
  } catch (error) {
    return `AI analysis failed: ${(error as Error).message}`;
  }
}

// ============================================================================
// Real Error Log Analysis with AI (Enhanced with Stack Trace Visualization)
// ============================================================================

export interface ParsedStackTrace {
  error: string;
  message: string;
  stack: {
    file: string;
    line: number;
    column: number;
    function: string;
  }[];
}

export function parseStackTrace(errorText: string): ParsedStackTrace {
  const lines = errorText.split('\n');
  const errorLine = lines[0] || '';
  
  // Extract error type and message
  const match = errorLine.match(/^(\w+Error):\s*(.+)$/);
  const error = match?.[1] || 'Error';
  const message = match?.[2] || errorLine;

  // Parse stack trace
  const stack: ParsedStackTrace['stack'] = [];
  const stackRegex = /at\s+(?:(.+?)\s+\()?([^:]+):(\d+):(\d+)/;

  for (const line of lines.slice(1)) {
    const stackMatch = line.match(stackRegex);
    if (stackMatch) {
      stack.push({
        function: stackMatch[1] || 'anonymous',
        file: stackMatch[2],
        line: parseInt(stackMatch[3], 10),
        column: parseInt(stackMatch[4], 10),
      });
    }
  }

  return { error, message, stack };
}

export function visualizeStackTrace(parsed: ParsedStackTrace): string {
  let output = `\n┌─ ${parsed.error}: ${parsed.message}\n`;
  
  parsed.stack.forEach((frame, index) => {
    const isLast = index === parsed.stack.length - 1;
    const prefix = isLast ? '└─' : '├─';
    output += `${prefix} at ${frame.function}\n`;
    output += `${isLast ? '   ' : '│  '}   ${frame.file}:${frame.line}:${frame.column}\n`;
  });

  return output;
}

export async function analyzeErrorLogsWithAI(
  errors: string[],
  apiKey: string
): Promise<{ analysis: string; fixes: string[] }> {
  try {
    if (errors.length === 0) {
      return { analysis: 'No errors found', fixes: [] };
    }

    const anthropic = new Anthropic({ apiKey });

    const errorText = errors.join('\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Analyze these runtime errors and provide solutions:

${errorText}

For each error, provide:
1. Root cause analysis
2. Step-by-step fix
3. Prevention tips

Respond in both Arabic and English.`
        }
      ]
    });

    const content = response.content[0];
    const analysisText = content.type === 'text' ? content.text : 'No analysis';

    // Extract fixes (simple parsing)
    const fixes = analysisText.split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => line.trim());

    return { analysis: analysisText, fixes };
  } catch (error) {
    return {
      analysis: `AI analysis failed: ${(error as Error).message}`,
      fixes: []
    };
  }
}

// ============================================================================
// Comprehensive Real Test Runner
// ============================================================================

export async function runRealTests(
  projectPath: string,
  projectType: 'extension' | 'website' | 'cli',
  anthropicApiKey?: string
): Promise<RealTestResult> {
  const result: RealTestResult = {
    success: true,
    duration: 0,
    errors: [],
    warnings: [],
    screenshots: []
  };

  const startTime = Date.now();

  try {
    switch (projectType) {
      case 'extension': {
        const extResult = await testVSCodeExtension(projectPath);
        result.errors = extResult.errors;
        result.success = extResult.errors.length === 0;
        break;
      }

      case 'website': {
        // نحتاج URL - نستخدم localhost:3000 كمثال
        const screenshotDir = join(projectPath, '.odavl', 'guardian', 'screenshots');
        const webResult = await testWebsite('http://localhost:3000', screenshotDir);
        result.errors = webResult.errors;
        result.success = webResult.statusCode === 200 && webResult.errors.length === 0;
        
        // Multi-device screenshots
        if (webResult.screenshots) {
          result.screenshots = [
            webResult.screenshots.desktop,
            webResult.screenshots.tablet,
            webResult.screenshots.mobile,
          ].filter(Boolean);
        }

        // AI Analysis if API key provided
        if (anthropicApiKey && result.screenshots && result.screenshots.length > 0) {
          result.aiAnalysis = await analyzeScreenshotWithAI(result.screenshots[0], anthropicApiKey);
        }
        break;
      }

      case 'cli': {
        const cliResult = await testCLITool(projectPath);
        result.errors = cliResult.errors;
        result.success = cliResult.success;
        break;
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  } catch (error) {
    result.errors.push(`Real test failed: ${(error as Error).message}`);
    result.success = false;
    result.duration = Date.now() - startTime;
    return result;
  }
}
