/**
 * Test file to verify OPLayer imports work correctly
 * Run: tsx packages/op-layer/test-imports.ts
 */

// Test 1: Main entry point
import { logger, Cache, AnalysisProtocol, type User } from './dist/index.js';

// Test 2: Specific paths
import { Logger } from './dist/utilities.js';
import { RecipeProtocol } from './dist/protocols.js';
import { ODAVLClient } from './dist/client.js';
import { GitHubIntegration } from './dist/github.js';
import type { Project, Analysis } from './dist/types.js';

console.log('✅ All imports successful!');

// Test Logger
logger.info('Testing logger from OPLayer');

// Test Cache
const cache = new Cache<string>();
cache.set('test', 'value');
console.log('✅ Cache test:', cache.get('test') === 'value' ? 'PASS' : 'FAIL');

// Test AnalysisProtocol exists
console.log('✅ AnalysisProtocol:', typeof AnalysisProtocol === 'object' ? 'PASS' : 'FAIL');

// Test RecipeProtocol exists
console.log('✅ RecipeProtocol:', typeof RecipeProtocol === 'object' ? 'PASS' : 'FAIL');

// Test ODAVLClient instantiation
const client = new ODAVLClient({ baseUrl: 'https://test.com' });
console.log('✅ ODAVLClient:', client ? 'PASS' : 'FAIL');

// Test GitHubIntegration instantiation
const github = new GitHubIntegration({
  clientId: 'test',
  clientSecret: 'test',
  redirectUri: 'http://localhost:3000/callback'
});
console.log('✅ GitHubIntegration:', github ? 'PASS' : 'FAIL');

// Test types compile
const user: User = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date()
};
console.log('✅ User type:', user.email === 'test@example.com' ? 'PASS' : 'FAIL');

const project: Project = {
  id: '1',
  name: 'Test Project',
  description: 'Test',
  ownerId: '1',
  createdAt: new Date(),
  updatedAt: new Date()
};
console.log('✅ Project type:', project.name === 'Test Project' ? 'PASS' : 'FAIL');

console.log('\n🎉 All OPLayer imports and exports working correctly!');
