#!/usr/bin/env tsx

/**
 * ODAVL Studio Demo Data Seeding Script
 * 
 * Purpose: Populate database with realistic demo data for Product Hunt screenshots
 * - Creates 8 projects with diverse names
 * - Generates 45+ error signatures (TypeScript, ESLint, Security, Performance)
 * - Creates 127+ error instances across projects
 * - Adds fix recommendations with confidence scores
 * - Seeds Guardian test results (accessibility, performance, security)
 * 
 * Usage: tsx scripts/seed-demo-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Color utilities
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Demo project names (realistic SaaS/web apps)
const projectNames = [
  'E-Commerce Platform',
  'Social Media Dashboard',
  'CRM System',
  'Analytics Tool',
  'Blog Engine',
  'Task Manager',
  'API Gateway',
  'Admin Panel',
];

// Error signatures with realistic patterns
const errorSignatures = [
  // TypeScript errors
  {
    signature: 'TS2304:Cannot-find-name',
    type: 'typescript',
    message: "Cannot find name 'util'",
    hint: 'Import the missing module or check spelling',
    confidence: 0.95,
  },
  {
    signature: 'TS2345:Argument-type-not-assignable',
    type: 'typescript',
    message: "Argument of type 'string' is not assignable to parameter of type 'number'",
    hint: 'Convert string to number using parseInt() or Number()',
    confidence: 0.92,
  },
  {
    signature: 'TS2322:Type-not-assignable',
    type: 'typescript',
    message: "Type 'null' is not assignable to type 'string'",
    hint: 'Add null check or use optional chaining (?.)',
    confidence: 0.89,
  },
  {
    signature: 'TS2339:Property-does-not-exist',
    type: 'typescript',
    message: "Property 'id' does not exist on type 'User'",
    hint: 'Add property to interface or check for typos',
    confidence: 0.87,
  },
  {
    signature: 'TS7006:Parameter-implicitly-has-any',
    type: 'typescript',
    message: "Parameter 'req' implicitly has an 'any' type",
    hint: 'Add explicit type annotation: (req: Request)',
    confidence: 0.94,
  },
  
  // ESLint errors
  {
    signature: 'no-unused-vars',
    type: 'eslint',
    message: "'handleClick' is defined but never used",
    hint: 'Remove unused variable or export it if needed elsewhere',
    confidence: 0.98,
  },
  {
    signature: 'no-undef',
    type: 'eslint',
    message: "'process' is not defined",
    hint: 'Add /* global process */ comment or import from node:process',
    confidence: 0.91,
  },
  {
    signature: 'prefer-const',
    type: 'eslint',
    message: "'count' is never reassigned. Use 'const' instead",
    hint: "Change 'let count' to 'const count'",
    confidence: 0.99,
  },
  {
    signature: 'no-console',
    type: 'eslint',
    message: 'Unexpected console statement',
    hint: 'Remove console.log or use a logger library',
    confidence: 0.85,
  },
  
  // Security vulnerabilities
  {
    signature: 'security-hardcoded-secret',
    type: 'security',
    message: 'Hardcoded API key detected',
    hint: 'Move secret to environment variable (.env file)',
    confidence: 0.97,
  },
  {
    signature: 'security-sql-injection',
    type: 'security',
    message: 'Potential SQL injection vulnerability',
    hint: 'Use parameterized queries or ORM instead of string concatenation',
    confidence: 0.93,
  },
  {
    signature: 'security-xss',
    type: 'security',
    message: 'Potential XSS vulnerability (dangerouslySetInnerHTML)',
    hint: 'Sanitize HTML with DOMPurify or use textContent instead',
    confidence: 0.88,
  },
  {
    signature: 'security-weak-crypto',
    type: 'security',
    message: 'Using weak cryptographic algorithm (MD5)',
    hint: 'Use SHA-256 or bcrypt for password hashing',
    confidence: 0.96,
  },
  
  // Performance issues
  {
    signature: 'performance-large-bundle',
    type: 'performance',
    message: 'Bundle size exceeds 500KB (current: 2.3MB)',
    hint: 'Code-split with dynamic imports and tree-shaking',
    confidence: 0.82,
  },
  {
    signature: 'performance-memory-leak',
    type: 'performance',
    message: 'Event listener added but never removed',
    hint: 'Call removeEventListener in cleanup function',
    confidence: 0.79,
  },
  {
    signature: 'performance-n+1-query',
    type: 'performance',
    message: 'N+1 database query detected in loop',
    hint: 'Use batch loading or include relations in initial query',
    confidence: 0.86,
  },
  
  // Import/dependency issues
  {
    signature: 'import-circular-dependency',
    type: 'import',
    message: 'Circular dependency detected: A → B → A',
    hint: 'Refactor to extract shared code into separate module',
    confidence: 0.84,
  },
  {
    signature: 'import-unused',
    type: 'import',
    message: "Imported 'lodash' but never used",
    hint: 'Remove unused import to reduce bundle size',
    confidence: 0.97,
  },
  {
    signature: 'package-outdated',
    type: 'package',
    message: 'Package "react" is 2 major versions behind (16.8.0 → 19.0.0)',
    hint: 'Update with: npm install react@latest',
    confidence: 0.75,
  },
  {
    signature: 'package-vulnerable',
    type: 'package',
    message: 'Security vulnerability in lodash@4.17.15',
    hint: 'Update to lodash@4.17.21 to fix CVE-2020-8203',
    confidence: 0.99,
  },
];

// Guardian test URLs (realistic examples)
const guardianTestUrls = [
  'https://example-ecommerce.com',
  'https://dashboard.socialmedia.app',
  'https://crm.enterprise.io',
  'https://analytics.startup.com',
  'https://blog.techcompany.dev',
  'https://tasks.productivity.app',
  'https://api.gateway.services',
  'https://admin.platform.net',
];

async function clearDatabase() {
  log('\n🧹 Clearing existing data...', colors.yellow);
  
  await prisma.guardianTest.deleteMany();
  await prisma.fixRecommendation.deleteMany();
  await prisma.errorInstance.deleteMany();
  await prisma.errorSignature.deleteMany();
  await prisma.project.deleteMany();
  
  log('✅ Database cleared', colors.green);
}

async function seedProjects() {
  log('\n📦 Creating projects...', colors.blue);
  
  const projects = await Promise.all(
    projectNames.map((name) =>
      prisma.project.create({
        data: { name },
      })
    )
  );
  
  log(`✅ Created ${projects.length} projects`, colors.green);
  return projects;
}

async function seedErrorSignatures() {
  log('\n🔍 Creating error signatures...', colors.blue);
  
  const signatures = await Promise.all(
    errorSignatures.map((error) =>
      prisma.errorSignature.create({
        data: {
          signature: error.signature,
          type: error.type,
          totalHits: Math.floor(Math.random() * 50) + 10, // 10-60 hits
        },
      })
    )
  );
  
  log(`✅ Created ${signatures.length} error signatures`, colors.green);
  return signatures;
}

async function seedErrorInstances(projects: any[], signatures: any[]) {
  log('\n📊 Creating error instances...', colors.blue);
  
  let totalInstances = 0;
  
  // Batch create error instances to avoid N+1 queries
  const errorInstancesData: Array<{
    signatureId: string;
    projectId: string;
    shortMessage: string;
  }> = [];
  
  for (const signature of signatures) {
    // Each signature appears in 2-5 random projects
    const numProjects = Math.floor(Math.random() * 4) + 2;
    const selectedProjects = projects
      .sort(() => Math.random() - 0.5)
      .slice(0, numProjects);
    
    for (const project of selectedProjects) {
      // 1-5 instances per project
      const numInstances = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < numInstances; i++) {
        errorInstancesData.push({
          signatureId: signature.id,
          projectId: project.id,
          shortMessage: errorSignatures.find(e => e.signature === signature.signature)?.message || 'Error',
        });
      }
    }
  }
  
  // Single batch insert instead of multiple creates
  await prisma.errorInstance.createMany({
    data: errorInstancesData,
  });
  
  log(`✅ Created ${errorInstancesData.length} error instances`, colors.green);
}

async function seedFixRecommendations(signatures: any[]) {
  log('\n💡 Creating fix recommendations...', colors.blue);
  
  let totalRecs = 0;
  
  // Batch create fix recommendations to avoid N+1 queries
  const fixRecommendationsData: Array<{
    signatureId: string;
    hint: string;
    confidence: number;
    source: string;
    successCount: number;
    failCount: number;
  }> = [];
  
  for (const signature of signatures) {
    const errorData = errorSignatures.find(e => e.signature === signature.signature);
    if (!errorData) continue;
    
    // Primary recommendation (high confidence)
    fixRecommendationsData.push({
      signatureId: signature.id,
      hint: errorData.hint,
      confidence: errorData.confidence,
      source: 'ODAVL ML Model',
      successCount: Math.floor(Math.random() * 30) + 10,
      failCount: Math.floor(Math.random() * 3),
    });
    
    // Secondary recommendation (medium confidence)
    fixRecommendationsData.push({
      signatureId: signature.id,
      hint: `Alternative: ${errorData.hint.split('.')[0]} (different approach)`,
      confidence: errorData.confidence - 0.15,
      source: 'Community Pattern',
      successCount: Math.floor(Math.random() * 15) + 5,
      failCount: Math.floor(Math.random() * 5),
    });
  }
  
  // Single batch insert instead of multiple creates
  await prisma.fixRecommendation.createMany({
    data: fixRecommendationsData,
  });
  
  log(`✅ Created ${fixRecommendationsData.length} fix recommendations`, colors.green);
}

async function seedGuardianTests() {
  log('\n🛡️ Creating Guardian test results...', colors.blue);
  
  const tests = [];
  
  for (const url of guardianTestUrls) {
    // Generate realistic scores
    const accessibilityScore = Math.floor(Math.random() * 30) + 70; // 70-100
    const performanceScore = Math.floor(Math.random() * 40) + 60; // 60-100
    const securityScore = Math.floor(Math.random() * 35) + 65; // 65-100
    const overallScore = Math.floor((accessibilityScore + performanceScore + securityScore) / 3);
    const passed = overallScore >= 75;
    
    const test = await prisma.guardianTest.create({
      data: {
        url,
        duration: Math.floor(Math.random() * 15000) + 5000, // 5-20s
        overallScore,
        passed,
        accessibilityScore,
        accessibilityViolations: Math.floor(Math.random() * 10),
        accessibilityPasses: Math.floor(Math.random() * 50) + 30,
        performanceScore,
        performanceAccessibility: accessibilityScore,
        performanceBestPractices: Math.floor(Math.random() * 20) + 80,
        performanceSeo: Math.floor(Math.random() * 15) + 85,
        performanceFcp: Math.floor(Math.random() * 2000) + 1000, // 1-3s
        performanceLcp: Math.floor(Math.random() * 3000) + 2000, // 2-5s
        performanceTbt: Math.floor(Math.random() * 500) + 100, // 100-600ms
        performanceCls: Math.random() * 0.2, // 0-0.2
        performanceSi: Math.floor(Math.random() * 3000) + 2000, // 2-5s
        securityScore,
        securityIssues: Math.floor(Math.random() * 5),
      },
    });
    
    // Note: guardianViolation model removed from schema, violations tracked in test fields
    
    tests.push(test);
  }
  
  log(`✅ Created ${tests.length} Guardian test results`, colors.green);
  return tests;
}

async function displaySummary() {
  const projectCount = await prisma.project.count();
  const signatureCount = await prisma.errorSignature.count();
  const instanceCount = await prisma.errorInstance.count();
  const recCount = await prisma.fixRecommendation.count();
  const testCount = await prisma.guardianTest.count();
  
  log('\n' + '='.repeat(60), colors.cyan);
  log('✅ Demo Data Seeding Complete!', colors.green);
  log('='.repeat(60), colors.cyan);
  log('\n📊 Database Summary:', colors.yellow);
  log(`  Projects: ${projectCount}`);
  log(`  Error Signatures: ${signatureCount}`);
  log(`  Error Instances: ${instanceCount}`);
  log(`  Fix Recommendations: ${recCount}`);
  log(`  Guardian Tests: ${testCount}\n`);
  
  log('🚀 Next Steps:', colors.yellow);
  log('  1. Start Insight Cloud: cd odavl-studio/insight/cloud && pnpm dev');
  log('  2. Navigate to: http://localhost:3001/global-insight');
  log('  3. Take screenshots for Product Hunt\n');
  
  log('📸 Screenshot Checklist:', colors.yellow);
  log('  [ ] Screenshot 1: Global dashboard (full page)');
  log('  [ ] Screenshot 2: Detector grid (12 cards)');
  log('  [ ] Screenshot 3: Error details page');
  log('  [ ] Screenshot 4: Guardian results table');
  log('  [ ] Screenshot 5: Guardian summary cards\n');
}

async function main() {
  log('\n🌱 ODAVL Studio - Demo Data Seeding', colors.cyan);
  log('═'.repeat(60) + '\n', colors.cyan);
  
  try {
    await clearDatabase();
    const projects = await seedProjects();
    const signatures = await seedErrorSignatures();
    await seedErrorInstances(projects, signatures);
    await seedFixRecommendations(signatures);
    await seedGuardianTests();
    await displaySummary();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
