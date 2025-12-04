/**
 * ODAVL Insight - Plugin Manager CLI Commands
 * Commands: install, uninstall, search, list, publish, update
 * 
 * @note This file implements future marketplace features
 * @todo Complete MarketplacePlugin interface and API integration
 */

// @ts-nocheck - Temporary: Marketplace APIs under development
import { Command } from 'commander';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Marketplace plugin type (temporary until package exists)
interface MarketplacePlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
}

// ============================================================
// Configuration
// ============================================================

const MARKETPLACE_API_URL = process.env.ODAVL_MARKETPLACE_API || 'http://localhost:3001/api';
const PLUGINS_DIR = join(homedir(), '.odavl', 'plugins');
const INSTALLED_PLUGINS_FILE = join(homedir(), '.odavl', 'installed-plugins.json');

// ============================================================
// Helper Functions
// ============================================================

function ensurePluginsDir(): void {
  if (!existsSync(PLUGINS_DIR)) {
    mkdirSync(PLUGINS_DIR, { recursive: true });
  }
  if (!existsSync(INSTALLED_PLUGINS_FILE)) {
    writeFileSync(INSTALLED_PLUGINS_FILE, JSON.stringify([], null, 2));
  }
}

function getInstalledPlugins(): MarketplacePlugin[] {
  ensurePluginsDir();
  try {
    const content = readFileSync(INSTALLED_PLUGINS_FILE, 'utf8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveInstalledPlugins(plugins: MarketplacePlugin[]): void {
  ensurePluginsDir();
  writeFileSync(INSTALLED_PLUGINS_FILE, JSON.stringify(plugins, null, 2));
}

function isPluginInstalled(pluginId: string): boolean {
  const installed = getInstalledPlugins();
  return installed.some(p => p.id === pluginId);
}

async function fetchFromMarketplace<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${MARKETPLACE_API_URL}${endpoint}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Marketplace API error: ${(errorData as any).error || response.statusText}`);
    }
    return await response.json() as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Marketplace API error: ${message}`);
  }
}

async function postToMarketplace<T>(endpoint: string, data: unknown): Promise<T> {
  try {
    const response = await fetch(`${MARKETPLACE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Marketplace API error: ${(errorData as any).error || response.statusText}`);
    }
    return await response.json() as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Marketplace API error: ${message}`);
  }
}

function printPluginCard(plugin: MarketplacePlugin, showDetails = false): void {
  console.log(chalk.bold.blue(`\n${plugin.name}`));
  console.log(chalk.gray(`  ${plugin.id} v${plugin.version}`));
  console.log(chalk.white(`  ${plugin.description}`));
  
  if (showDetails) {
    console.log(chalk.gray(`  Author: ${plugin.author.name}`));
    console.log(chalk.gray(`  Type: ${plugin.type}`));
    console.log(chalk.gray(`  License: ${plugin.license}`));
  }
  
  // Stats
  const stars = '⭐'.repeat(Math.round(plugin.rating));
  console.log(
    chalk.yellow(`  ${stars} ${plugin.rating.toFixed(1)}`),
    chalk.gray(`(${plugin.reviews} reviews)`),
    chalk.green(`↓ ${formatNumber(plugin.downloads)} downloads`)
  );
  
  // Tags
  if (plugin.tags.length > 0) {
    console.log(chalk.cyan(`  Tags: ${plugin.tags.slice(0, 5).join(', ')}`));
  }
  
  // Verified badge
  if (plugin.verified) {
    console.log(chalk.green('  ✓ Verified Plugin'));
  }
  
  // Installed badge
  if (isPluginInstalled(plugin.id)) {
    console.log(chalk.blue('  ✓ Installed'));
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ============================================================
// Command: odavl plugin install <plugin-id>
// ============================================================

async function installPlugin(pluginId: string): Promise<void> {
  const spinner = ora(`Installing plugin: ${pluginId}`).start();
  
  try {
    // Check if already installed
    if (isPluginInstalled(pluginId)) {
      spinner.warn(chalk.yellow(`Plugin ${pluginId} is already installed`));
      console.log(chalk.gray('Use "odavl plugin update" to update it'));
      return;
    }
    
    // Fetch plugin details from marketplace
    spinner.text = `Fetching plugin details...`;
    const plugin = await fetchFromMarketplace<MarketplacePlugin>(`/plugins/${pluginId}`);
    
    // Track installation
    spinner.text = `Tracking installation...`;
    await postToMarketplace(`/plugins/${pluginId}/install`, {});
    
    // Download plugin (mock - in real implementation, download from CDN)
    spinner.text = `Downloading plugin...`;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Install plugin
    spinner.text = `Installing plugin...`;
    const installed = getInstalledPlugins();
    installed.push(plugin);
    saveInstalledPlugins(installed);
    
    spinner.succeed(chalk.green(`✓ Plugin ${chalk.bold(plugin.name)} installed successfully`));
    
    // Show plugin info
    printPluginCard(plugin, true);
    
    console.log(chalk.gray(`\nPlugin installed to: ${PLUGINS_DIR}`));
    console.log(chalk.gray(`Run "odavl insight analyze" to use the new detector`));
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to install plugin: ${(error as Error).message}`));
    process.exit(1);
  }
}

// ============================================================
// Command: odavl plugin uninstall <plugin-id>
// ============================================================

async function uninstallPlugin(pluginId: string): Promise<void> {
  const spinner = ora(`Uninstalling plugin: ${pluginId}`).start();
  
  try {
    // Check if installed
    if (!isPluginInstalled(pluginId)) {
      spinner.warn(chalk.yellow(`Plugin ${pluginId} is not installed`));
      return;
    }
    
    // Remove from installed list
    const installed = getInstalledPlugins();
    const filtered = installed.filter(p => p.id !== pluginId);
    saveInstalledPlugins(filtered);
    
    spinner.succeed(chalk.green(`✓ Plugin ${pluginId} uninstalled successfully`));
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to uninstall plugin: ${(error as Error).message}`));
    process.exit(1);
  }
}

// ============================================================
// Command: odavl plugin search <query>
// ============================================================

async function searchPlugins(query: string, options: { category?: string; limit?: number }): Promise<void> {
  const spinner = ora(`Searching marketplace for: ${query}`).start();
  
  try {
    // Build query params
    const params = new URLSearchParams();
    params.append('search', query);
    if (options.category) params.append('category', options.category);
    params.append('limit', (options.limit || 20).toString());
    
    // Search marketplace
    const result = await fetchFromMarketplace<{ plugins: MarketplacePlugin[] }>(`/plugins?${params}`);
    
    spinner.stop();
    
    if (result.plugins.length === 0) {
      console.log(chalk.yellow(`\nNo plugins found matching "${query}"`));
      return;
    }
    
    console.log(chalk.bold.green(`\n✓ Found ${result.plugins.length} plugins:`));
    
    for (const plugin of result.plugins) {
      printPluginCard(plugin);
    }
    
    console.log(chalk.gray(`\nInstall a plugin: ${chalk.white('odavl plugin install <plugin-id>')}`));
    
  } catch (error) {
    spinner.fail(chalk.red(`Search failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

// ============================================================
// Command: odavl plugin list
// ============================================================

function listInstalledPlugins(): void {
  const installed = getInstalledPlugins();
  
  if (installed.length === 0) {
    console.log(chalk.yellow('No plugins installed'));
    console.log(chalk.gray('Search for plugins: odavl plugin search <query>'));
    return;
  }
  
  console.log(chalk.bold.green(`\n✓ Installed Plugins (${installed.length}):`));
  
  for (const plugin of installed) {
    printPluginCard(plugin);
  }
  
  console.log(chalk.gray(`\nUninstall: ${chalk.white('odavl plugin uninstall <plugin-id>')}`));
  console.log(chalk.gray(`Update: ${chalk.white('odavl plugin update <plugin-id>')}`));
}

// ============================================================
// Command: odavl plugin update <plugin-id>
// ============================================================

async function updatePlugin(pluginId: string): Promise<void> {
  const spinner = ora(`Updating plugin: ${pluginId}`).start();
  
  try {
    // Check if installed
    const installed = getInstalledPlugins();
    const existingPlugin = installed.find(p => p.id === pluginId);
    
    if (!existingPlugin) {
      spinner.warn(chalk.yellow(`Plugin ${pluginId} is not installed`));
      return;
    }
    
    // Fetch latest version from marketplace
    spinner.text = `Checking for updates...`;
    const latestPlugin = await fetchFromMarketplace<MarketplacePlugin>(`/plugins/${pluginId}`);
    
    // Compare versions
    if (existingPlugin.version === latestPlugin.version) {
      spinner.info(chalk.blue(`Plugin ${pluginId} is already up to date (v${existingPlugin.version})`));
      return;
    }
    
    // Download and install update
    spinner.text = `Downloading update...`;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update installed plugins
    const updatedInstalled = installed.map(p =>
      p.id === pluginId ? latestPlugin : p
    );
    saveInstalledPlugins(updatedInstalled);
    
    spinner.succeed(chalk.green(`✓ Plugin ${latestPlugin.name} updated: v${existingPlugin.version} → v${latestPlugin.version}`));
    
    // Show changelog if available
    if (latestPlugin.changelog) {
      console.log(chalk.bold('\nChangelog:'));
      console.log(chalk.gray(latestPlugin.changelog));
    }
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to update plugin: ${(error as Error).message}`));
    process.exit(1);
  }
}

// ============================================================
// Command: odavl plugin info <plugin-id>
// ============================================================

async function showPluginInfo(pluginId: string): Promise<void> {
  const spinner = ora(`Fetching plugin details: ${pluginId}`).start();
  
  try {
    // Fetch from marketplace
    const plugin = await fetchFromMarketplace<MarketplacePlugin>(`/plugins/${pluginId}`);
    
    spinner.stop();
    
    // Show detailed info
    console.log(chalk.bold.blue(`\n${plugin.name}`));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white(plugin.description));
    console.log();
    
    // Metadata
    console.log(chalk.bold('Plugin ID:'), chalk.gray(plugin.id));
    console.log(chalk.bold('Version:'), chalk.gray(plugin.version));
    console.log(chalk.bold('Author:'), chalk.gray(plugin.author.name));
    console.log(chalk.bold('License:'), chalk.gray(plugin.license));
    console.log(chalk.bold('Type:'), chalk.gray(plugin.type));
    console.log();
    
    // Stats
    const stars = '⭐'.repeat(Math.round(plugin.rating));
    console.log(chalk.bold('Rating:'), chalk.yellow(`${stars} ${plugin.rating.toFixed(1)}/5.0`), chalk.gray(`(${plugin.reviews} reviews)`));
    console.log(chalk.bold('Downloads:'), chalk.green(formatNumber(plugin.downloads)));
    console.log();
    
    // Dates
    console.log(chalk.bold('Published:'), chalk.gray(new Date(plugin.publishedAt).toLocaleDateString()));
    console.log(chalk.bold('Updated:'), chalk.gray(new Date(plugin.updatedAt).toLocaleDateString()));
    console.log();
    
    // Links
    if (plugin.homepage) {
      console.log(chalk.bold('Homepage:'), chalk.cyan(plugin.homepage));
    }
    if (plugin.repository) {
      console.log(chalk.bold('Repository:'), chalk.cyan(plugin.repository));
    }
    console.log();
    
    // Tags
    console.log(chalk.bold('Tags:'), chalk.cyan(plugin.tags.join(', ')));
    console.log();
    
    // Verified
    if (plugin.verified) {
      console.log(chalk.green('✓ Verified Plugin'));
    }
    
    // Installed status
    if (isPluginInstalled(plugin.id)) {
      console.log(chalk.blue('✓ Installed'));
    } else {
      console.log(chalk.gray(`Install: ${chalk.white(`odavl plugin install ${plugin.id}`)}`));
    }
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to fetch plugin info: ${(error as Error).message}`));
    process.exit(1);
  }
}

// ============================================================
// Command: odavl plugin publish
// ============================================================

async function publishPlugin(packageJsonPath: string): Promise<void> {
  const spinner = ora('Publishing plugin...').start();
  
  try {
    // Read package.json
    if (!existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at ${packageJsonPath}`);
    }
    
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    // Validate required fields
    const required = ['name', 'version', 'description', 'author', 'odavl'];
    for (const field of required) {
      if (!packageJson[field]) {
        throw new Error(`Missing required field in package.json: ${field}`);
      }
    }
    
    // Build plugin metadata
    const plugin: Partial<MarketplacePlugin> = {
      id: packageJson.name,
      name: packageJson.odavl.displayName || packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      author: packageJson.author,
      license: packageJson.license || 'MIT',
      type: packageJson.odavl.type,
      keywords: packageJson.keywords || [],
      engines: packageJson.engines || {},
      homepage: packageJson.homepage,
      repository: packageJson.repository?.url,
      category: packageJson.odavl.category,
      tags: packageJson.odavl.tags || [],
    };
    
    // Publish to marketplace
    spinner.text = 'Uploading to marketplace...';
    const result = await postToMarketplace<{ message: string; plugin: MarketplacePlugin }>(
      '/plugins',
      plugin
    );
    
    spinner.succeed(chalk.green(`✓ Plugin published successfully!`));
    
    console.log(chalk.gray('\nYour plugin is now available on the marketplace:'));
    console.log(chalk.cyan(`  https://plugins.odavl.studio/${result.plugin.id}`));
    console.log();
    console.log(chalk.gray('Users can install it with:'));
    console.log(chalk.white(`  odavl plugin install ${result.plugin.id}`));
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to publish plugin: ${(error as Error).message}`));
    process.exit(1);
  }
}

// ============================================================
// Command: odavl plugin featured
// ============================================================

async function showFeaturedPlugins(): Promise<void> {
  const spinner = ora('Fetching featured plugins...').start();
  
  try {
    const result = await fetchFromMarketplace<{ plugins: MarketplacePlugin[] }>('/featured');
    
    spinner.stop();
    
    console.log(chalk.bold.green(`\n⭐ Featured Plugins:`));
    
    for (const plugin of result.plugins) {
      printPluginCard(plugin);
    }
    
    console.log(chalk.gray(`\nBrowse more: ${chalk.white('odavl plugin search <query>')}`));
    
  } catch (error) {
    spinner.fail(chalk.red(`Failed to fetch featured plugins: ${(error as Error).message}`));
    process.exit(1);
  }
}

// ============================================================
// Register Commands
// ============================================================

export function registerPluginCommands(program: Command): void {
  const plugin = program
    .command('plugin')
    .description('Manage ODAVL Insight plugins');
  
  // odavl plugin install <plugin-id>
  plugin
    .command('install <plugin-id>')
    .description('Install a plugin from marketplace')
    .action(installPlugin);
  
  // odavl plugin uninstall <plugin-id>
  plugin
    .command('uninstall <plugin-id>')
    .description('Uninstall a plugin')
    .action(uninstallPlugin);
  
  // odavl plugin search <query>
  plugin
    .command('search <query>')
    .description('Search for plugins in marketplace')
    .option('-c, --category <category>', 'Filter by category (detector, analyzer, reporter, integration)')
    .option('-l, --limit <number>', 'Maximum number of results', '20')
    .action(searchPlugins);
  
  // odavl plugin list
  plugin
    .command('list')
    .description('List installed plugins')
    .action(listInstalledPlugins);
  
  // odavl plugin update [plugin-id]
  plugin
    .command('update [plugin-id]')
    .description('Update a plugin (or all plugins if no ID provided)')
    .action(async (pluginId?: string) => {
      if (pluginId) {
        await updatePlugin(pluginId);
      } else {
        // Update all plugins
        const installed = getInstalledPlugins();
        console.log(chalk.blue(`Updating ${installed.length} plugins...\n`));
        for (const plugin of installed) {
          await updatePlugin(plugin.id);
        }
      }
    });
  
  // odavl plugin info <plugin-id>
  plugin
    .command('info <plugin-id>')
    .description('Show detailed plugin information')
    .action(showPluginInfo);
  
  // odavl plugin publish [package-json-path]
  plugin
    .command('publish [package-json-path]')
    .description('Publish a plugin to marketplace')
    .action((packageJsonPath = './package.json') => publishPlugin(packageJsonPath));
  
  // odavl plugin featured
  plugin
    .command('featured')
    .description('Show featured plugins')
    .action(showFeaturedPlugins);
}

export default registerPluginCommands;
