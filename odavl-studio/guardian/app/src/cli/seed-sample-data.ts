/**
 * Sample Data Generator CLI
 * 
 * Week 12: Beta Launch - Sample Test Data
 * 
 * Command-line utility for generating sample data.
 * 
 * Usage:
 *   pnpm guardian:seed <organizationId> [options]
 * 
 * Options:
 *   --test-runs <count>    Number of test runs to generate (default: 10)
 *   --monitors <count>     Number of monitors to generate (default: 5)
 *   --api-keys             Generate sample API keys
 *   --template <type>      Create sample project template (playwright|cypress|jest)
 *   --cleanup              Remove all sample data
 */

import { generateSampleData, createSampleProject, cleanupSampleData } from '../lib/sample-data';

interface CliOptions {
    organizationId: string;
    testRuns?: number;
    monitors?: number;
    apiKeys?: boolean;
    template?: 'playwright' | 'cypress' | 'jest';
    cleanup?: boolean;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0 || args[0] === '--help') {
        printHelp();
        process.exit(0);
    }

    const options: CliOptions = {
        organizationId: args[0],
        testRuns: 10,
        monitors: 5,
        apiKeys: false,
        cleanup: false,
    };

    // Parse command-line arguments
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--test-runs':
                options.testRuns = parseInt(args[++i], 10);
                break;
            case '--monitors':
                options.monitors = parseInt(args[++i], 10);
                break;
            case '--api-keys':
                options.apiKeys = true;
                break;
            case '--template':
                options.template = args[++i] as 'playwright' | 'cypress' | 'jest';
                break;
            case '--cleanup':
                options.cleanup = true;
                break;
            default:
                console.error(`Unknown option: ${arg}`);
                printHelp();
                process.exit(1);
        }
    }

    try {
        if (options.cleanup) {
            console.log('🧹 Cleaning up sample data...');
            await cleanupSampleData(options.organizationId);
            console.log('✅ Sample data removed successfully');
            return;
        }

        console.log('🌱 Generating sample data...');
        console.log(`Organization ID: ${options.organizationId}`);
        console.log(`Test Runs: ${options.testRuns}`);
        console.log(`Monitors: ${options.monitors}`);
        console.log(`API Keys: ${options.apiKeys}`);
        console.log('');

        const results = await generateSampleData({
            organizationId: options.organizationId,
            testRunCount: options.testRuns,
            monitorCount: options.monitors,
            includeApiKeys: options.apiKeys,
        });

        console.log('\n📊 Sample Data Summary:');
        console.log(`✓ Test Runs: ${results.testRuns.length}`);
        console.log(`✓ Monitors: ${results.monitors.length}`);
        console.log(`✓ API Keys: ${results.apiKeys.length}`);

        if (options.template) {
            console.log(`\n📦 Creating ${options.template} template project...`);
            const project = await createSampleProject(options.organizationId, options.template);
            console.log(`✓ Created project: ${project.name}`);
            console.log(`  - Framework: ${project.framework}`);
            console.log(`  - Sample Tests: ${project.sampleTests.length}`);
        }

        console.log('\n✅ Sample data generated successfully!');
        console.log('\n💡 Tip: Use --cleanup to remove all sample data');
    } catch (error) {
        console.error('❌ Error generating sample data:', error);
        process.exit(1);
    }
}

function printHelp() {
    console.log(`
Guardian Sample Data Generator

Usage:
  pnpm guardian:seed <organizationId> [options]

Options:
  --test-runs <count>    Number of test runs to generate (default: 10)
  --monitors <count>     Number of monitors to generate (default: 5)
  --api-keys             Generate sample API keys
  --template <type>      Create sample project template (playwright|cypress|jest)
  --cleanup              Remove all sample data
  --help                 Show this help message

Examples:
  # Generate 20 test runs and 10 monitors
  pnpm guardian:seed org_123 --test-runs 20 --monitors 10

  # Generate complete sample data with API keys
  pnpm guardian:seed org_123 --test-runs 15 --monitors 8 --api-keys

  # Create Playwright template project
  pnpm guardian:seed org_123 --template playwright

  # Cleanup all sample data
  pnpm guardian:seed org_123 --cleanup
`);
}

main();
