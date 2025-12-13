/**
 * Phase 2.2: Production-Grade Authentication Commands
 * 
 * Commands:
 * - odavl auth login   - Authenticate with ODAVL Cloud
 * - odavl auth logout  - Clear stored credentials
 * - odavl auth status  - Show current authentication status
 * - odavl auth refresh - Manually refresh access token
 * 
 * Security:
 * - Uses SecureStorage (OS keychain + encrypted file fallback)
 * - Uses HttpClient with automatic retry + token refresh
 * - All tokens sanitized in logs
 * - Device fingerprinting for token binding
 */

import { Command } from 'commander';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';
import { getHttpClient, ApiError, NetworkError } from '../utils/http-client.js';
import { SecureStorage, type AuthToken } from '../utils/secure-storage.js';

/**
 * Login request payload
 */
interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
}

/**
 * Login response from API
 */
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  insightPlanId: string;
  expiresIn: number; // seconds
}

/**
 * Refresh response from API
 */
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Create auth command with subcommands
 */
export function createAuthCommand(): Command {
  const authCmd = new Command('auth')
    .description('Manage ODAVL Cloud authentication (Phase 2.2 - Production)');
  
  // odavl auth login
  authCmd
    .command('login')
    .description('Sign in to your ODAVL account')
    .option('--email <email>', 'User email address')
    .option('--password <password>', 'User password (not recommended - use interactive prompt)')
    .option('--debug', 'Enable debug logging', false)
    .action(async (options) => {
      await handleLogin(options);
    });
  
  // odavl auth logout
  authCmd
    .command('logout')
    .description('Sign out and clear stored credentials')
    .option('--revoke', 'Revoke token on server (requires network)', false)
    .option('--debug', 'Enable debug logging', false)
    .action(async (options) => {
      await handleLogout(options);
    });
  
  // odavl auth status
  authCmd
    .command('status')
    .description('Show current authentication status')
    .option('--json', 'Output as JSON', false)
    .option('--verbose', 'Show detailed information', false)
    .action(async (options) => {
      await handleStatus(options);
    });
  
  // odavl auth refresh
  authCmd
    .command('refresh')
    .description('Manually refresh access token')
    .option('--debug', 'Enable debug logging', false)
    .action(async (options) => {
      await handleRefresh(options);
    });
  
  return authCmd;
}

/**
 * Handle login command
 */
async function handleLogin(options: { email?: string; password?: string; debug?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold('\n🔐 ODAVL Cloud Authentication\n'));
  
  const storage = new SecureStorage();
  
  // Check if already authenticated
  const existingToken = await storage.loadToken();
  if (existingToken) {
    const expiresAt = new Date(existingToken.expiresAt);
    const now = new Date();
    
    if (expiresAt > now) {
      console.log(chalk.yellow('Already authenticated:'));
      console.log(chalk.white(`  User ID: ${existingToken.userId}`));
      console.log(chalk.white(`  Plan: ${existingToken.insightPlanId}`));
      console.log(chalk.white(`  Expires: ${expiresAt.toLocaleString()}\n`));
      
      const rl = readline.createInterface({ input, output });
      const answer = await rl.question(chalk.cyan('Login with a different account? (y/N): '));
      rl.close();
      
      if (answer.toLowerCase() !== 'y') {
        console.log(chalk.gray('Login cancelled.'));
        return;
      }
      
      console.log();
    }
  }
  
  // Get credentials
  let email = options.email;
  let password = options.password;
  
  if (!email || !password) {
    const rl = readline.createInterface({ input, output });
    
    if (!email) {
      email = await rl.question(chalk.cyan('Email: '));
    }
    
    if (!password) {
      // Note: readline doesn't support hidden input natively
      // In production, consider using a package like 'enquirer' for password masking
      password = await rl.question(chalk.cyan('Password: '));
    }
    
    rl.close();
  }
  
  // Validate inputs
  if (!email || !email.includes('@')) {
    console.log(chalk.red('\n✗ Invalid email address'));
    process.exitCode = 1;
    return;
  }
  
  if (!password || password.length < 8) {
    console.log(chalk.red('\n✗ Password must be at least 8 characters'));
    process.exitCode = 1;
    return;
  }
  
  console.log(chalk.gray('\nAuthenticating...\n'));
  
  // Initialize HTTP client
  const httpClient = getHttpClient({ debug: options.debug });
  
  try {
    // Get device fingerprint
    const deviceId = storage.getDeviceFingerprint();
    
    // Call login API
    const response = await httpClient.post<LoginResponse>(
      '/api/cli/auth/login',
      {
        email,
        password,
        deviceId,
      } as LoginRequest,
      { requiresAuth: false }
    );
    
    // Calculate expiration
    const expiresAt = new Date(Date.now() + response.expiresIn * 1000).toISOString();
    
    // Build auth token
    const authToken: AuthToken = {
      token: response.accessToken,
      refreshToken: response.refreshToken,
      userId: response.userId,
      insightPlanId: response.insightPlanId,
      expiresAt,
      deviceId,
    };
    
    // Save to secure storage
    const saveResult = await storage.saveToken(authToken);
    
    // Set token in HTTP client for future requests
    httpClient.setToken(response.accessToken);
    
    // Show success message
    console.log(chalk.green.bold('✓ Authentication successful!\n'));
    console.log(chalk.white('Account Information:'));
    console.log(chalk.white(`  User ID: ${response.userId}`));
    console.log(chalk.white(`  Plan: ${response.insightPlanId}`));
    console.log(chalk.white(`  Expires: ${new Date(expiresAt).toLocaleString()}`));
    console.log(chalk.white(`  Device: ${deviceId.substring(0, 16)}...`));
    console.log();
    console.log(chalk.gray(`Storage: ${saveResult.method} (${saveResult.message})`));
    console.log();
    
  } catch (error: any) {
    console.log(chalk.red.bold('✗ Authentication failed\n'));
    
    if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        console.log(chalk.red('Invalid email or password.'));
      } else if (error.statusCode === 429) {
        console.log(chalk.red('Too many login attempts. Please try again later.'));
      } else if (error.errorCode === 'ACCOUNT_LOCKED') {
        console.log(chalk.red('Account locked. Please contact support.'));
      } else {
        console.log(chalk.red(`Error: ${error.message}`));
      }
    } else if (error instanceof NetworkError) {
      console.log(chalk.red('Network error: Cannot reach authentication server.'));
      console.log(chalk.gray(`Details: ${error.message}`));
    } else {
      console.log(chalk.red(`Unexpected error: ${error.message}`));
    }
    
    console.log();
    process.exitCode = 1;
  }
}

/**
 * Handle logout command
 */
async function handleLogout(options: { revoke?: boolean; debug?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold('\n🔐 ODAVL Cloud Logout\n'));
  
  const storage = new SecureStorage();
  
  // Check if authenticated
  const token = await storage.loadToken();
  if (!token) {
    console.log(chalk.yellow('Not currently authenticated.'));
    return;
  }
  
  console.log(chalk.white(`Logging out user: ${token.userId}\n`));
  
  // Revoke token on server (optional)
  if (options.revoke) {
    try {
      const httpClient = getHttpClient({ debug: options.debug });
      httpClient.setToken(token.token);
      
      await httpClient.post(
        '/api/cli/auth/revoke',
        { refreshToken: token.refreshToken },
        { skipRetry: true }
      );
      
      console.log(chalk.gray('Token revoked on server.'));
    } catch (error: any) {
      // Don't fail logout if revoke fails
      console.log(chalk.yellow('⚠️  Server revocation failed (token will expire naturally).'));
      if (options.debug) {
        console.log(chalk.gray(`  Error: ${error.message}`));
      }
    }
  }
  
  // Delete local credentials
  const deleteResult = await storage.deleteToken();
  
  if (deleteResult.success) {
    console.log(chalk.green.bold('\n✓ Logged out successfully'));
    console.log(chalk.gray(`Storage: ${deleteResult.method} (${deleteResult.message})\n`));
  } else {
    console.log(chalk.yellow('\n⚠️  Logout completed with warnings'));
    console.log(chalk.gray(`Details: ${deleteResult.message}\n`));
  }
}

/**
 * Handle status command
 */
async function handleStatus(options: { json?: boolean; verbose?: boolean }): Promise<void> {
  const storage = new SecureStorage();
  
  // Load token
  const token = await storage.loadToken();
  
  if (!token) {
    if (options.json) {
      console.log(JSON.stringify({ authenticated: false }, null, 2));
    } else {
      console.log(chalk.cyan.bold('\n🔐 ODAVL Cloud Authentication Status\n'));
      console.log(chalk.yellow('Status: Not authenticated'));
      console.log();
      console.log(chalk.gray('To authenticate, run:'));
      console.log(chalk.white('  odavl auth login\n'));
    }
    return;
  }
  
  // Check expiration
  const expiresAt = new Date(token.expiresAt);
  const now = new Date();
  const isExpired = expiresAt <= now;
  const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // JSON output
  if (options.json) {
    console.log(JSON.stringify({
      authenticated: !isExpired,
      userId: token.userId,
      insightPlanId: token.insightPlanId,
      expiresAt: token.expiresAt,
      daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
      deviceId: token.deviceId,
      isExpired,
    }, null, 2));
    return;
  }
  
  // Human-readable output
  console.log(chalk.cyan.bold('\n🔐 ODAVL Cloud Authentication Status\n'));
  
  if (isExpired) {
    console.log(chalk.red('Status: Token expired ✗'));
  } else {
    console.log(chalk.green('Status: Authenticated ✓'));
  }
  
  console.log();
  console.log(chalk.white('Account Information:'));
  console.log(chalk.white(`  User ID: ${token.userId}`));
  console.log(chalk.white(`  Plan: ${token.insightPlanId}`));
  console.log(chalk.white(`  Expires: ${expiresAt.toLocaleString()}`));
  
  if (options.verbose) {
    console.log(chalk.white(`  Device: ${token.deviceId}`));
    console.log(chalk.white(`  Token (first 20): ${token.token.substring(0, 20)}...`));
  }
  
  console.log();
  
  // Expiration warnings
  if (isExpired) {
    console.log(chalk.red('⚠️  Your session has expired.'));
    console.log(chalk.gray('   Run "odavl auth login" to sign in again.\n'));
  } else if (daysUntilExpiry < 7) {
    console.log(chalk.yellow(`⚠️  Token expires in ${daysUntilExpiry} days`));
    console.log(chalk.gray('   Your session will refresh automatically during use.\n'));
  } else {
    console.log(chalk.gray(`Token valid for ${daysUntilExpiry} more days.\n`));
  }
}

/**
 * Handle refresh command
 */
async function handleRefresh(options: { debug?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold('\n🔐 ODAVL Cloud Token Refresh\n'));
  
  const storage = new SecureStorage();
  
  // Load current token
  const token = await storage.loadToken();
  if (!token) {
    console.log(chalk.red('✗ Not authenticated'));
    console.log(chalk.gray('\nRun "odavl auth login" first.\n'));
    process.exitCode = 1;
    return;
  }
  
  console.log(chalk.gray('Refreshing access token...\n'));
  
  const httpClient = getHttpClient({ debug: options.debug });
  
  try {
    // Call refresh API
    const response = await httpClient.post<RefreshResponse>(
      '/api/cli/auth/refresh',
      { refreshToken: token.refreshToken },
      { requiresAuth: false, skipRetry: true }
    );
    
    // Calculate new expiration
    const expiresAt = new Date(Date.now() + response.expiresIn * 1000).toISOString();
    
    // Update token
    const updatedToken: AuthToken = {
      ...token,
      token: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt,
    };
    
    // Save to secure storage
    await storage.saveToken(updatedToken);
    
    // Update HTTP client
    httpClient.setToken(response.accessToken);
    
    // Show success
    console.log(chalk.green.bold('✓ Token refreshed successfully\n'));
    console.log(chalk.white(`New expiration: ${new Date(expiresAt).toLocaleString()}`));
    console.log(chalk.gray(`User: ${token.userId}\n`));
    
  } catch (error: any) {
    console.log(chalk.red.bold('✗ Token refresh failed\n'));
    
    if (error instanceof ApiError) {
      if (error.statusCode === 401 || error.errorCode === 'INVALID_REFRESH_TOKEN') {
        console.log(chalk.red('Refresh token is invalid or expired.'));
        console.log(chalk.gray('You must log in again with:'));
        console.log(chalk.white('  odavl auth login\n'));
        
        // Clean up invalid token
        await storage.deleteToken();
      } else {
        console.log(chalk.red(`Error: ${error.message}\n`));
      }
    } else if (error instanceof NetworkError) {
      console.log(chalk.red('Network error: Cannot reach authentication server.'));
      console.log(chalk.gray(`Details: ${error.message}\n`));
    } else {
      console.log(chalk.red(`Unexpected error: ${error.message}\n`));
    }
    
    process.exitCode = 1;
  }
}

/**
 * Get current auth token (utility for other commands)
 */
export async function getCurrentAuthToken(): Promise<AuthToken | null> {
  const storage = new SecureStorage();
  return storage.loadToken();
}

/**
 * Check if user is authenticated (utility for other commands)
 */
export async function isAuthenticated(): Promise<boolean> {
  const storage = new SecureStorage();
  return storage.hasValidToken();
}

/**
 * Ensure user is authenticated (throws if not)
 */
export async function requireAuth(): Promise<AuthToken> {
  const token = await getCurrentAuthToken();
  
  if (!token) {
    console.log(chalk.red('\n✗ Authentication required'));
    console.log(chalk.gray('Run: odavl auth login\n'));
    process.exit(1);
  }
  
  // Check expiration
  const expiresAt = new Date(token.expiresAt);
  const now = new Date();
  
  if (expiresAt <= now) {
    console.log(chalk.red('\n✗ Your session has expired'));
    console.log(chalk.gray('Run: odavl auth login\n'));
    process.exit(1);
  }
  
  return token;
}
