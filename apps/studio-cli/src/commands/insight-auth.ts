/**
 * ODAVL Insight Cloud Authentication
 * Phase 1 - Beta Onboarding (Low-Friction)
 * 
 * Simplified authentication for Insight Cloud (NextAuth-based)
 * 
 * Commands:
 * - odavl insight auth login  - Browser-based OAuth (GitHub/Google)
 * - odavl insight auth status - Show connection status
 * - odavl insight auth logout - Clear local credentials
 * 
 * Flow:
 * 1. Open browser to cloud URL
 * 2. User signs in with GitHub/Google
 * 3. Cloud redirects to callback with session token
 * 4. CLI saves token securely
 * 5. Token used for snapshot uploads
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as http from 'node:http';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { SecureStorage, type AuthToken } from '../utils/secure-storage.js';

const execAsync = promisify(exec);

// Cloud URLs (update after deployment)
const DEFAULT_CLOUD_URL = process.env.ODAVL_CLOUD_URL || 'https://your-app.vercel.app';
const CLI_CALLBACK_PORT = 23457; // Local callback server port

/**
 * Create insight auth command with subcommands
 */
export function createInsightAuthCommand(): Command {
  const authCmd = new Command('auth')
    .description('Manage Insight Cloud authentication (Beta)');
  
  // odavl insight auth login
  authCmd
    .command('login')
    .description('Sign in to Insight Cloud (browser-based OAuth)')
    .option('--cloud-url <url>', 'Override cloud URL', DEFAULT_CLOUD_URL)
    .option('--debug', 'Enable debug logging', false)
    .action(async (options) => {
      await handleLogin(options);
    });
  
  // odavl insight auth status
  authCmd
    .command('status')
    .description('Show current connection status')
    .option('--json', 'Output as JSON', false)
    .action(async (options) => {
      await handleStatus(options);
    });
  
  // odavl insight auth logout
  authCmd
    .command('logout')
    .description('Sign out and clear stored credentials')
    .action(async () => {
      await handleLogout();
    });
  
  return authCmd;
}

/**
 * Handle login command - Browser-based OAuth flow
 */
async function handleLogin(options: { cloudUrl?: string; debug?: boolean }): Promise<void> {
  const cloudUrl = options.cloudUrl || DEFAULT_CLOUD_URL;
  const storage = new SecureStorage();
  
  console.log(chalk.cyan.bold('\n🔐 Insight Cloud Authentication\n'));
  
  // Check if already authenticated
  const existingToken = await storage.loadToken();
  if (existingToken) {
    const expiresAt = new Date(existingToken.expiresAt);
    const now = new Date();
    
    if (expiresAt > now) {
      console.log(chalk.green('✓ Already authenticated'));
      console.log(chalk.white(`  User: ${existingToken.userId}`));
      console.log(chalk.white(`  Expires: ${expiresAt.toLocaleString()}\n`));
      console.log(chalk.gray('Run `odavl insight auth logout` to sign out.\n'));
      return;
    }
    
    console.log(chalk.yellow('⚠ Session expired. Please sign in again.\n'));
  }
  
  console.log(chalk.white('Opening browser for authentication...\n'));
  console.log(chalk.gray(`Cloud URL: ${cloudUrl}`));
  console.log(chalk.gray(`Callback: http://localhost:${CLI_CALLBACK_PORT}\n`));
  
  const spinner = ora('Waiting for authentication...').start();
  
  try {
    // Start local callback server
    const { server, tokenPromise } = await startCallbackServer();
    
    // Build auth URL with callback
    const authUrl = `${cloudUrl}/api/auth/signin?callbackUrl=${encodeURIComponent(`http://localhost:${CLI_CALLBACK_PORT}/callback`)}`;
    
    // Open browser
    if (options.debug) {
      spinner.text = `Opening: ${authUrl}`;
    }
    
    await openBrowser(authUrl);
    
    // Wait for callback with timeout (5 minutes)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Authentication timeout (5 minutes)')), 5 * 60 * 1000);
    });
    
    const sessionData = await Promise.race([tokenPromise, timeoutPromise]);
    
    // Close server
    server.close();
    
    // Save token
    const deviceId = storage.getDeviceFingerprint();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const authToken: AuthToken = {
      token: sessionData.sessionToken,
      refreshToken: sessionData.refreshToken || '',
      userId: sessionData.userId,
      insightPlanId: sessionData.planId || 'INSIGHT_FREE',
      expiresAt: expiresAt.toISOString(),
      deviceId,
    };
    
    const saveResult = await storage.saveToken(authToken);
    
    spinner.succeed('Authentication successful!\n');
    
    console.log(chalk.green.bold('✓ Welcome to Insight Cloud\n'));
    console.log(chalk.white('Account:'));
    console.log(chalk.white(`  User: ${sessionData.email || sessionData.userId}`));
    console.log(chalk.white(`  Plan: ${authToken.insightPlanId}`));
    console.log(chalk.white(`  Expires: ${expiresAt.toLocaleString()}`));
    console.log();
    console.log(chalk.gray(`Storage: ${saveResult.method}`));
    console.log();
    console.log(chalk.cyan('💡 Your credentials are stored securely.'));
    console.log(chalk.cyan('   Run `odavl insight analyze --upload` to send snapshots.\n'));
    
  } catch (error: any) {
    spinner.fail('Authentication failed\n');
    
    console.log(chalk.red(`✗ Error: ${error.message}\n`));
    
    if (error.message.includes('timeout')) {
      console.log(chalk.yellow('💡 Authentication took too long. Please try again.\n'));
    } else if (error.message.includes('EADDRINUSE')) {
      console.log(chalk.yellow(`💡 Port ${CLI_CALLBACK_PORT} is already in use.`));
      console.log(chalk.yellow('   Close other applications and try again.\n'));
    } else {
      console.log(chalk.gray('If the problem persists, please report this issue.\n'));
    }
    
    process.exitCode = 1;
  }
}

/**
 * Handle status command
 */
async function handleStatus(options: { json?: boolean }): Promise<void> {
  const storage = new SecureStorage();
  const token = await storage.loadToken();
  
  if (options.json) {
    if (!token) {
      console.log(JSON.stringify({ authenticated: false }, null, 2));
      return;
    }
    
    const expiresAt = new Date(token.expiresAt);
    const now = new Date();
    const isValid = expiresAt > now;
    
    console.log(JSON.stringify({
      authenticated: isValid,
      userId: token.userId,
      planId: token.insightPlanId,
      expiresAt: token.expiresAt,
      expired: !isValid,
    }, null, 2));
    
    return;
  }
  
  console.log(chalk.cyan.bold('\n👤 Insight Cloud Status\n'));
  
  if (!token) {
    console.log(chalk.yellow('✗ Not authenticated\n'));
    console.log(chalk.gray('Run `odavl insight auth login` to sign in.\n'));
    return;
  }
  
  const expiresAt = new Date(token.expiresAt);
  const now = new Date();
  const isValid = expiresAt > now;
  
  if (isValid) {
    console.log(chalk.green('✓ Authenticated\n'));
    console.log(chalk.white('Account:'));
    console.log(chalk.white(`  User: ${token.userId}`));
    console.log(chalk.white(`  Plan: ${token.insightPlanId}`));
    console.log(chalk.white(`  Expires: ${expiresAt.toLocaleString()}`));
    console.log();
  } else {
    console.log(chalk.yellow('⚠ Session expired\n'));
    console.log(chalk.white('Account (expired):'));
    console.log(chalk.white(`  User: ${token.userId}`));
    console.log(chalk.white(`  Expired: ${expiresAt.toLocaleString()}`));
    console.log();
    console.log(chalk.gray('Run `odavl insight auth login` to refresh.\n'));
  }
}

/**
 * Handle logout command
 */
async function handleLogout(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔐 Insight Cloud Logout\n'));
  
  const storage = new SecureStorage();
  const token = await storage.loadToken();
  
  if (!token) {
    console.log(chalk.yellow('Not authenticated.\n'));
    return;
  }
  
  // Delete credentials
  await storage.deleteToken();
  
  // Revoke consent
  const { ConsentManager } = await import('../utils/consent-manager.js');
  const consentManager = new ConsentManager();
  await consentManager.revokeConsent();
  
  console.log(chalk.green('✓ Signed out successfully\n'));
  console.log(chalk.gray('Your local credentials and consent have been deleted.\n'));
}

/**
 * Start local HTTP server to receive OAuth callback
 */
async function startCallbackServer(): Promise<{
  server: http.Server;
  tokenPromise: Promise<SessionData>;
}> {
  return new Promise((resolve, reject) => {
    let tokenResolver: (data: SessionData) => void;
    let tokenRejector: (error: Error) => void;
    
    const tokenPromise = new Promise<SessionData>((res, rej) => {
      tokenResolver = res;
      tokenRejector = rej;
    });
    
    const server = http.createServer((req, res) => {
      // Parse callback URL
      const url = new URL(req.url || '/', `http://localhost:${CLI_CALLBACK_PORT}`);
      
      if (url.pathname === '/callback') {
        // Extract session token from query params or cookie
        const sessionToken = url.searchParams.get('token') || 
                             req.headers.cookie?.match(/next-auth\.session-token=([^;]+)/)?.[1];
        
        const userId = url.searchParams.get('userId');
        const email = url.searchParams.get('email');
        const planId = url.searchParams.get('planId');
        
        if (sessionToken) {
          // Success response
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head>
                <title>Authentication Successful</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; 
                         padding: 40px; text-align: center; background: #f5f5f5; }
                  .success { background: white; padding: 40px; border-radius: 8px; 
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px; 
                            margin: 0 auto; }
                  h1 { color: #22c55e; margin: 0 0 20px; }
                  p { color: #666; margin: 10px 0; }
                  .close { color: #999; font-size: 14px; margin-top: 20px; }
                </style>
              </head>
              <body>
                <div class="success">
                  <h1>✓ Authentication Successful</h1>
                  <p>You've successfully signed in to Insight Cloud.</p>
                  <p>You can now close this window and return to the CLI.</p>
                  <div class="close">This window will close automatically in 3 seconds...</div>
                </div>
                <script>setTimeout(() => window.close(), 3000);</script>
              </body>
            </html>
          `);
          
          tokenResolver!({
            sessionToken,
            userId: userId || 'unknown',
            email: email || undefined,
            planId: planId || undefined,
            refreshToken: undefined,
          });
        } else {
          // Error response
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head><title>Authentication Failed</title></head>
              <body>
                <h1>Authentication Failed</h1>
                <p>No session token received. Please try again.</p>
              </body>
            </html>
          `);
          
          tokenRejector!(new Error('No session token in callback'));
        }
      } else {
        // Unknown path
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Port ${CLI_CALLBACK_PORT} is already in use`));
      } else {
        reject(error);
      }
    });
    
    server.listen(CLI_CALLBACK_PORT, () => {
      resolve({ server, tokenPromise });
    });
  });
}

/**
 * Open browser to URL
 */
async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  
  let command: string;
  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  
  try {
    await execAsync(command);
  } catch (error: any) {
    throw new Error(`Failed to open browser: ${error.message}`);
  }
}

/**
 * Session data received from OAuth callback
 */
interface SessionData {
  sessionToken: string;
  userId: string;
  email?: string;
  planId?: string;
  refreshToken?: string;
}
