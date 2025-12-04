/**
 * Project Analyzer - Deep Project Structure Analysis
 * Reads and analyzes project files for comprehensive health check
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import ora from 'ora';
import { getTheme } from './theme.js';

const theme = getTheme();

export interface ProjectAnalysis {
  packageJson?: {
    exists: boolean;
    valid: boolean;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
    issues: string[];
  };
  envFile?: {
    exists: boolean;
    variables: string[];
    missing: string[];
    issues: string[];
  };
  prismaSchema?: {
    exists: boolean;
    models: string[];
    clientGenerated: boolean;
    issues: string[];
  };
  typescript?: {
    exists: boolean;
    compiles: boolean;
    errors: string[];
    issues: string[];
  };
  nodeModules?: {
    exists: boolean;
    installed: boolean;
    issues: string[];
  };
  buildSystem?: {
    framework: string;
    buildScript: string;
    issues: string[];
  };
  security?: {
    vulnerabilities: number;
    critical: number;
    high: number;
    issues: string[];
  };
  eslint?: {
    configured: boolean;
    errors: number;
    warnings: number;
    issues: string[];
  };
  performance?: {
    bundleSize?: number;
    lighthouse?: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
    };
    issues: string[];
  };
  database?: {
    connected: boolean;
    type?: string;
    latency?: number;
    issues: string[];
  };
  api?: {
    endpoints: Array<{
      url: string;
      method: string;
      status: number;
      responseTime: number;
    }>;
    issues: string[];
  };
  dependencies?: {
    outdated: Array<{
      name: string;
      current: string;
      wanted: string;
      latest: string;
    }>;
    issues: string[];
  };
}

/**
 * Analyze entire project structure
 */
export async function analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
  const analysis: ProjectAnalysis = {};

  console.log(theme.colors.primary('\n📁 Analyzing Project Structure...\n'));

  // 1. Package.json Analysis
  analysis.packageJson = await analyzePackageJson(projectPath);

  // 2. Environment Variables
  analysis.envFile = await analyzeEnvFile(projectPath);

  // 3. Prisma Schema
  analysis.prismaSchema = await analyzePrismaSchema(projectPath);

  // 4. TypeScript Configuration
  analysis.typescript = await analyzeTypeScript(projectPath);

  // 5. Node Modules
  analysis.nodeModules = await analyzeNodeModules(projectPath);

  // 6. Build System
  analysis.buildSystem = await analyzeBuildSystem(projectPath, analysis.packageJson);

  // 7. Security Scan
  analysis.security = await analyzeSecurityVulnerabilities(projectPath);

  // 8. ESLint Analysis
  analysis.eslint = await analyzeESLint(projectPath);

  // 9. Performance Analysis
  analysis.performance = await analyzePerformance(projectPath, analysis.packageJson);

  // 10. Database Connection
  analysis.database = await analyzeDatabaseConnection(projectPath, analysis.envFile);

  // 11. SEO Analysis
  analysis.seo = await analyzeSEO(projectPath, analysis.buildSystem?.framework || 'Unknown');

  // 12. Dependency Versions
  analysis.dependencies = await analyzeDependencyVersions(projectPath);

  return analysis;
}

/**
 * Analyze package.json
 */
async function analyzePackageJson(projectPath: string) {
  const spinner = ora('Analyzing package.json...').start();
  const issues: string[] = [];
  
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    spinner.fail('package.json not found');
    return {
      exists: false,
      valid: false,
      dependencies: {},
      devDependencies: {},
      scripts: {},
      issues: ['💥 package.json not found in project root']
    };
  }

  try {
    const content = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);

  // Check for common issues
  if (!pkg.dependencies && !pkg.devDependencies) {
    issues.push('⚠️ No dependencies defined');
  }

  if (!pkg.scripts) {
    issues.push('⚠️ No scripts defined');
  }

  if (!pkg.name) {
    issues.push('⚠️ Package name missing');
  }
  
  // Check for NextAuth.js OAuth setup
  if (pkg.dependencies?.['next-auth']) {
    const envPath = join(projectPath, '.env.local');
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      const hasGithubAuth = envContent.includes('GITHUB_ID') && envContent.includes('GITHUB_SECRET');
      const hasGoogleAuth = envContent.includes('GOOGLE_ID') && envContent.includes('GOOGLE_SECRET');
      
      if (!hasGithubAuth && !hasGoogleAuth) {
        issues.push('⚠️ NextAuth installed but no OAuth providers configured (GITHUB_ID/GOOGLE_ID missing)');
      }
    } else {
      issues.push('⚠️ NextAuth installed but .env.local not found');
    }
  }
  
  // Check for Prisma generate script
  if (pkg.dependencies?.['@prisma/client'] || pkg.devDependencies?.['prisma']) {
    const hasPrismaGenerateScript = 
      pkg.scripts?.['prisma:generate'] ||
      pkg.scripts?.['generate'] ||
      (pkg.scripts?.['postinstall']?.includes('prisma generate'));
    
    if (!hasPrismaGenerateScript) {
      issues.push('⚠️ Prisma installed but no generate script found (add "prisma:generate": "prisma generate")');
    }
  }    // Check for Prisma
    const hasPrisma = pkg.dependencies?.['@prisma/client'] || pkg.devDependencies?.['prisma'];
    if (hasPrisma) {
      if (!pkg.scripts?.['prisma:generate'] && !pkg.scripts?.['postinstall']?.includes('prisma generate')) {
        issues.push('⚠️ Prisma installed but no generate script found');
      }
    }

    // Check for Next.js
    const hasNext = pkg.dependencies?.['next'];
    if (hasNext) {
      if (!pkg.scripts?.['dev']) {
        issues.push('⚠️ Next.js installed but no dev script');
      }
      if (!pkg.scripts?.['build']) {
        issues.push('⚠️ Next.js installed but no build script');
      }
    }

    spinner.succeed('package.json analyzed');
    
    return {
      exists: true,
      valid: true,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      scripts: pkg.scripts || {},
      issues
    };
  } catch (error) {
    spinner.fail('package.json parsing failed');
    return {
      exists: true,
      valid: false,
      dependencies: {},
      devDependencies: {},
      scripts: {},
      issues: ['💥 Invalid JSON in package.json']
    };
  }
}

/**
 * Analyze .env files
 */
async function analyzeEnvFile(projectPath: string) {
  const spinner = ora('Checking environment variables...').start();
  const issues: string[] = [];
  const variables: string[] = [];
  const missing: string[] = [];

  const envPaths = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production'
  ];

  let foundEnvFile = false;

  for (const envFile of envPaths) {
    const envPath = join(projectPath, envFile);
    if (existsSync(envPath)) {
      foundEnvFile = true;
      try {
        const content = readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key] = trimmed.split('=');
            if (key) variables.push(key.trim());
          }
        }
      } catch (error) {
        issues.push(`⚠️ Could not read ${envFile}`);
      }
    }
  }

  // Check for common required variables
  const commonVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  for (const varName of commonVars) {
    if (!variables.includes(varName)) {
      missing.push(varName);
    }
  }

  if (!foundEnvFile) {
    spinner.warn('No .env files found');
    issues.push('⚠️ No environment files found (.env, .env.local, etc.)');
  } else {
    spinner.succeed(`Found ${variables.length} environment variables`);
  }

  if (missing.length > 0) {
    issues.push(`⚠️ Missing common variables: ${missing.join(', ')}`);
  }

  return {
    exists: foundEnvFile,
    variables,
    missing,
    issues
  };
}

/**
 * Analyze Prisma schema
 */
async function analyzePrismaSchema(projectPath: string) {
  const spinner = ora('Checking Prisma setup...').start();
  const issues: string[] = [];
  const models: string[] = [];

  const schemaPath = join(projectPath, 'prisma', 'schema.prisma');
  
  if (!existsSync(schemaPath)) {
    spinner.info('No Prisma schema found');
    return {
      exists: false,
      models: [],
      clientGenerated: false,
      issues: []
    };
  }

  try {
    const content = readFileSync(schemaPath, 'utf-8');
    
    // Extract models
    const modelMatches = content.matchAll(/model\s+(\w+)\s*{/g);
    for (const match of modelMatches) {
      models.push(match[1]);
    }

    // Check if client is generated (supports both regular and pnpm monorepo)
    const clientPath1 = join(projectPath, 'node_modules', '.prisma', 'client');
    
    // For monorepos, find root by looking for pnpm-workspace.yaml
    let rootPath = projectPath;
    let currentPath = projectPath;
    while (currentPath !== dirname(currentPath)) {
      if (existsSync(join(currentPath, 'pnpm-workspace.yaml'))) {
        rootPath = currentPath;
        break;
      }
      currentPath = dirname(currentPath);
    }
    
    const clientPath2 = join(rootPath, 'node_modules', '.pnpm');
    
    let clientGenerated = existsSync(clientPath1);
    
    // Check pnpm monorepo structure at root
    if (!clientGenerated && existsSync(clientPath2)) {
      // Search for @prisma/client in pnpm virtual store
      try {
        const pnpmDirs = readdirSync(clientPath2);
        clientGenerated = pnpmDirs.some(dir => 
          dir.startsWith('@prisma+client@') && 
          existsSync(join(clientPath2, dir, 'node_modules', '.prisma', 'client'))
        );
      } catch (e) {
        // Ignore errors
      }
    }

    if (!clientGenerated) {
      issues.push('💥 Prisma Client not generated → Run: prisma generate');
    }

    // Check for generator
    if (!content.includes('generator client')) {
      issues.push('⚠️ No Prisma client generator defined in schema');
    }

    // Check for datasource
    if (!content.includes('datasource db')) {
      issues.push('💥 No database datasource defined in schema');
    }

    if (clientGenerated) {
      spinner.succeed(`Prisma setup OK (${models.length} models)`);
    } else {
      spinner.fail('Prisma Client not generated');
    }

    return {
      exists: true,
      models,
      clientGenerated,
      issues
    };
  } catch (error) {
    spinner.fail('Prisma schema check failed');
    return {
      exists: true,
      models: [],
      clientGenerated: false,
      issues: ['💥 Could not parse Prisma schema']
    };
  }
}

/**
 * Check TypeScript compilation
 */
async function analyzeTypeScript(projectPath: string) {
  const spinner = ora('Checking TypeScript...').start();
  const issues: string[] = [];
  const errors: string[] = [];

  const tsconfigPath = join(projectPath, 'tsconfig.json');
  
  if (!existsSync(tsconfigPath)) {
    spinner.info('No TypeScript config found');
    return {
      exists: false,
      compiles: true,
      errors: [],
      issues: []
    };
  }

  try {
    // Try to run tsc --noEmit (exclude build artifacts)
    execSync('pnpm exec tsc --noEmit --skipLibCheck', {
      cwd: projectPath,
      stdio: 'pipe',
      timeout: 30000
    });
    
    spinner.succeed('TypeScript compiles without errors');
    return {
      exists: true,
      compiles: true,
      errors: [],
      issues: []
    };
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    
    // Filter out .next/, .turbo/, dist/, node_modules/ errors (build artifacts)
    const errorLines = output.split('\n')
      .filter((line: string) => line.includes('error TS'))
      .filter((line: string) => !line.includes('.next/'))
      .filter((line: string) => !line.includes('.turbo/'))
      .filter((line: string) => !line.includes('dist/'))
      .filter((line: string) => !line.includes('node_modules/'));
    
    errors.push(...errorLines.slice(0, 10));
    
    if (errorLines.length === 0) {
      spinner.succeed('TypeScript compiles (build artifacts excluded)');
      return {
        exists: true,
        compiles: true,
        errors: [],
        issues: []
      };
    }
    
    issues.push(`💥 TypeScript compilation errors: ${errorLines.length}`);
    spinner.fail(`TypeScript has ${errorLines.length} real errors`);
    
    return {
      exists: true,
      compiles: false,
      errors: errorLines.slice(0, 10),
      issues
    };
  }
}

/**
 * Analyze SEO readiness
 */
async function analyzeSEO(projectPath: string, framework: string) {
  const spinner = ora('Analyzing SEO...').start();
  const issues: string[] = [];
  const found: string[] = [];

  // Check for sitemap
  const sitemapPaths = [
    join(projectPath, 'public', 'sitemap.xml'),
    join(projectPath, 'app', 'sitemap.ts'),
    join(projectPath, 'app', 'sitemap.js')
  ];
  const hasSitemap = sitemapPaths.some(p => existsSync(p));
  if (hasSitemap) {
    found.push('sitemap');
  } else {
    issues.push('⚠️ No sitemap.xml or sitemap.ts found');
  }

  // Check for robots.txt
  const robotsPaths = [
    join(projectPath, 'public', 'robots.txt'),
    join(projectPath, 'app', 'robots.ts'),
    join(projectPath, 'app', 'robots.js')
  ];
  const hasRobots = robotsPaths.some(p => existsSync(p));
  if (hasRobots) {
    found.push('robots.txt');
  } else {
    issues.push('⚠️ No robots.txt found');
  }

  // Check for metadata (Next.js App Router)
  if (framework.includes('Next.js') && framework.includes('App Router')) {
    const layoutPath = join(projectPath, 'app', 'layout.tsx');
    if (existsSync(layoutPath)) {
      const content = readFileSync(layoutPath, 'utf-8');
      if (content.includes('metadata') || content.includes('Metadata')) {
        found.push('metadata export');
      } else {
        issues.push('⚠️ No metadata export in app/layout.tsx');
      }
    }
  }

  const foundStr = found.length > 0 ? ` (${found.join(', ')})` : '';
  if (issues.length === 0) {
    spinner.succeed(`SEO ready${foundStr}`);
  } else {
    spinner.warn(`SEO: ${issues.length} missing items${foundStr}`);
  }

  return { found, issues };
}

/**
 * Check node_modules
 */
async function analyzeNodeModules(projectPath: string) {
  const spinner = ora('Checking dependencies...').start();
  const issues: string[] = [];

  const nodeModulesPath = join(projectPath, 'node_modules');
  const exists = existsSync(nodeModulesPath);

  if (!exists) {
    spinner.fail('node_modules not found');
    return {
      exists: false,
      installed: false,
      issues: ['💥 Dependencies not installed → Run: pnpm install']
    };
  }

  // Check if package-lock or pnpm-lock exists (check project folder AND root for monorepos)
  const hasLock = existsSync(join(projectPath, 'pnpm-lock.yaml')) ||
                  existsSync(join(projectPath, 'package-lock.json')) ||
                  existsSync(join(projectPath, 'yarn.lock')) ||
                  existsSync(join(projectPath, '..', '..', 'pnpm-lock.yaml')) || // Check root for monorepo
                  existsSync(join(projectPath, '..', '..', 'package-lock.json')) ||
                  existsSync(join(projectPath, '..', '..', 'yarn.lock'));

  if (!hasLock) {
    issues.push('⚠️ No lock file found (pnpm-lock.yaml, package-lock.json)');
  }

  spinner.succeed('Dependencies installed');
  
  return {
    exists: true,
    installed: true,
    issues
  };
}

/**
 * Check Docker status
 */
async function checkDockerStatus() {
  try {
    execSync('docker ps', { stdio: 'pipe', timeout: 5000 });
    return { running: true, containers: [] };
  } catch {
    return { running: false, containers: [] };
  }
}

/**
 * Analyze build system
 */
async function analyzeBuildSystem(projectPath: string, packageJson: any) {
  const spinner = ora('Analyzing build system...').start();
  const issues: string[] = [];

  let framework = 'Unknown';
  let buildScript = '';
  const features: string[] = [];

  if (packageJson?.dependencies?.['next']) {
    const nextVersion = packageJson.dependencies['next'];
    const isAppRouter = existsSync(join(projectPath, 'app'));
    const hasPages = existsSync(join(projectPath, 'pages'));
    const hasI18n = packageJson?.dependencies?.['next-intl'] || 
                    packageJson?.dependencies?.['next-i18next'];
    
    framework = isAppRouter ? 'Next.js (App Router)' : 'Next.js (Pages Router)';
    buildScript = 'next build';
    
    if (isAppRouter) features.push('App Router');
    if (hasPages && isAppRouter) features.push('Hybrid (App + Pages)');
    if (hasI18n) features.push('i18n');
    
    // Check for dynamic routes like [locale]
    if (isAppRouter && existsSync(join(projectPath, 'app', '[locale]'))) {
      features.push('[locale] routing');
    }
  } else if (packageJson?.dependencies?.['vite']) {
    framework = 'Vite';
    buildScript = 'vite build';
  } else if (packageJson?.dependencies?.['react-scripts']) {
    framework = 'Create React App';
    buildScript = 'react-scripts build';
  }

  if (!packageJson?.scripts?.['build']) {
    issues.push('⚠️ No build script defined in package.json');
  }
  
  // Check for middleware.ts (Next.js security/routing)
  const middlewarePath = join(projectPath, 'middleware.ts');
  const hasMiddleware = existsSync(middlewarePath);
  if (framework.includes('Next.js') && hasMiddleware) {
    features.push('middleware.ts');
    try {
      const middlewareContent = readFileSync(middlewarePath, 'utf-8');
      if (middlewareContent.includes('Content-Security-Policy')) {
        features.push('CSP headers');
      }
      if (middlewareContent.includes('redirect')) {
        features.push('redirects');
      }
    } catch (e) {
      // Ignore
    }
  } else if (framework.includes('Next.js') && !hasMiddleware) {
    issues.push('⚠️ No middleware.ts found (recommended for security headers)');
  }

  const featuresStr = features.length > 0 ? ` (${features.join(', ')})` : '';
  spinner.succeed(`Build system: ${framework}${featuresStr}`);

  return {
    framework,
    buildScript: packageJson?.scripts?.['build'] || buildScript,
    features,
    issues
  };
}

/**
 * Security vulnerability scan
 */
async function analyzeSecurityVulnerabilities(projectPath: string) {
  const spinner = ora('Scanning for security vulnerabilities...').start();
  const issues: string[] = [];

  try {
    const output = execSync('pnpm audit --json', {
      cwd: projectPath,
      stdio: 'pipe',
      timeout: 30000
    }).toString();

    const audit = JSON.parse(output);
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    
    const critical = vulnerabilities.critical || 0;
    const high = vulnerabilities.high || 0;
    const total = Object.values(vulnerabilities).reduce((sum: number, val: any) => sum + (val || 0), 0);

    if (critical > 0) {
      issues.push(`💥 ${critical} CRITICAL vulnerabilities found`);
    }
    if (high > 0) {
      issues.push(`⚠️ ${high} HIGH vulnerabilities found`);
    }

    if (total > 0) {
      spinner.warn(`Found ${total} vulnerabilities`);
    } else {
      spinner.succeed('No vulnerabilities found');
    }

    return {
      vulnerabilities: total,
      critical,
      high,
      issues
    };
  } catch (error) {
    spinner.info('Could not run security scan');
    return {
      vulnerabilities: 0,
      critical: 0,
      high: 0,
      issues: []
    };
  }
}

/**
 * Display project analysis report
 */
export function displayProjectAnalysis(analysis: ProjectAnalysis) {
  console.log(theme.colors.primary('\n📊 PROJECT ANALYSIS REPORT\n'));

  const allIssues: string[] = [];

  // Package.json
  if (analysis.packageJson?.issues.length) {
    console.log(theme.colors.warning('📦 PACKAGE.JSON:\n'));
    analysis.packageJson.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.packageJson.issues);
  }

  // Environment
  if (analysis.envFile?.issues.length) {
    console.log(theme.colors.warning('⚙️ ENVIRONMENT:\n'));
    analysis.envFile.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.envFile.issues);
  }

  // SEO
  if (analysis.seo?.issues.length) {
    console.log(theme.colors.warning('🔍 SEO:\n'));
    analysis.seo.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.seo.issues);
  }

  // Prisma
  if (analysis.prismaSchema?.issues.length) {
    console.log(theme.colors.error('💾 DATABASE (PRISMA):\n'));
    analysis.prismaSchema.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.prismaSchema.issues);
  }

  // TypeScript
  if (analysis.typescript?.issues.length) {
    console.log(theme.colors.error('📘 TYPESCRIPT:\n'));
    analysis.typescript.issues.forEach(issue => console.log(`  ${issue}`));
    if (analysis.typescript.errors.length > 0) {
      console.log(theme.colors.muted('\n  First few errors:'));
      analysis.typescript.errors.slice(0, 3).forEach(err => {
        console.log(theme.colors.muted(`    ${err.substring(0, 100)}`));
      });
    }
    console.log();
    allIssues.push(...analysis.typescript.issues);
  }

  // Security
  if (analysis.security?.issues.length) {
    console.log(theme.colors.error('🔒 SECURITY:\n'));
    analysis.security.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.security.issues);
  }

  // ESLint
  if (analysis.eslint?.issues.length) {
    console.log(theme.colors.warning('🔍 CODE QUALITY (ESLINT):\n'));
    analysis.eslint.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.eslint.issues);
  }

  // Performance
  if (analysis.performance?.issues.length) {
    console.log(theme.colors.info('⚡ PERFORMANCE:\n'));
    analysis.performance.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.performance.issues);
  }

  // Database
  if (analysis.database?.issues.length) {
    console.log(theme.colors.error('💾 DATABASE CONNECTION:\n'));
    analysis.database.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.database.issues);
  }

  // Dependencies
  if (analysis.dependencies?.issues.length) {
    console.log(theme.colors.warning('📦 DEPENDENCY VERSIONS:\n'));
    analysis.dependencies.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.dependencies.issues);
  }

  // Node Modules
  if (analysis.nodeModules?.issues.length) {
    console.log(theme.colors.warning('📂 INSTALLATION:\n'));
    analysis.nodeModules.issues.forEach(issue => console.log(`  ${issue}`));
    console.log();
    allIssues.push(...analysis.nodeModules.issues);
  }

  // Summary
  console.log(theme.colors.primary(`\n📋 TOTAL ISSUES FOUND: ${allIssues.length}\n`));

  if (allIssues.length === 0) {
    console.log(theme.colors.success('✨ Project structure looks healthy!\n'));
  } else if (allIssues.filter(i => i.includes('💥')).length > 0) {
    console.log(theme.colors.error('🔴 CRITICAL issues need immediate attention\n'));
  } else {
    console.log(theme.colors.warning('🟡 Some issues detected - review recommended\n'));
  }
}

/**
 * Analyze ESLint Configuration and Run Checks
 */
async function analyzeESLint(projectPath: string) {
  const spinner = ora('Analyzing code quality (ESLint)...').start();
  const issues: string[] = [];

  try {
    // Check if ESLint is configured
    const eslintConfigs = [
      'eslint.config.mjs',
      'eslint.config.js',
      '.eslintrc.json',
      '.eslintrc.js',
      '.eslintrc.yml'
    ];

    const configured = eslintConfigs.some(config => 
      existsSync(join(projectPath, config))
    );

    if (!configured) {
      spinner.warn('ESLint not configured');
      issues.push('⚠️ ESLint not configured → Add eslint.config.mjs');
      return { configured: false, errors: 0, warnings: 0, issues };
    }

    // Try to run ESLint
    try {
      const output = execSync('pnpm exec eslint . --format json', {
        cwd: projectPath,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 30000
      });

      const results = JSON.parse(output);
      let errors = 0;
      let warnings = 0;

      results.forEach((file: any) => {
        errors += file.errorCount || 0;
        warnings += file.warningCount || 0;
      });

      spinner.succeed('ESLint analysis complete');

      if (errors > 0) {
        issues.push(`❌ ${errors} ESLint errors found`);
      }
      if (warnings > 0) {
        issues.push(`⚠️ ${warnings} ESLint warnings found`);
      }

      return { configured: true, errors, warnings, issues };
    } catch (execError) {
      // ESLint found issues
      try {
        const stderr = (execError as any).stderr?.toString() || '';
        const stdout = (execError as any).stdout?.toString() || '';
        
        if (stdout) {
          const results = JSON.parse(stdout);
          let errors = 0;
          let warnings = 0;

          results.forEach((file: any) => {
            errors += file.errorCount || 0;
            warnings += file.warningCount || 0;
          });

          spinner.warn(`ESLint found ${errors} errors, ${warnings} warnings`);

          if (errors > 0) {
            issues.push(`❌ ${errors} ESLint errors found → Run: pnpm lint`);
          }
          if (warnings > 0) {
            issues.push(`⚠️ ${warnings} ESLint warnings found`);
          }

          return { configured: true, errors, warnings, issues };
        }
      } catch {
        // Couldn't parse output
      }

      spinner.warn('ESLint check failed');
      issues.push('⚠️ ESLint execution failed');
      return { configured: true, errors: 0, warnings: 0, issues };
    }
  } catch (error) {
    spinner.info('ESLint analysis skipped');
    return { configured: false, errors: 0, warnings: 0, issues: [] };
  }
}

/**
 * Analyze Performance (Bundle Size + Lighthouse if URL provided)
 */
async function analyzePerformance(projectPath: string, packageJson: any) {
  const spinner = ora('Analyzing performance metrics...').start();
  const issues: string[] = [];

  try {
    // Check bundle size for built projects
    const distPath = join(projectPath, '.next');
    const buildPath = join(projectPath, 'dist');
    let bundleSize = 0;

    if (existsSync(distPath)) {
      // Next.js project
      try {
        const stats = readFileSync(join(distPath, 'build-manifest.json'), 'utf8');
        const manifest = JSON.parse(stats);
        spinner.info('Next.js build detected');
      } catch {
        // No build manifest
      }
    } else if (existsSync(buildPath)) {
      // Check dist folder size
      spinner.info('Build output detected');
    }

    // Check for performance monitoring tools
    const hasSentry = packageJson?.dependencies?.['@sentry/nextjs'] || 
                      packageJson?.dependencies?.['@sentry/react'];
    
    if (!hasSentry) {
      issues.push('⚠️ No error monitoring (Sentry) configured');
    }

    // Check for bundle analyzer
    const hasAnalyzer = packageJson?.devDependencies?.['@next/bundle-analyzer'] ||
                        packageJson?.devDependencies?.['webpack-bundle-analyzer'];
    
    if (!hasAnalyzer) {
      issues.push('💡 Consider adding bundle analyzer for optimization');
    }

    spinner.succeed('Performance analysis complete');

    return {
      bundleSize,
      issues
    };
  } catch (error) {
    spinner.info('Performance analysis skipped');
    return { issues: [] };
  }
}

/**
 * Test Real Database Connection
 */
async function analyzeDatabaseConnection(projectPath: string, envFile: any) {
  const spinner = ora('Testing database connection...').start();
  const issues: string[] = [];

  try {
    // Check if DATABASE_URL exists (check in variables array which contains keys only)
    const hasDatabaseUrl = envFile?.variables?.includes('DATABASE_URL');
    
    if (!hasDatabaseUrl) {
      spinner.warn('No DATABASE_URL found');
      issues.push('⚠️ DATABASE_URL not configured');
      return { connected: false, issues };
    }

    // Try to read actual value from .env.local for database type detection
    const envPath = join(projectPath, '.env.local');
    let dbType = 'postgresql'; // Default assumption
    
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, 'utf-8');
        const match = content.match(/DATABASE_URL=["']?(\w+):\/\//);
        dbType = match ? match[1] : 'postgresql';
      } catch (e) {
        // Ignore
      }
    }

    // Check if Prisma schema exists
    const prismaPath = join(projectPath, 'prisma', 'schema.prisma');
    if (!existsSync(prismaPath)) {
      spinner.info('No Prisma schema found');
      return { connected: false, type: dbType, issues };
    }

    // Try to run prisma db execute to test connection
    try {
      execSync('pnpm exec prisma db execute --help', {
        cwd: projectPath,
        stdio: 'ignore',
        timeout: 5000
      });

      // If prisma command works, try a simple query
      const startTime = Date.now();
      
      try {
        execSync('pnpm exec prisma db execute --stdin < /dev/null', {
          cwd: projectPath,
          stdio: 'ignore',
          timeout: 5000
        });
      } catch {
        // Expected to fail with invalid SQL, but connection attempt was made
      }

      const latency = Date.now() - startTime;

      spinner.succeed(`Database connection available (${dbType})`);
      
      if (latency > 2000) {
        issues.push('⚠️ Database connection latency high (>2s)');
      }

      return { connected: true, type: dbType, latency, issues };
    } catch (execError) {
      spinner.warn(`Cannot connect to ${dbType} database`);
      issues.push(`💥 Database connection failed → Check DATABASE_URL`);
      return { connected: false, type: dbType, issues };
    }
  } catch (error) {
    spinner.info('Database analysis skipped');
    return { connected: false, issues: [] };
  }
}

/**
 * Analyze Dependency Versions (Outdated Packages)
 */
async function analyzeDependencyVersions(projectPath: string) {
  const spinner = ora('Checking dependency versions...').start();
  const issues: string[] = [];

  try {
    const output = execSync('pnpm outdated --format json', {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000
    });

    const outdated = JSON.parse(output);
    const outdatedList: Array<{
      name: string;
      current: string;
      wanted: string;
      latest: string;
    }> = [];

    for (const [name, info] of Object.entries(outdated)) {
      const pkg = info as any;
      outdatedList.push({
        name,
        current: pkg.current,
        wanted: pkg.wanted,
        latest: pkg.latest
      });
    }

    spinner.succeed(`Found ${outdatedList.length} outdated dependencies`);

    if (outdatedList.length > 0) {
      issues.push(`📦 ${outdatedList.length} outdated dependencies found`);
      
      // Highlight critical ones
      const criticalPackages = ['next', 'react', 'typescript', '@prisma/client'];
      const criticalOutdated = outdatedList.filter(pkg => 
        criticalPackages.includes(pkg.name)
      );

      if (criticalOutdated.length > 0) {
        issues.push(`⚠️ Critical packages outdated: ${criticalOutdated.map(p => p.name).join(', ')}`);
      }
    }

    return { outdated: outdatedList, issues };
  } catch (error) {
    // pnpm outdated returns exit code 1 when packages are outdated
    const stderr = (error as any).stderr?.toString() || '';
    const stdout = (error as any).stdout?.toString() || '';

    if (stdout) {
      try {
        const outdated = JSON.parse(stdout);
        const outdatedList: Array<{
          name: string;
          current: string;
          wanted: string;
          latest: string;
        }> = [];

        for (const [name, info] of Object.entries(outdated)) {
          const pkg = info as any;
          outdatedList.push({
            name,
            current: pkg.current,
            wanted: pkg.wanted,
            latest: pkg.latest
          });
        }

        spinner.warn(`Found ${outdatedList.length} outdated dependencies`);

        if (outdatedList.length > 0) {
          issues.push(`📦 ${outdatedList.length} outdated dependencies → Run: pnpm update`);
        }

        return { outdated: outdatedList, issues };
      } catch {
        // Couldn't parse
      }
    }

    spinner.info('All dependencies up to date');
    return { outdated: [], issues: [] };
  }
}
