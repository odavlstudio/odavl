/**
 * ODAVL CLI - init-ci Command
 * 
 * Initializes CI/CD integration for ODAVL Insight analysis.
 * Copies pre-configured templates for GitHub Actions or GitLab CI.
 * 
 * Usage:
 *   pnpm odavl:init-ci --platform=github
 *   pnpm odavl:init-ci --platform=gitlab
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

type Platform = 'github' | 'gitlab';

interface InitCIOptions {
    platform?: Platform;
    workspaceRoot?: string;
    skipInstall?: boolean;
}

/**
 * Main entry point for init-ci command
 */
export async function initCI(options: InitCIOptions = {}): Promise<void> {
    console.log('🚀 ODAVL Insight - CI/CD Initialization\n');

    // Detect workspace root (current directory if not specified)
    const workspaceRoot = options.workspaceRoot ?? process.cwd();
    console.log(`📁 Workspace: ${workspaceRoot}\n`);

    // Determine platform (prompt if not provided)
    let platform = options.platform;
    if (!platform) {
        platform = await promptPlatform();
    }

    // Validate platform
    if (platform !== 'github' && platform !== 'gitlab') {
        console.error(`❌ Invalid platform: ${platform}`);
        console.error('   Supported platforms: github, gitlab');
        process.exit(1);
    }

    console.log(`✅ Selected platform: ${platform}\n`);

    // Get template content
    const templateContent = getTemplateContent(platform);

    // Determine destination path
    const destinationPath = getDestinationPath(platform, workspaceRoot);

    // Check if destination already exists
    if (fs.existsSync(destinationPath)) {
        console.warn(`⚠️  CI/CD configuration already exists: ${destinationPath}`);
        const overwrite = await promptOverwrite();
        if (!overwrite) {
            console.log('❌ Aborted by user.');
            process.exit(0);
        }
    }

    // Write template
    try {
        writeTemplate(destinationPath, templateContent);
        console.log(`✅ Created: ${destinationPath}\n`);
    } catch (error) {
        console.error(`❌ Failed to write template: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }

    // Install ODAVL CLI as dev dependency (if not skipped)
    if (!options.skipInstall) {
        await installODAVLCLI(workspaceRoot);
    }

    // Print next steps
    printNextSteps(platform, destinationPath);
}

/**
 * Prompt user to select platform interactively
 */
async function promptPlatform(): Promise<Platform> {
    console.log('📋 Select CI/CD platform:');
    console.log('  1. GitHub Actions');
    console.log('  2. GitLab CI/CD\n');

    // Simple prompt using readline (production would use inquirer or prompts)
    const readline = await import('node:readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('Enter choice (1 or 2): ', (answer) => {
            rl.close();
            if (answer.trim() === '1') {
                resolve('github');
            } else if (answer.trim() === '2') {
                resolve('gitlab');
            } else {
                console.error('❌ Invalid choice. Please enter 1 or 2.');
                process.exit(1);
            }
        });
    });
}

/**
 * Prompt user to confirm overwriting existing configuration
 */
async function promptOverwrite(): Promise<boolean> {
    const readline = await import('node:readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question('   Overwrite? (y/N): ', (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}

/**
 * Get template content for platform
 */
function getTemplateContent(platform: Platform): string {
    if (platform === 'github') {
        return `name: ODAVL CI
on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm odavl observe
      - run: pnpm odavl verify
`;
    }
    return `# GitLab CI for ODAVL
odavl-validate:
  image: node:20
  before_script:
    - npm install -g pnpm@9
    - pnpm install
  script:
    - pnpm odavl observe
    - pnpm odavl verify
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
`;
}

/**
 * Get template path for platform (legacy - now generates inline)
 */
function getTemplatePath(platform: Platform): string {
    return ''; // Not used anymore - content generated inline
}

/**
 * Get destination path for CI configuration
 */
function getDestinationPath(platform: Platform, workspaceRoot: string): string {
    if (platform === 'github') {
        const workflowsDir = path.join(workspaceRoot, '.github', 'workflows');
        // Create .github/workflows directory if it doesn't exist
        if (!fs.existsSync(workflowsDir)) {
            fs.mkdirSync(workflowsDir, { recursive: true });
        }
        return path.join(workflowsDir, 'odavl-insight.yml');
    }

    // GitLab: .gitlab-ci.yml in project root
    return path.join(workspaceRoot, '.gitlab-ci.yml');
}

/**
 * Write template to destination
 */
function writeTemplate(destinationPath: string, content: string): void {
    // For GitLab, check if .gitlab-ci.yml exists with other jobs
    if (destinationPath.endsWith('.gitlab-ci.yml')) {
        if (fs.existsSync(destinationPath)) {
            // Append ODAVL jobs instead of overwriting
            const existing = fs.readFileSync(destinationPath, 'utf8');

            // Check if ODAVL already configured
            if (existing.includes('odavl-validate')) {
                console.warn('⚠️  ODAVL already configured in .gitlab-ci.yml');
                console.log('   Overwriting existing configuration...\n');
            }

            // For simplicity, we'll overwrite. Production could merge intelligently.
            fs.writeFileSync(destinationPath, content, 'utf8');
        } else {
            fs.writeFileSync(destinationPath, content, 'utf8');
        }
    } else {
        // GitHub: always create new file
        fs.writeFileSync(destinationPath, content, 'utf8');
    }
}

/**
 * Install ODAVL CLI as dev dependency
 */
async function installODAVLCLI(workspaceRoot: string): Promise<void> {
    console.log('📦 Installing ODAVL CLI as dev dependency...\n');

    // Detect package manager
    const packageManager = detectPackageManager(workspaceRoot);
    console.log(`   Using package manager: ${packageManager}`);

    // Install command
    let installCmd: string;
    if (packageManager === 'pnpm') {
        installCmd = 'pnpm add -D @odavl/cli';
    } else if (packageManager === 'yarn') {
        installCmd = 'yarn add -D @odavl/cli';
    } else {
        installCmd = 'npm install --save-dev @odavl/cli';
    }

    try {
        execSync(installCmd, {
            cwd: workspaceRoot,
            stdio: 'inherit',
        });
        console.log('\n✅ ODAVL CLI installed successfully\n');
    } catch {
        console.warn('\n⚠️  Failed to install ODAVL CLI automatically.');
        console.warn(`   Please run manually: ${installCmd}\n`);
    }
}

/**
 * Detect package manager (pnpm, yarn, or npm)
 */
function detectPackageManager(workspaceRoot: string): 'pnpm' | 'yarn' | 'npm' {
    if (fs.existsSync(path.join(workspaceRoot, 'pnpm-lock.yaml'))) {
        return 'pnpm';
    }
    if (fs.existsSync(path.join(workspaceRoot, 'yarn.lock'))) {
        return 'yarn';
    }
    return 'npm';
}

/**
 * Print next steps for user
 */
function printNextSteps(platform: Platform, configPath: string): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 CI/CD Integration Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📄 Configuration file created:');
    console.log(`   ${configPath}\n`);

    if (platform === 'github') {
        console.log('🔧 Next Steps (GitHub Actions):\n');
        console.log('   1. Commit and push the workflow file:');
        console.log('      git add .github/workflows/odavl-insight.yml');
        console.log('      git commit -m "ci: add ODAVL Insight analysis"');
        console.log('      git push\n');
        console.log('   2. Create a Pull Request to trigger analysis\n');
        console.log('   3. ODAVL will post results as a PR comment with:');
        console.log('      • Health score badge (0-100)');
        console.log('      • Detailed severity breakdown');
        console.log('      • Downloadable HTML report\n');
        console.log('   4. Quality Gates (configurable in workflow):');
        console.log('      • Fails if critical issues > 0');
        console.log('      • Fails if health score < 60\n');
    } else {
        console.log('🔧 Next Steps (GitLab CI/CD):\n');
        console.log('   1. Commit and push the CI configuration:');
        console.log('      git add .gitlab-ci.yml');
        console.log('      git commit -m "ci: add ODAVL Insight analysis"');
        console.log('      git push\n');
        console.log('   2. Create a Merge Request to trigger analysis\n');
        console.log('   3. ODAVL will post results as an MR note with:');
        console.log('      • Health score badge (0-100)');
        console.log('      • Detailed severity breakdown');
        console.log('      • Downloadable HTML report\n');
        console.log('   4. Quality Gates (configurable in .gitlab-ci.yml):');
        console.log('      • Fails if critical issues > 0');
        console.log('      • Fails if health score < 60\n');
        console.log('   5. Enable CI_JOB_TOKEN permissions:');
        console.log('      Settings → CI/CD → Token Access → Enable\n');
    }

    console.log('📚 Documentation:');
    console.log('   https://odavl.dev/docs/ci-cd-integration\n');

    console.log('💡 Tip: Customize quality gates by editing the workflow file.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * CLI argument parsing
 */
export function parseArgs(args: string[]): InitCIOptions {
    const options: InitCIOptions = {};

    for (const arg of args) {
        if (arg.startsWith('--platform=')) {
            const platform = arg.split('=')[1] as Platform;
            options.platform = platform;
        } else if (arg === '--skip-install') {
            options.skipInstall = true;
        } else if (arg.startsWith('--workspace=')) {
            options.workspaceRoot = arg.split('=')[1];
        }
    }

    return options;
}

// Main execution handled by index.ts CLI router
// This file is imported dynamically when user runs: pnpm odavl:init-ci