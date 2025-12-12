/**
 * ODAVL CLI Authentication Commands
 * Unified ODAVL ID authentication via device code flow
 * 
 * Commands:
 * - odavl auth login  - Device code flow (browser-based OAuth)
 * - odavl auth status - Show current ODAVL ID session
 * - odavl auth logout - Clear local credentials
 * - odavl auth key    - Legacy API key login (deprecated)
 */

import { Command } from 'commander';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { CLIAuthService } from '@odavl/core/services/cli-auth';
import chalk from 'chalk';
import ora from 'ora';
import open from 'open';
import type { DeviceCodeResponse } from '@odavl-studio/auth/device-code-flow';
import { verifyOdavlToken } from '@odavl-studio/auth/odavl-id';
import { formatDistance } from 'date-fns';
import { trackInsightEvent, InsightTelemetryClient } from '@odavl-studio/telemetry';

const API_BASE_URL = process.env.ODAVL_API_URL || 'https://api.odavl.com';

/**
 * Device code flow login command
 */
export const loginCommand = new Command('login')
  .description('Sign in to your ODAVL account (browser-based OAuth)')
  .option('--api-url <url>', 'Override API base URL')
  .action(async (options) => {
    const apiUrl = options.apiUrl || API_BASE_URL;
    const authService = CLIAuthService.getInstance();
    
    console.log(chalk.cyan.bold('\n🔐 ODAVL Authentication\n'));
    console.log(chalk.white('Initiating device authorization flow...\n'));
    
    const spinner = ora('Requesting device code...').start();
    
    try {
      // Step 1: Request device code
      const response = await fetch(`${apiUrl}/auth/device/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'odavl-cli' }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to request device code: ${response.statusText}`);
      }
      
      const deviceData: DeviceCodeResponse = await response.json();
      spinner.succeed('Device code obtained\n');
      
      // Step 2: Display instructions
      console.log(chalk.cyan('Please complete authentication in your browser:\n'));
      console.log(chalk.white('  URL:  ') + chalk.green.bold(deviceData.verificationUri));
      console.log(chalk.white('  Code: ') + chalk.yellow.bold(deviceData.userCode) + '\n');
      
      console.log(chalk.gray(`Opening browser automatically...\n`));
      
      // Step 3: Open browser
      try {
        await open(deviceData.verificationUriComplete || deviceData.verificationUri);
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not open browser automatically.'));
        console.log(chalk.white('Please open the URL manually.\n'));
      }
      
      // Step 4: Poll for authorization
      const pollSpinner = ora({
        text: 'Waiting for authorization...',
        color: 'cyan',
      }).start();
      
      let attempts = 0;
      const maxAttempts = Math.ceil(deviceData.expiresIn / deviceData.interval);
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, deviceData.interval * 1000));
        
        try {
          const tokenResponse = await fetch(`${apiUrl}/auth/device/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceCode: deviceData.deviceCode }),
          });
          
          if (tokenResponse.ok) {
            const tokens = await tokenResponse.json();
            
            // Verify token and extract session
            const session = verifyOdavlToken(tokens.accessToken);
            if (!session) {
              throw new Error('Invalid token received from server');
            }
            
            // Save credentials
            await authService.login({
              apiKey: tokens.accessToken,
              userId: session.userId,
              email: session.email,
              organizationId: session.organizationId || '',
              expiresAt: session.expiresAt?.toISOString() || '',
              refreshToken: tokens.refreshToken,
            });
            
            pollSpinner.succeed('Authentication successful!\n');
            
            // Track login event
            const isFirstLogin = !await authService.hasSessionHistory();
            await trackInsightEvent('insight.cli_login', {
              authMethod: 'device_code',
              isFirstLogin,
            }, {
              userId: InsightTelemetryClient.hashUserId(session.email),
              planId: session.insightPlanId || 'INSIGHT_FREE',
              source: 'cli',
            });
            
            // Display welcome message
            console.log(chalk.green.bold('✅ Welcome to ODAVL!\n'));
            console.log(chalk.white('  Name:  ') + chalk.cyan(session.name));
            console.log(chalk.white('  Email: ') + chalk.cyan(session.email));
            console.log(chalk.white('  Plan:  ') + chalk.yellow(session.insightPlanId));
            
            if (session.organizationId) {
              console.log(chalk.white('  Org:   ') + chalk.magenta(session.organizationId));
            }
            
            console.log();
            console.log(chalk.gray('Your credentials have been saved locally.'));
            console.log(chalk.gray('Run `odavl auth status` to view your account.\n'));
            
            return;
          }
          
          // Check for specific errors
          const error = await tokenResponse.json();
          
          if (error.error === 'authorization_pending') {
            // Still waiting, continue polling
            attempts++;
            pollSpinner.text = `Waiting for authorization... (${attempts}/${maxAttempts})`;
            continue;
          }
          
          if (error.error === 'slow_down') {
            // Server asked to slow down
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          
          // Other error
          throw new Error(error.message || 'Authentication failed');
          
        } catch (error) {
          if (error instanceof Error && error.message.includes('fetch')) {
            // Network error, continue trying
            attempts++;
            continue;
          }
          throw error;
        }
      }
      
      // Timeout
      pollSpinner.fail('Authentication timed out\n');
      console.log(chalk.red('❌ Device code expired. Please try again.\n'));
      console.log(chalk.gray(`Run: ${chalk.cyan('odavl auth login')}\n`));
      process.exit(1);
      
    } catch (error) {
      spinner.fail('Authentication failed\n');
      
      if (error instanceof Error) {
        console.log(chalk.red(`❌ Error: ${error.message}\n`));
      } else {
        console.log(chalk.red('❌ An unexpected error occurred\n'));
      }
      
      process.exit(1);
    }
  });

/**
 * Show auth status command
 */
export const statusCommand = new Command('status')
  .description('Show current authentication status')
  .action(async () => {
    const authService = CLIAuthService.getInstance();
    
    console.log(chalk.cyan.bold('\n👤 ODAVL Account Status\n'));
    
    try {
      const credentials = await authService.getCredentials();
      
      if (!credentials) {
        console.log(chalk.yellow('⚠️  Not authenticated\n'));
        console.log(chalk.gray('Sign in to your ODAVL account:\n'));
        console.log(chalk.white(`  ${chalk.cyan('odavl auth login')}\n`));
        return;
      }
      
      // Verify token is still valid
      const session = verifyOdavlToken(credentials.apiKey);
      
      if (!session) {
        console.log(chalk.red('❌ Token expired\n'));
        console.log(chalk.gray('Your session has expired. Please sign in again:\n'));
        console.log(chalk.white(`  ${chalk.cyan('odavl auth login')}\n`));
        return;
      }
      
      // Display account info
      console.log(chalk.white('  Status: ') + chalk.green.bold('✅ Authenticated'));
      console.log(chalk.white('  Name:   ') + chalk.cyan(session.name));
      console.log(chalk.white('  Email:  ') + chalk.cyan(session.email));
      console.log(chalk.white('  Plan:   ') + chalk.yellow.bold(session.insightPlanId));
      
      if (session.organizationId) {
        console.log(chalk.white('  Org ID: ') + chalk.magenta(session.organizationId));
      }
      
      // Display token expiry
      if (session.expiresAt) {
        const now = new Date();
        const isExpiringSoon = session.expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;
        
        console.log(
          chalk.white('  Expires:') + 
          (isExpiringSoon ? chalk.red.bold(' Soon') : chalk.gray(' ' + formatDistance(session.expiresAt, now, { addSuffix: true })))
        );
        
        if (isExpiringSoon) {
          console.log();
          console.log(chalk.yellow('⚠️  Your session is expiring soon.'));
          console.log(chalk.gray('Run `odavl auth login` to refresh.\n'));
        }
      }
      
      console.log();
      
    } catch (error) {
      console.log(chalk.red('❌ Error checking authentication status\n'));
      
      if (error instanceof Error) {
        console.log(chalk.gray(error.message + '\n'));
      }
      
      process.exit(1);
    }
  });

/**
 * Logout command
 */
export const logoutCommand = new Command('logout')
  .description('Sign out of your ODAVL account')
  .action(async () => {
    const authService = CLIAuthService.getInstance();
    
    console.log(chalk.cyan.bold('\n👋 ODAVL Logout\n'));
    
    try {
      const credentials = await authService.getCredentials();
      
      if (!credentials) {
        console.log(chalk.yellow('⚠️  Not currently authenticated\n'));
        return;
      }
      
      const spinner = ora('Signing out...').start();
      
      // Clear local credentials
      await authService.logout();
      
      spinner.succeed('Signed out successfully\n');
      
      console.log(chalk.green('✅ You have been logged out.'));
      console.log(chalk.gray('Your credentials have been removed from this device.\n'));
      
    } catch (error) {
      console.log(chalk.red('❌ Error during logout\n'));
      
      if (error instanceof Error) {
        console.log(chalk.gray(error.message + '\n'));
      }
      
      process.exit(1);
    }
  });

/**
 * Legacy whoami command (alias for status)
 */
export const whoamiCommand = new Command('whoami')
  .description('Show current authentication status (alias for status)')
  .action(async () => {
    await statusCommand.parseAsync(['status'], { from: 'user' });
  });

export const profilesCommand = new Command('profiles')
  .description('Manage authentication profiles')
  .action(async () => {
    try {
      const profiles = await cliAuthService.listProfiles();
      
      if (profiles.length === 0) {
        console.log('\n📝 No profiles found');
        console.log('💡 Run "odavl login" to create a profile\n');
        return;
      }
      
      console.log('\n📁 Authentication Profiles:\n');
      
      for (const profile of profiles) {
        const defaultBadge = profile.isDefault ? ' (default)' : '';
        console.log(`  ${profile.isDefault ? '✓' : ' '} ${profile.name}${defaultBadge}`);
        console.log(`    📧 ${profile.credentials.email}`);
        console.log(`    🏢 ${profile.credentials.organizationId}`);
        console.log(`    🕐 Last used: ${new Date(profile.lastUsedAt).toLocaleString()}`);
        console.log('');
      }
    } catch (error) {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      process.exit(1);
    }
  });

export const switchCommand = new Command('switch')
  .description('Switch default authentication profile')
  .argument('<profile>', 'Profile name to switch to')
  .action(async (profileName: string) => {
    try {
      await cliAuthService.switchProfile(profileName);
      console.log(`\n✅ Switched to profile: ${profileName}\n`);
    } catch (error) {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      process.exit(1);
    }
  });

/**
 * Require authentication middleware
 */
export async function requireAuth(): Promise<void> {
  const isAuthenticated = await cliAuthService.isAuthenticated();
  
  if (!isAuthenticated) {
    console.error('\n❌ Authentication required');
    console.error('💡 Run "odavl login" to authenticate\n');
    process.exit(1);
  }
}

/**
 * Get authenticated fetch function
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const credentials = await cliAuthService.getCredentials();
  
  if (!credentials) {
    throw new Error('Not authenticated');
  }
  
  const apiUrl = await cliAuthService.getApiUrl();
  const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`;
  
  return fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${credentials.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}
