/**
 * ODAVL CLI - Publish Command
 * Integrates marketplace SDK for extension publishing
 */

import { Command } from 'commander';
import { Publisher, ManifestBuilder, ManifestValidator } from '@odavl-studio/sdk-marketplace';

export function registerPublishCommand(program: Command): void {
  program
    .command('publish')
    .description('Publish package to ODAVL marketplace')
    .argument('<type>', 'Package type: detector|recipe|rule|model')
    .argument('<path>', 'Path to package directory')
    .option('--registry <url>', 'Registry URL', 'http://localhost:8085')
    .option('--dry-run', 'Validate without publishing')
    .option('--api-key <key>', 'API key for authentication')
    .action(async (type, path, options) => {
      console.log(`📦 Publishing ${type} from ${path}...`);

      const publisher = new Publisher(options.registry);
      const validator = new ManifestValidator();

      try {
        const pkg = await publisher.createPackage(path, type);
        const validation = validator.validate(pkg);

        if (!validation.valid) {
          console.error('❌ Validation failed:', validation.errors);
          process.exit(1);
        }

        if (validation.warnings.length > 0) {
          console.warn('⚠️  Warnings:', validation.warnings);
        }

        const result = await publisher.publishToRegistry(pkg, {
          registryUrl: options.registry,
          apiKey: options.apiKey,
          dryRun: options.dryRun,
        });

        if (result.success) {
          console.log(`✅ Published successfully! Package ID: ${result.packageId}`);
        } else {
          console.error('❌ Publish failed:', result.errors);
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
