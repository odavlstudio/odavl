/**
 * Test Railway PostgreSQL Connection
 * Run: DATABASE_URL="postgresql://..." pnpm tsx scripts/test-railway.ts
 */

// @ts-ignore - Prisma Client is generated at runtime
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing Railway PostgreSQL Connection...\n');
  
  try {
    // Test 1: Connect
    await prisma.$connect();
    console.log('✅ TEST 1: Connection successful');
    
    // Test 2: Count users
    const userCount = await prisma.user.count();
    console.log(`✅ TEST 2: User count query successful (${userCount} users)`);
    
    // Test 3: Create test user
    const testUser = await prisma.user.create({
      data: {
        email: `railway-test-${Date.now()}@odavl.com`,
        passwordHash: '$2a$10$test.hash.for.railway.connection.test',
        name: 'Railway Connection Test',
        role: 'USER',
        emailVerified: false,
      },
    });
    console.log(`✅ TEST 3: User creation successful (ID: ${testUser.id})`);
    
    // Test 4: Query user
    const foundUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    console.log(`✅ TEST 4: User query successful (Email: ${foundUser?.email})`);
    
    // Test 5: Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        tier: 'FREE',
        status: 'active',
        maxProjects: 3,
        maxAnalysesPerMonth: 100,
        maxStorageGB: 1.0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✅ TEST 5: Subscription creation successful (ID: ${subscription.id})`);
    
    // Test 6: Cleanup
    await prisma.subscription.delete({ where: { id: subscription.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ TEST 6: Cleanup successful');
    
    console.log('\n🎉 All tests passed! Railway is ready for production.\n');
    
  } catch (error) {
    console.error('\n❌ Railway connection test failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Verify DATABASE_URL is correct');
    console.error('2. Check Railway dashboard for database status');
    console.error('3. Ensure migrations are deployed (pnpm prisma migrate deploy)');
    console.error('4. Try adding ?sslmode=require to DATABASE_URL\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
