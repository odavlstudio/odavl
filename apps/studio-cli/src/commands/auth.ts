/**
 * ODAVL CLI Authentication Commands
 * Interactive login flow for CLI authentication
 */

import { Command } from 'commander';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { cliAuthService } from '../../../packages/core/src/services/cli-auth';

export const loginCommand = new Command('login')
  .description('Authenticate with ODAVL Studio')
  .option('-k, --api-key <key>', 'API key for authentication')
  .option('-p, --profile <name>', 'Profile name', 'default')
  .option('--api-url <url>', 'Override API URL')
  .action(async (options) => {
    try {
      const rl = readline.createInterface({ input, output });
      
      console.log('\n🔐 ODAVL Studio Authentication\n');
      
      // Get API key
      let apiKey = options.apiKey;
      
      if (!apiKey) {
        console.log('📝 You can create an API key at: https://studio.odavl.com/settings/api-keys\n');
        apiKey = await rl.question('Enter your API key: ');
      }
      
      if (!apiKey) {
        console.error('❌ API key is required');
        process.exit(1);
      }
      
      // Set API URL if provided
      if (options.apiUrl) {
        process.env.ODAVL_API_URL = options.apiUrl;
      }
      
      console.log('\n⏳ Validating API key...');
      
      // Login
      await cliAuthService.login(apiKey.trim(), options.profile);
      
      // Get user info
      const user = await cliAuthService.getCurrentUser();
      
      console.log('\n✅ Successfully authenticated!');
      console.log(`\n👤 User: ${user?.email}`);
      console.log(`🏢 Organization: ${user?.organizationId}`);
      console.log(`📁 Profile: ${user?.profileName}`);
      console.log('\n💡 You can now use all ODAVL CLI commands.\n');
      
      rl.close();
    } catch (error) {
      console.error(`\n❌ Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      process.exit(1);
    }
  });

export const logoutCommand = new Command('logout')
  .description('Sign out from ODAVL Studio')
  .option('-p, --profile <name>', 'Profile name to logout')
  .action(async (options) => {
    try {
      await cliAuthService.logout(options.profile);
      console.log('\n✅ Successfully logged out!\n');
    } catch (error) {
      console.error(`\n❌ Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      process.exit(1);
    }
  });

export const whoamiCommand = new Command('whoami')
  .description('Show current authentication status')
  .action(async () => {
    try {
      const user = await cliAuthService.getCurrentUser();
      
      if (!user) {
        console.log('\n❌ Not authenticated');
        console.log('💡 Run "odavl login" to authenticate\n');
        process.exit(1);
      }
      
      console.log('\n✅ Authenticated as:');
      console.log(`\n👤 Email: ${user.email}`);
      console.log(`🆔 User ID: ${user.userId}`);
      console.log(`🏢 Organization: ${user.organizationId}`);
      console.log(`📁 Profile: ${user.profileName}\n`);
    } catch (error) {
      console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      process.exit(1);
    }
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
