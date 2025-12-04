// CLI Plugin Manager
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

export class PluginManager {
  private configPath = '.odavl/plugins.json';
  
  async install(pluginId: string) {
    console.log(`📦 Installing plugin: ${pluginId}`);
    
    // Fetch plugin metadata
    const plugin = await this.fetchPlugin(pluginId);
    
    // Download and verify
    const packagePath = await this.download(plugin.packageUrl);
    await this.verify(packagePath, plugin.checksums);
    
    // Install dependencies
    execSync(`pnpm add ${packagePath}`, { stdio: 'inherit' });
    
    // Update config
    this.addToConfig(plugin);
    
    console.log(`✅ Plugin installed: ${plugin.name}`);
  }
  
  async uninstall(pluginId: string) {
    console.log(`🗑️  Uninstalling plugin: ${pluginId}`);
    
    const config = this.loadConfig();
    const plugin = config.plugins.find(p => p.id === pluginId);
    
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }
    
    // Remove package
    execSync(`pnpm remove ${plugin.packageName}`, { stdio: 'inherit' });
    
    // Update config
    this.removeFromConfig(pluginId);
    
    console.log(`✅ Plugin uninstalled: ${plugin.name}`);
  }
  
  list() {
    const config = this.loadConfig();
    
    console.log('\n📋 Installed Plugins:\n');
    config.plugins.forEach(p => {
      console.log(`  • ${p.name} v${p.version} (${p.category})`);
    });
    console.log(`\nTotal: ${config.plugins.length} plugins\n`);
  }
  
  async search(query: string) {
    const results = await fetch(
      `https://marketplace.odavl.com/api/plugins?search=${query}`
    ).then(r => r.json());
    
    console.log(`\n🔍 Search results for "${query}":\n`);
    results.plugins.forEach(p => {
      console.log(`  • ${p.name} - ${p.description}`);
      console.log(`    ⭐ ${p.rating}/5 | 📦 ${p.downloads} downloads\n`);
    });
  }
  
  private loadConfig() {
    try {
      return JSON.parse(readFileSync(this.configPath, 'utf-8'));
    } catch {
      return { plugins: [] };
    }
  }
  
  private addToConfig(plugin: Plugin) {
    const config = this.loadConfig();
    config.plugins.push(plugin);
    writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }
}
