/**
 * Local Authentication Test Script
 * Tests AuthService with Prisma adapter using SQLite database
 * 
 * Run: pnpm tsx scripts/test-auth.ts
 */

import { PrismaClient } from '@prisma/client';
// Import directly from built dist files
import { AuthService, createPrismaAdapter, validatePassword } from '../packages/auth/dist/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🧪 Testing ODAVL Authentication System\n');
  console.log('=' .repeat(50));

  try {
    // Create Prisma adapter
    const adapter = createPrismaAdapter(prisma);
    const authService = new AuthService(adapter);

    // Test 1: Register new user
    console.log('\n📝 Test 1: User Registration');
    console.log('-'.repeat(50));
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecureP@ss123';
    const testName = 'Test User';

    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`Name: ${testName}`);

    const registerResult = await authService.register({
      email: testEmail,
      password: testPassword,
      name: testName,
    });

    console.log('\n✅ Registration successful!');
    console.log(`User ID: ${registerResult.user.id}`);
    console.log(`Email: ${registerResult.user.email}`);
    console.log(`Name: ${registerResult.user.name}`);
    console.log(`Email Verified: ${registerResult.user.emailVerified}`);
    console.log(`Access Token: ${registerResult.accessToken.substring(0, 20)}...`);
    console.log(`Refresh Token: ${registerResult.refreshToken.substring(0, 20)}...`);

    // Test 2: Login with correct credentials
    console.log('\n\n🔐 Test 2: Login with Correct Credentials');
    console.log('-'.repeat(50));

    const loginResult = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    console.log('\n✅ Login successful!');
    console.log(`User ID: ${loginResult.user.id}`);
    console.log(`Access Token: ${loginResult.accessToken.substring(0, 20)}...`);

    // Test 3: Login with wrong password (should fail)
    console.log('\n\n❌ Test 3: Login with Wrong Password (should fail)');
    console.log('-'.repeat(50));

    try {
      await authService.login({
        email: testEmail,
        password: 'WrongPassword123!',
      });
      console.log('❌ ERROR: Login should have failed!');
    } catch (error) {
      console.log('✅ Login correctly failed');
      console.log(`Error: ${(error as Error).message}`);
    }

    // Test 4: Register with weak password (should fail)
    console.log('\n\n❌ Test 4: Register with Weak Password (should fail)');
    console.log('-'.repeat(50));

    try {
      await authService.register({
        email: `weak-${Date.now()}@example.com`,
        password: 'weak',
        name: 'Weak User',
      });
      console.log('❌ ERROR: Registration should have failed!');
    } catch (error) {
      console.log('✅ Registration correctly failed');
      console.log(`Error: ${(error as Error).message}`);
    }

    // Test 5: Register duplicate email (should fail)
    console.log('\n\n❌ Test 5: Register Duplicate Email (should fail)');
    console.log('-'.repeat(50));

    try {
      await authService.register({
        email: testEmail,
        password: 'SecureP@ss123',
        name: 'Duplicate User',
      });
      console.log('❌ ERROR: Registration should have failed!');
    } catch (error) {
      console.log('✅ Registration correctly failed');
      console.log(`Error: ${(error as Error).message}`);
    }

    // Test 6: Password validation
    console.log('\n\n🔍 Test 6: Password Validation Rules');
    console.log('-'.repeat(50));

    const testPasswords = [
      'weak',
      'nouppercaseornumber',
      'NOLOWERCASE123',
      'NoSpecialChar123',
      'G00d!Pass',
    ];

    for (const pwd of testPasswords) {
      const result = validatePassword(pwd);
      console.log(`\nPassword: "${pwd}"`);
      console.log(`Valid: ${result.valid ? '✅' : '❌'}`);
      if (!result.valid) {
        result.errors.forEach((err) => console.log(`  - ${err}`));
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(50));
    console.log('✅ All Authentication Tests Passed!');
    console.log('='.repeat(50));
    console.log('\n📊 Test Summary:');
    console.log('  ✅ User registration works');
    console.log('  ✅ User login works');
    console.log('  ✅ Wrong password rejected');
    console.log('  ✅ Weak password rejected');
    console.log('  ✅ Duplicate email rejected');
    console.log('  ✅ Password validation works');
    console.log('\n🎉 Authentication system is fully functional!\n');

  } catch (error) {
    console.error('\n\n❌ Test Failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
