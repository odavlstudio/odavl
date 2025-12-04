/**
 * ODAVL Guardian v4.0 - Multi-Platform Testing Example
 * 
 * Demonstrates how Guardian uses GitHub Actions to test on multiple platforms.
 * Shows platform-specific bug detection workflow.
 * 
 * ⚠️ GUARDIAN BOUNDARY: Guardian detects issues ONLY.
 * Use Autopilot to execute fixes.
 * 
 * @example
 */

import { MultiPlatformTester } from '../agents/multi-platform-tester';
import type { PlatformReport } from '../agents/multi-platform-tester';

/**
 * Example: Multi-Platform Testing Workflow
 * 
 * This example shows how Guardian tests extensions across:
 * - Windows (windows-latest)
 * - macOS (macos-latest)
 * - Linux (ubuntu-latest)
 * 
 * Guardian's role: Detect platform-specific bugs
 * Autopilot's role: Execute fixes safely
 */
async function runMultiPlatformTest() {
  console.log('═════════════════════════════════════════════════════════');
  console.log('🌐 ODAVL Guardian v4.0 - Multi-Platform Testing Example');
  console.log('═════════════════════════════════════════════════════════\n');

  try {
    // Initialize tester with GitHub token
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      console.error('❌ Error: GITHUB_TOKEN environment variable not set');
      console.log('\n💡 To run this example:');
      console.log('   export GITHUB_TOKEN=your_github_token');
      console.log('   pnpm tsx examples/multi-platform-example.ts');
      return;
    }

    const tester = new MultiPlatformTester(githubToken);

    // Check if GitHub Actions is available
    console.log('🔍 Checking GitHub Actions availability...');
    const available = await tester.checkAvailability();
    
    if (!available) {
      console.log('⚠️  GitHub Actions not available - using local testing mode');
      console.log('   (In production, this would trigger CI/CD workflows)');
      console.log('');
      
      // Show mock results for demonstration
      showMockResults();
      return;
    }

    console.log('✅ GitHub Actions available');
    console.log('');

    // Test Guardian extension on all platforms
    console.log('📦 Testing ODAVL Guardian Extension...');
    console.log('   Path: odavl-studio/guardian/extension');
    console.log('   Platforms: Windows, macOS, Linux');
    console.log('');

    const reports = await tester.testOnAllPlatforms(
      'odavl-studio/guardian/extension'
    );

    console.log('\n═════════════════════════════════════════════════════════');
    console.log('📊 MULTI-PLATFORM TEST RESULTS');
    console.log('═════════════════════════════════════════════════════════\n');

    // Display results for each platform
    for (const report of reports) {
      displayPlatformReport(report);
    }

    // Analyze results
    analyzeResults(reports, tester);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Test failed: ${errorMessage}`);
    
    if (error instanceof Error && error.stack) {
      console.error(`\nStack trace:\n${error.stack}`);
    }
  }
}

/**
 * Display report for a single platform
 */
function displayPlatformReport(report: PlatformReport): void {
  const platformName = report.platform.charAt(0).toUpperCase() + report.platform.slice(1);
  const statusIcon = report.success ? '✅' : '❌';
  
  console.log(`${statusIcon} ${platformName}:`);
  console.log(`   Tests Passed: ${report.results.passed}`);
  console.log(`   Tests Failed: ${report.results.failed}`);
  console.log(`   Duration: ${(report.duration / 1000).toFixed(1)}s`);
  
  if (report.results.errors.length > 0) {
    console.log(`\n   ⚠️  Errors:`);
    report.results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  if (report.results.warnings.length > 0) {
    console.log(`\n   ⚠️  Warnings:`);
    report.results.warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }
  
  if (report.logs) {
    console.log(`\n   📋 Logs: ${report.logs}`);
  }
  
  console.log('');
}

/**
 * Analyze results and detect platform-specific issues
 */
function analyzeResults(reports: PlatformReport[], tester: MultiPlatformTester): void {
  console.log('═════════════════════════════════════════════════════════');
  console.log('🔍 PLATFORM-SPECIFIC ISSUE DETECTION');
  console.log('═════════════════════════════════════════════════════════\n');

  // Detect platform-specific bugs
  const platformBugs = tester.detectPlatformSpecificIssues(reports);
  
  if (platformBugs.length > 0) {
    console.log(`⚠️  Found ${platformBugs.length} platform-specific issue(s):\n`);
    
    platformBugs.forEach((bug, index) => {
      console.log(`${index + 1}. [${bug.severity.toUpperCase()}] ${bug.message}`);
      
      if (bug.affectedFiles && bug.affectedFiles.length > 0) {
        console.log(`   Affected files: ${bug.affectedFiles.join(', ')}`);
      }
      
      console.log(`   Platform-specific: ${bug.platformSpecific ? 'YES ⚠️' : 'NO'}`);
      console.log(`   Reproducible: ${bug.reproducible ? 'YES' : 'NO'}`);
      console.log('');
    });
  } else {
    console.log('✅ No platform-specific issues detected!');
    console.log('   All platforms behaving consistently.');
    console.log('');
  }

  // Calculate overall readiness
  const readiness = tester.calculateReadiness(reports);
  
  console.log('═════════════════════════════════════════════════════════');
  console.log('📊 OVERALL READINESS SCORE');
  console.log('═════════════════════════════════════════════════════════\n');
  
  console.log(`   Readiness: ${readiness}%`);
  
  if (readiness >= 90) {
    console.log(`   Status: ✅ READY FOR MULTI-PLATFORM DEPLOYMENT`);
  } else if (readiness >= 70) {
    console.log(`   Status: ⚠️  MINOR ISSUES - Review before deployment`);
  } else {
    console.log(`   Status: ❌ CRITICAL ISSUES - Do NOT deploy`);
  }
  
  console.log('');

  // Guardian → Autopilot workflow
  console.log('═════════════════════════════════════════════════════════');
  console.log('🛡️  GUARDIAN → AUTOPILOT WORKFLOW');
  console.log('═════════════════════════════════════════════════════════\n');

  if (platformBugs.length > 0 || readiness < 90) {
    console.log('🔍 Guardian detected issues across platforms.');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Review platform-specific issues above');
    console.log('   2. Check logs for each platform');
    console.log('   3. Use ODAVL Autopilot to apply fixes:');
    console.log('');
    console.log('      $ odavl autopilot run');
    console.log('');
    console.log('   4. Re-run multi-platform tests to verify:');
    console.log('');
    console.log('      $ odavl guardian test:multiplatform');
    console.log('');
    console.log('⚠️  Guardian Role: Detect + Suggest (NEVER execute)');
    console.log('✅ Autopilot Role: Execute fixes safely with O-D-A-V-L cycle');
  } else {
    console.log('✅ All platforms passing!');
    console.log('   Ready for multi-platform deployment.');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Publish to VS Code Marketplace');
    console.log('   2. Tag release: git tag guardian-v4.0.0');
    console.log('   3. Monitor production metrics');
  }
  
  console.log('');
  console.log('═════════════════════════════════════════════════════════\n');
}

/**
 * Show mock results for demonstration (when GitHub Actions unavailable)
 */
function showMockResults(): void {
  console.log('═════════════════════════════════════════════════════════');
  console.log('📊 MOCK RESULTS (Demonstration Mode)');
  console.log('═════════════════════════════════════════════════════════\n');

  const mockReports: PlatformReport[] = [
    {
      platform: 'windows-latest',
      success: false,
      results: {
        passed: 8,
        failed: 2,
        errors: [
          'EACCES: permission denied, open C:\\temp\\odavl-test',
          'Path too long: C:\\Users\\user\\...\\very\\long\\path'
        ],
        warnings: [
          'Slow file system operations on NTFS'
        ]
      },
      logs: 'https://github.com/odavl-studio/odavl/actions/runs/mock-windows',
      duration: 52000
    },
    {
      platform: 'macos-latest',
      success: true,
      results: {
        passed: 10,
        failed: 0,
        errors: [],
        warnings: []
      },
      logs: 'https://github.com/odavl-studio/odavl/actions/runs/mock-macos',
      duration: 45000
    },
    {
      platform: 'ubuntu-latest',
      success: true,
      results: {
        passed: 10,
        failed: 0,
        errors: [],
        warnings: []
      },
      logs: 'https://github.com/odavl-studio/odavl/actions/runs/mock-linux',
      duration: 38000
    }
  ];

  // Display mock results
  for (const report of mockReports) {
    displayPlatformReport(report);
  }

  // Mock analysis
  console.log('═════════════════════════════════════════════════════════');
  console.log('🔍 PLATFORM-SPECIFIC ISSUE DETECTION');
  console.log('═════════════════════════════════════════════════════════\n');

  console.log('⚠️  Found 2 platform-specific issues:\n');
  console.log('1. [HIGH] [windows-latest] EACCES: permission denied');
  console.log('   Platform-specific: YES ⚠️');
  console.log('   Reproducible: YES');
  console.log('   Fix: Use proper Windows file permissions');
  console.log('');
  console.log('2. [HIGH] [windows-latest] Path too long');
  console.log('   Platform-specific: YES ⚠️');
  console.log('   Reproducible: YES');
  console.log('   Fix: Enable long path support in Windows Registry');
  console.log('');

  console.log('═════════════════════════════════════════════════════════');
  console.log('📊 OVERALL READINESS SCORE');
  console.log('═════════════════════════════════════════════════════════\n');
  console.log('   Readiness: 80%');
  console.log('   Status: ⚠️  MINOR ISSUES - Review before deployment');
  console.log('');

  console.log('═════════════════════════════════════════════════════════');
  console.log('🛡️  GUARDIAN → AUTOPILOT WORKFLOW');
  console.log('═════════════════════════════════════════════════════════\n');
  console.log('🔍 Guardian detected platform-specific Windows issues.');
  console.log('');
  console.log('📝 Suggested Fixes:');
  console.log('   1. Add Windows-specific file permission handling');
  console.log('   2. Enable long path support in extension manifest');
  console.log('   3. Add platform detection in file operations');
  console.log('');
  console.log('🤖 Use Autopilot to apply fixes:');
  console.log('');
  console.log('   $ odavl autopilot run');
  console.log('');
  console.log('⚠️  Guardian detects ONLY (no execution)');
  console.log('✅ Autopilot executes fixes safely');
  console.log('');
  console.log('═════════════════════════════════════════════════════════\n');
}

export { runMultiPlatformTest, displayPlatformReport, analyzeResults };

// Run example if executed directly
runMultiPlatformTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

/**
 * Example Output:
 * 
 * ═════════════════════════════════════════════════════════
 * 🌐 ODAVL Guardian v4.0 - Multi-Platform Testing Example
 * ═════════════════════════════════════════════════════════
 * 
 * 🔍 Checking GitHub Actions availability...
 * ✅ GitHub Actions available
 * 
 * 📦 Testing ODAVL Guardian Extension...
 *    Path: odavl-studio/guardian/extension
 *    Platforms: Windows, macOS, Linux
 * 
 * ═════════════════════════════════════════════════════════
 * 📊 MULTI-PLATFORM TEST RESULTS
 * ═════════════════════════════════════════════════════════
 * 
 * ❌ Windows-latest:
 *    Tests Passed: 8
 *    Tests Failed: 2
 *    Duration: 52.0s
 * 
 *    ⚠️  Errors:
 *    1. EACCES: permission denied, open C:\temp\odavl-test
 *    2. Path too long: C:\Users\user\...\very\long\path
 * 
 * ✅ macOS-latest:
 *    Tests Passed: 10
 *    Tests Failed: 0
 *    Duration: 45.0s
 * 
 * ✅ Ubuntu-latest:
 *    Tests Passed: 10
 *    Tests Failed: 0
 *    Duration: 38.0s
 * 
 * ═════════════════════════════════════════════════════════
 * 🔍 PLATFORM-SPECIFIC ISSUE DETECTION
 * ═══════════════════════════════════════════════════════════
 * 
 * ⚠️  Found 2 platform-specific issues:
 * 
 * 1. [HIGH] [windows-latest] EACCES: permission denied
 *    Platform-specific: YES ⚠️
 *    Reproducible: YES
 * 
 * 2. [HIGH] [windows-latest] Path too long
 *    Platform-specific: YES ⚠️
 *    Reproducible: YES
 * 
 * ═════════════════════════════════════════════════════════
 * 📊 OVERALL READINESS SCORE
 * ═════════════════════════════════════════════════════════
 * 
 *    Readiness: 80%
 *    Status: ⚠️  MINOR ISSUES - Review before deployment
 * 
 * ═════════════════════════════════════════════════════════
 * 🛡️  GUARDIAN → AUTOPILOT WORKFLOW
 * ═════════════════════════════════════════════════════════
 * 
 * 🔍 Guardian detected issues across platforms.
 * 
 * 📝 Next Steps:
 *    1. Review platform-specific issues above
 *    2. Check logs for each platform
 *    3. Use ODAVL Autopilot to apply fixes:
 * 
 *       $ odavl autopilot run
 * 
 *    4. Re-run multi-platform tests to verify:
 * 
 *       $ odavl guardian test:multiplatform
 * 
 * ⚠️  Guardian Role: Detect + Suggest (NEVER execute)
 * ✅ Autopilot Role: Execute fixes safely with O-D-A-V-L cycle
 */
