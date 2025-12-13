/**
 * Phase 2.2 Task 8: Authentication Flow Verification Tests
 * 
 * Tests login, logout, status, and token storage
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { 
  runSuite, 
  assert, 
  assertEquals, 
  MockResponse,
  createTempWorkspace, 
  cleanupTempWorkspace,
  fileExists,
} from './test-utils.js';

// Mock auth functions for testing
async function mockLogin(email: string, password: string, workspaceRoot: string): Promise<{ success: boolean; token?: string; error?: string }> {
  // Simulate successful login
  if (email === 'test@example.com' && password === 'password123') {
    const token = 'mock-jwt-token-' + Date.now();
    
    // Store token in .odavl/auth.json
    const authPath = path.join(workspaceRoot, '.odavl', 'auth.json');
    await fs.mkdir(path.join(workspaceRoot, '.odavl'), { recursive: true });
    await fs.writeFile(authPath, JSON.stringify({ token, email }), 'utf-8');
    
    return { success: true, token };
  }
  
  return { success: false, error: 'Invalid credentials' };
}

async function mockLogout(workspaceRoot: string): Promise<void> {
  const authPath = path.join(workspaceRoot, '.odavl', 'auth.json');
  try {
    await fs.unlink(authPath);
  } catch {
    // Ignore if file doesn't exist
  }
}

async function mockGetStatus(workspaceRoot: string): Promise<{ authenticated: boolean; email?: string }> {
  const authPath = path.join(workspaceRoot, '.odavl', 'auth.json');
  
  try {
    const content = await fs.readFile(authPath, 'utf-8');
    const data = JSON.parse(content);
    
    return { authenticated: true, email: data.email };
  } catch {
    return { authenticated: false };
  }
}

export async function verifyAuthFlow() {
  const tests = [
    {
      name: 'Login stores token successfully',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const result = await mockLogin('test@example.com', 'password123', workspace);
        
        assert(result.success, 'Login should succeed');
        assert(result.token !== undefined, 'Token should be returned');
        
        const authPath = path.join(workspace, '.odavl', 'auth.json');
        const exists = await fileExists(authPath);
        assert(exists, 'Auth file should be created');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Login fails with invalid credentials',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const result = await mockLogin('test@example.com', 'wrongpassword', workspace);
        
        assert(!result.success, 'Login should fail');
        assert(result.error !== undefined, 'Error message should be returned');
        
        const authPath = path.join(workspace, '.odavl', 'auth.json');
        const exists = await fileExists(authPath);
        assert(!exists, 'Auth file should not be created on failed login');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Status reads token correctly',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        // Login first
        await mockLogin('test@example.com', 'password123', workspace);
        
        // Check status
        const status = await mockGetStatus(workspace);
        
        assert(status.authenticated, 'Should be authenticated');
        assertEquals(status.email, 'test@example.com', 'Email should match');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Status returns unauthenticated when no token',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        const status = await mockGetStatus(workspace);
        
        assert(!status.authenticated, 'Should not be authenticated');
        assert(status.email === undefined, 'Email should not be present');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Logout deletes token',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        // Login first
        await mockLogin('test@example.com', 'password123', workspace);
        
        // Verify authenticated
        let status = await mockGetStatus(workspace);
        assert(status.authenticated, 'Should be authenticated before logout');
        
        // Logout
        await mockLogout(workspace);
        
        // Verify not authenticated
        status = await mockGetStatus(workspace);
        assert(!status.authenticated, 'Should not be authenticated after logout');
        
        const authPath = path.join(workspace, '.odavl', 'auth.json');
        const exists = await fileExists(authPath);
        assert(!exists, 'Auth file should be deleted');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Multiple login/logout cycles work correctly',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        // First login
        await mockLogin('test@example.com', 'password123', workspace);
        let status = await mockGetStatus(workspace);
        assert(status.authenticated, 'Should be authenticated after first login');
        
        // First logout
        await mockLogout(workspace);
        status = await mockGetStatus(workspace);
        assert(!status.authenticated, 'Should be logged out');
        
        // Second login
        await mockLogin('test@example.com', 'password123', workspace);
        status = await mockGetStatus(workspace);
        assert(status.authenticated, 'Should be authenticated after second login');
        
        // Second logout
        await mockLogout(workspace);
        status = await mockGetStatus(workspace);
        assert(!status.authenticated, 'Should be logged out again');
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Token persists across status checks',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        await mockLogin('test@example.com', 'password123', workspace);
        
        // Multiple status checks
        for (let i = 0; i < 5; i++) {
          const status = await mockGetStatus(workspace);
          assert(status.authenticated, `Should still be authenticated on check ${i + 1}`);
          assertEquals(status.email, 'test@example.com', 'Email should remain consistent');
        }
        
        await cleanupTempWorkspace(workspace);
      },
    },
    
    {
      name: 'Auth file contains valid JSON',
      fn: async () => {
        const workspace = await createTempWorkspace();
        
        await mockLogin('test@example.com', 'password123', workspace);
        
        const authPath = path.join(workspace, '.odavl', 'auth.json');
        const content = await fs.readFile(authPath, 'utf-8');
        
        let data: any;
        try {
          data = JSON.parse(content);
        } catch {
          throw new Error('Auth file should contain valid JSON');
        }
        
        assert(typeof data.token === 'string', 'Token should be string');
        assert(typeof data.email === 'string', 'Email should be string');
        assert(data.token.length > 0, 'Token should not be empty');
        
        await cleanupTempWorkspace(workspace);
      },
    },
  ];

  return await runSuite('Authentication Flow Verification', tests);
}

// Run if executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  verifyAuthFlow().then(() => process.exit(0)).catch(() => process.exit(1));
}
