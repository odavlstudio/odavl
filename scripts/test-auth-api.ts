/**
 * Test Auth API Endpoints
 * Tests registration and login with actual HTTP requests
 * 
 * Run: pnpm tsx scripts/test-auth-api.ts
 */

const API_BASE = 'http://localhost:3001';

interface ApiResponse {
  success?: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  details?: unknown;
}

async function testRegister() {
  console.log('\n📝 Test 1: User Registration');
  console.log('-'.repeat(60));

  const testEmail = `test-${Date.now()}@example.com`;
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecureP@ss123',
      name: 'Test User',
    }),
  });

  const data: ApiResponse = await response.json();

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.status === 201 || response.status === 200) {
    console.log('✅ Registration successful!');
    return { email: testEmail, password: 'SecureP@ss123', user: data.user, tokens: data };
  } else {
    console.log('❌ Registration failed!');
    return null;
  }
}

async function testLogin(email: string, password: string) {
  console.log('\n🔐 Test 2: User Login');
  console.log('-'.repeat(60));

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data: ApiResponse = await response.json();

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.status === 200) {
    console.log('✅ Login successful!');
    return data;
  } else {
    console.log('❌ Login failed!');
    return null;
  }
}

async function testWeakPassword() {
  console.log('\n❌ Test 3: Weak Password (should fail)');
  console.log('-'.repeat(60));

  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `weak-${Date.now()}@example.com`,
      password: 'weak',
      name: 'Weak User',
    }),
  });

  const data: ApiResponse = await response.json();

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.status === 400) {
    console.log('✅ Correctly rejected weak password!');
    return true;
  } else {
    console.log('❌ Should have rejected weak password!');
    return false;
  }
}

async function testDuplicateEmail(email: string) {
  console.log('\n❌ Test 4: Duplicate Email (should fail)');
  console.log('-'.repeat(60));

  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'SecureP@ss123',
      name: 'Duplicate User',
    }),
  });

  const data: ApiResponse = await response.json();

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.status === 400 || response.status === 409) {
    console.log('✅ Correctly rejected duplicate email!');
    return true;
  } else {
    console.log('❌ Should have rejected duplicate email!');
    return false;
  }
}

async function testWrongPassword(email: string) {
  console.log('\n❌ Test 5: Wrong Password (should fail)');
  console.log('-'.repeat(60));

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'WrongPassword123!',
    }),
  });

  const data: ApiResponse = await response.json();

  console.log(`Status: ${response.status}`);
  console.log(`Response:`, JSON.stringify(data, null, 2));

  if (response.status === 401) {
    console.log('✅ Correctly rejected wrong password!');
    return true;
  } else {
    console.log('❌ Should have rejected wrong password!');
    return false;
  }
}

async function main() {
  console.log('\n🧪 Testing ODAVL Auth API Endpoints\n');
  console.log('='.repeat(60));

  try {
    // Wait for server to be ready
    console.log('\n⏳ Waiting for dev server to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 1: Register
    const registerResult = await testRegister();
    if (!registerResult) {
      throw new Error('Registration failed');
    }

    // Test 2: Login
    const loginResult = await testLogin(registerResult.email, registerResult.password);
    if (!loginResult) {
      throw new Error('Login failed');
    }

    // Test 3: Weak Password
    const weakPasswordTest = await testWeakPassword();
    
    // Test 4: Duplicate Email
    const duplicateTest = await testDuplicateEmail(registerResult.email);
    
    // Test 5: Wrong Password
    const wrongPasswordTest = await testWrongPassword(registerResult.email);

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));

    const results = [
      { name: 'Registration', passed: !!registerResult },
      { name: 'Login', passed: !!loginResult },
      { name: 'Weak Password Rejection', passed: weakPasswordTest },
      { name: 'Duplicate Email Rejection', passed: duplicateTest },
      { name: 'Wrong Password Rejection', passed: wrongPasswordTest },
    ];

    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;

    results.forEach(r => {
      console.log(`${r.passed ? '✅' : '❌'} ${r.name}`);
    });

    console.log(`\nTotal: ${passedTests}/${totalTests} passed (${((passedTests / totalTests) * 100).toFixed(0)}%)`);

    if (passedTests === totalTests) {
      console.log('\n🎉 All API tests passed!');
      console.log('\n✅ Auth System Status:');
      console.log('  ✅ Registration endpoint working');
      console.log('  ✅ Login endpoint working');
      console.log('  ✅ Password validation enforced');
      console.log('  ✅ Duplicate prevention working');
      console.log('  ✅ Authentication security verified');
      console.log('\n🚀 Ready for production deployment!\n');
    } else {
      console.log('\n❌ Some tests failed. Review implementation.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n\n❌ Test Suite Failed:');
    console.error(error);
    console.log('\n💡 Make sure dev server is running: pnpm insight:dev\n');
    process.exit(1);
  }
}

main();
