/**
 * ODAVL Cloud Console - Database Seeding
 * Batch 3: Database Integration
 * 
 * Seeds demo data for development/testing
 */

import { PrismaClient, Tier, OrgRole, ProjectStatus, Severity, FixStatus, AuditStatus, SubscriptionStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash password for test users (password: "password123")
  const hashedPassword = await hash('password123', 12);

  // ============================================================================
  // 1. Users
  // ============================================================================
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'alice@odavl.com' },
    update: {},
    create: {
      email: 'alice@odavl.com',
      name: 'Alice Johnson',
      emailVerified: new Date(),
      hashedPassword,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'bob@odavl.com' },
    update: {},
    create: {
      email: 'bob@odavl.com',
      name: 'Bob Smith',
      emailVerified: new Date(),
      hashedPassword,
    },
  });

  console.log('✅ Created 2 users');

  // ============================================================================
  // 2. Organizations
  // ============================================================================

  const demoOrg = await prisma.organization.upsert({
    where: { slug: 'odavl-test-org' },
    update: {},
    create: {
      name: 'ODAVL Test Org',
      slug: 'odavl-test-org',
      tier: Tier.PRO,
    },
  });

  const enterpriseOrg = await prisma.organization.upsert({
    where: { slug: 'enterprise-corp' },
    update: {},
    create: {
      name: 'Enterprise Corp',
      slug: 'enterprise-corp',
      tier: Tier.ENTERPRISE,
    },
  });

  console.log('✅ Created 2 organizations');

  // ============================================================================
  // 3. Organization Members
  // ============================================================================

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: demoOrg.id,
        userId: demoUser.id,
      },
    },
    update: {},
    create: {
      organizationId: demoOrg.id,
      userId: demoUser.id,
      role: OrgRole.OWNER,
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: enterpriseOrg.id,
        userId: adminUser.id,
      },
    },
    update: {},
    create: {
      organizationId: enterpriseOrg.id,
      userId: adminUser.id,
      role: OrgRole.ADMIN,
    },
  });

  console.log('✅ Created 2 organization memberships');

  // ============================================================================
  // 4. Projects
  // ============================================================================

  const webAppProject = await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: demoOrg.id,
        slug: 'web-app',
      },
    },
    update: {},
    create: {
      name: 'Web Application',
      slug: 'web-app',
      organizationId: demoOrg.id,
      repository: 'https://github.com/odavlstudio/web-app',
      language: 'typescript',
      status: ProjectStatus.ACTIVE,
    },
  });

  const apiProject = await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: demoOrg.id,
        slug: 'api-backend',
      },
    },
    update: {},
    create: {
      name: 'API Backend',
      slug: 'api-backend',
      organizationId: demoOrg.id,
      repository: 'https://github.com/odavlstudio/api-backend',
      language: 'typescript',
      status: ProjectStatus.ACTIVE,
    },
  });

  const mobileProject = await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: enterpriseOrg.id,
        slug: 'mobile-app',
      },
    },
    update: {},
    create: {
      name: 'Mobile App',
      slug: 'mobile-app',
      organizationId: enterpriseOrg.id,
      repository: 'https://github.com/enterprise-corp/mobile-app',
      language: 'typescript',
      status: ProjectStatus.ACTIVE,
    },
  });

  console.log('✅ Created 3 projects');

  // ============================================================================
  // 5. Error Signatures (Insight Data)
  // ============================================================================

  const errorSignatures = [
    {
      projectId: webAppProject.id,
      detector: 'typescript',
      severity: Severity.HIGH,
      message: "Property 'data' does not exist on type 'Response'",
      file: 'src/api/client.ts',
      line: 42,
      column: 15,
      hash: crypto.createHash('sha256').update('ts-error-1').digest('hex'),
      count: 5,
    },
    {
      projectId: webAppProject.id,
      detector: 'security',
      severity: Severity.CRITICAL,
      message: 'Hardcoded API key detected',
      file: 'src/config/api.ts',
      line: 8,
      column: 20,
      suggestion: 'Use environment variables for sensitive data',
      hash: crypto.createHash('sha256').update('security-error-1').digest('hex'),
      count: 1,
    },
    {
      projectId: apiProject.id,
      detector: 'performance',
      severity: Severity.MEDIUM,
      message: 'Synchronous file read blocking event loop',
      file: 'src/middleware/logger.ts',
      line: 23,
      suggestion: 'Use fs.promises.readFile() instead',
      hash: crypto.createHash('sha256').update('perf-error-1').digest('hex'),
      count: 12,
    },
    {
      projectId: apiProject.id,
      detector: 'eslint',
      severity: Severity.LOW,
      message: 'Missing return type on function',
      file: 'src/utils/format.ts',
      line: 15,
      hash: crypto.createHash('sha256').update('eslint-error-1').digest('hex'),
      count: 8,
    },
    {
      projectId: mobileProject.id,
      detector: 'circular',
      severity: Severity.HIGH,
      message: 'Circular dependency detected: A → B → C → A',
      file: 'src/models/user.ts',
      line: 1,
      hash: crypto.createHash('sha256').update('circular-error-1').digest('hex'),
      count: 3,
    },
  ];

  for (const error of errorSignatures) {
    await prisma.errorSignature.upsert({
      where: { hash: error.hash },
      update: {},
      create: error,
    });
  }

  console.log(`✅ Created ${errorSignatures.length} error signatures`);

  // ============================================================================
  // 6. Fix Attestations (Autopilot Data)
  // ============================================================================

  const fixAttestations = [
    {
      projectId: webAppProject.id,
      requestId: crypto.randomUUID(),
      hash: crypto.createHash('sha256').update('fix-1').digest('hex'),
      filesChanged: 2,
      linesAdded: 5,
      linesRemoved: 3,
      riskScore: 15,
      recipes: ['remove-unused-imports', 'fix-typescript-errors'],
      status: FixStatus.SUCCESS,
    },
    {
      projectId: apiProject.id,
      requestId: crypto.randomUUID(),
      hash: crypto.createHash('sha256').update('fix-2').digest('hex'),
      filesChanged: 1,
      linesAdded: 2,
      linesRemoved: 1,
      riskScore: 8,
      recipes: ['async-file-operations'],
      status: FixStatus.SUCCESS,
    },
    {
      projectId: mobileProject.id,
      requestId: crypto.randomUUID(),
      hash: crypto.createHash('sha256').update('fix-3').digest('hex'),
      filesChanged: 3,
      linesAdded: 10,
      linesRemoved: 8,
      riskScore: 25,
      recipes: ['break-circular-dependency'],
      status: FixStatus.PARTIAL,
      error: 'Could not fully resolve circular dependency',
    },
  ];

  for (const fix of fixAttestations) {
    await prisma.fixAttestation.create({
      data: fix,
    });
  }

  console.log(`✅ Created ${fixAttestations.length} fix attestations`);

  // ============================================================================
  // 7. Audit Results (Guardian Data)
  // ============================================================================

  const auditResult1 = await prisma.auditResult.create({
    data: {
      projectId: webAppProject.id,
      requestId: crypto.randomUUID(),
      url: 'https://demo-web-app.odavl.studio',
      environment: 'production',
      device: 'desktop',
      scoreAccessibility: 95,
      scorePerformance: 82,
      scoreSecurity: 90,
      scoreSeo: 88,
      lighthousePerformance: 82,
      lighthouseAccessibility: 95,
      lighthouseBestPractices: 88,
      lighthouseSeo: 88,
      totalIssues: 8,
      criticalIssues: 0,
      highIssues: 2,
      mediumIssues: 4,
      lowIssues: 2,
      status: AuditStatus.SUCCESS,
      duration: 12500,
    },
  });

  // Audit issues for audit result 1
  const auditIssues = [
    {
      auditResultId: auditResult1.id,
      suite: 'accessibility',
      severity: Severity.MEDIUM,
      message: 'Form element missing label',
      element: '#search-input',
      recommendation: 'Add aria-label or visible label element',
      documentation: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
    },
    {
      auditResultId: auditResult1.id,
      suite: 'performance',
      severity: Severity.HIGH,
      message: 'Large image file blocking render',
      element: 'img.hero-banner',
      recommendation: 'Use next-gen formats (WebP) and lazy loading',
      documentation: 'https://web.dev/uses-optimized-images/',
    },
    {
      auditResultId: auditResult1.id,
      suite: 'security',
      severity: Severity.HIGH,
      message: 'Missing Content Security Policy header',
      recommendation: 'Add CSP header to prevent XSS attacks',
      documentation: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
    },
  ];

  for (const issue of auditIssues) {
    await prisma.auditIssue.create({ data: issue });
  }

  console.log(`✅ Created 1 audit result with ${auditIssues.length} issues`);

  // ============================================================================
  // 8. Subscriptions (Billing Data)
  // ============================================================================

  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await prisma.subscription.upsert({
    where: { organizationId: demoOrg.id },
    update: {},
    create: {
      organizationId: demoOrg.id,
      status: SubscriptionStatus.ACTIVE,
      maxProjects: 10,
      maxAnalysesMonth: 500,
      maxFixesMonth: 200,
      maxAuditsMonth: 100,
      usedAnalyses: 42,
      usedFixes: 18,
      usedAudits: 8,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: enterpriseOrg.id },
    update: {},
    create: {
      organizationId: enterpriseOrg.id,
      status: SubscriptionStatus.ACTIVE,
      maxProjects: 50,
      maxAnalysesMonth: 5000,
      maxFixesMonth: 2000,
      maxAuditsMonth: 1000,
      usedAnalyses: 127,
      usedFixes: 45,
      usedAudits: 23,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
    },
  });

  console.log('✅ Created 2 subscriptions');

  // ============================================================================
  // 9. Usage Events
  // ============================================================================

  const usageEvents = [
    {
      userId: demoUser.id,
      organizationId: demoOrg.id,
      eventType: 'insight_analysis',
      endpoint: '/api/analyze',
      requestId: crypto.randomUUID(),
      duration: 1234,
      filesAnalyzed: 42,
      linesAnalyzed: 1850,
      status: 200,
    },
    {
      userId: demoUser.id,
      organizationId: demoOrg.id,
      eventType: 'autopilot_job',
      endpoint: '/api/fix',
      requestId: crypto.randomUUID(),
      duration: 2456,
      filesModified: 2,
      status: 200,
    },
    {
      userId: adminUser.id,
      organizationId: enterpriseOrg.id,
      eventType: 'guardian_test_run',
      endpoint: '/api/audit',
      requestId: crypto.randomUUID(),
      duration: 12500,
      testsRun: 4,
      status: 200,
    },
  ];

  for (const event of usageEvents) {
    await prisma.usageEvent.create({ data: event });
  }

  console.log(`✅ Created ${usageEvents.length} usage events`);

  // ============================================================================
  // 10. API Keys
  // ============================================================================

  const apiKey = 'odavl_test_' + crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  await prisma.apiKey.create({
    data: {
      userId: demoUser.id,
      name: 'Demo API Key',
      keyHash,
      keyPrefix: apiKey.substring(0, 16),
      scopes: ['read:analyze', 'write:fix', 'read:audit'],
    },
  });

  console.log('✅ Created 1 API key');
  console.log(`📋 API Key (save this): ${apiKey}`);

  console.log('\n🎉 Database seeding complete!');
  console.log('\n📊 Summary:');
  console.log('  - 2 users');
  console.log('  - 2 organizations');
  console.log('  - 2 organization memberships');
  console.log('  - 3 projects');
  console.log('  - 5 error signatures');
  console.log('  - 3 fix attestations');
  console.log('  - 1 audit result with 3 issues');
  console.log('  - 2 subscriptions');
  console.log('  - 3 usage events');
  console.log('  - 1 API key');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
