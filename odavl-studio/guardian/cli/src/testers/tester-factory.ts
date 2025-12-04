/**
 * Tester Factory - Dynamically loads testers based on type
 */

import { WebsiteTester } from './website-tester.js';
import { ExtensionTester } from './extension-tester.js';
import { CLITester } from './cli-tester.js';
import { PackageTester } from './package-tester.js';
import { MonorepoTester } from './monorepo-tester.js';

export type TesterType = 'website' | 'extension' | 'cli' | 'package' | 'monorepo';

export type TesterInstance =
  | WebsiteTester
  | ExtensionTester
  | CLITester
  | PackageTester
  | MonorepoTester;

/**
 * Get tester instance by type
 */
export async function getTester(type: TesterType): Promise<TesterInstance> {
  switch (type) {
    case 'website':
      return new WebsiteTester();
    case 'extension':
      return new ExtensionTester();
    case 'cli':
      return new CLITester();
    case 'package':
      return new PackageTester();
    case 'monorepo':
      return new MonorepoTester();
    default:
      throw new Error(`Unknown tester type: ${type}`);
  }
}
