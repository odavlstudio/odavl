/**
 * Enhanced CLI Help Messages
 * Beautiful, informative help screens
 */

export interface CommandInfo {
  name: string;
  description: string;
  usage?: string;
  examples?: Array<{ command: string; description: string }>;
  options?: Array<{ flag: string; description: string; default?: string }>;
  aliases?: string[];
  category?: string;
}

export class CLIHelp {
  private readonly productName: string;
  private readonly version: string;
  private readonly description: string;
  private readonly commands: Map<string, CommandInfo> = new Map();

  constructor(productName: string, version: string, description: string) {
    this.productName = productName;
    this.version = version;
    this.description = description;
  }

  /**
   * Add command
   */
  addCommand(info: CommandInfo): void {
    this.commands.set(info.name, info);
  }

  /**
   * Display main help screen
   */
  displayMain(): void {
    const colors = {
      cyan: '\x1b[36m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
      reset: '\x1b[0m',
    };

    console.log('');
    console.log(`${colors.bold}${colors.cyan}╔═══════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║                                           ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║     ${this.productName.padEnd(33)}║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}║                                           ║${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}╚═══════════════════════════════════════════╝${colors.reset}`);
    console.log('');
    console.log(`${colors.dim}Version: ${this.version}${colors.reset}`);
    console.log(`${colors.dim}${this.description}${colors.reset}`);
    console.log('');

    // Group commands by category
    const categories = new Map<string, CommandInfo[]>();
    
    for (const [name, info] of this.commands) {
      const category = info.category || 'General';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(info);
    }

    console.log(`${colors.bold}${colors.yellow}COMMANDS${colors.reset}`);
    console.log('');

    for (const [category, cmds] of categories) {
      if (categories.size > 1) {
        console.log(`  ${colors.bold}${colors.blue}${category}${colors.reset}`);
        console.log('');
      }

      for (const cmd of cmds) {
        const name = cmd.name.padEnd(18);
        console.log(`  ${colors.green}${name}${colors.reset}${colors.dim}${cmd.description}${colors.reset}`);
        
        if (cmd.aliases && cmd.aliases.length > 0) {
          console.log(`  ${' '.repeat(18)}${colors.dim}Aliases: ${cmd.aliases.join(', ')}${colors.reset}`);
        }
      }
      
      console.log('');
    }

    console.log(`${colors.bold}${colors.yellow}OPTIONS${colors.reset}`);
    console.log('');
    console.log(`  ${colors.green}--help${colors.reset}             Show this help message`);
    console.log(`  ${colors.green}--version${colors.reset}          Show version number`);
    console.log(`  ${colors.green}--json${colors.reset}             Output in JSON format`);
    console.log(`  ${colors.green}--verbose${colors.reset}          Verbose output`);
    console.log('');

    console.log(`${colors.bold}${colors.yellow}EXAMPLES${colors.reset}`);
    console.log('');
    console.log(`  ${colors.dim}# Show help for a specific command${colors.reset}`);
    console.log(`  ${colors.cyan}pnpm ${this.getCliName()} <command> --help${colors.reset}`);
    console.log('');
    console.log(`  ${colors.dim}# Quick start${colors.reset}`);
    console.log(`  ${colors.cyan}pnpm ${this.getCliName()} --help${colors.reset}`);
    console.log('');

    console.log(`${colors.dim}For more information, visit: https://odavl.studio/docs${colors.reset}`);
    console.log('');
  }

  /**
   * Display command-specific help
   */
  displayCommand(commandName: string): void {
    const command = this.commands.get(commandName);
    
    if (!command) {
      console.error(`\n❌ Unknown command: ${commandName}\n`);
      console.log(`Run "${this.getCliName()} --help" to see available commands.\n`);
      return;
    }

    const colors = {
      cyan: '\x1b[36m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
      reset: '\x1b[0m',
    };

    console.log('');
    console.log(`${colors.bold}${colors.cyan}${this.productName} - ${command.name}${colors.reset}`);
    console.log(`${colors.dim}${command.description}${colors.reset}`);
    console.log('');

    if (command.usage) {
      console.log(`${colors.bold}${colors.yellow}USAGE${colors.reset}`);
      console.log(`  ${colors.cyan}${command.usage}${colors.reset}`);
      console.log('');
    }

    if (command.options && command.options.length > 0) {
      console.log(`${colors.bold}${colors.yellow}OPTIONS${colors.reset}`);
      console.log('');

      for (const option of command.options) {
        const flag = option.flag.padEnd(20);
        console.log(`  ${colors.green}${flag}${colors.reset}${option.description}`);
        
        if (option.default) {
          console.log(`  ${' '.repeat(20)}${colors.dim}Default: ${option.default}${colors.reset}`);
        }
      }
      
      console.log('');
    }

    if (command.examples && command.examples.length > 0) {
      console.log(`${colors.bold}${colors.yellow}EXAMPLES${colors.reset}`);
      console.log('');

      for (const example of command.examples) {
        console.log(`  ${colors.dim}# ${example.description}${colors.reset}`);
        console.log(`  ${colors.cyan}${example.command}${colors.reset}`);
        console.log('');
      }
    }

    if (command.aliases && command.aliases.length > 0) {
      console.log(`${colors.bold}${colors.yellow}ALIASES${colors.reset}`);
      console.log(`  ${colors.dim}${command.aliases.join(', ')}${colors.reset}`);
      console.log('');
    }

    console.log(`${colors.dim}For more information: https://odavl.studio/docs/${commandName}${colors.reset}`);
    console.log('');
  }

  /**
   * Get CLI name from product name
   */
  private getCliName(): string {
    const map: Record<string, string> = {
      'ODAVL Insight': 'odavl:insight',
      'ODAVL Autopilot': 'odavl:autopilot',
      'ODAVL Guardian': 'odavl:guardian',
    };
    return map[this.productName] || 'odavl';
  }
}

/**
 * Pre-configured help screens for each product
 */
export const ODAVLHelp = {
  /**
   * Insight Help
   */
  Insight: (): CLIHelp => {
    const help = new CLIHelp('ODAVL Insight', '2.0.0', 'ML-Powered Error Detection');

    help.addCommand({
      name: 'analyze',
      description: 'Analyze codebase with specific detector',
      usage: 'pnpm odavl:insight analyze [detector]',
      category: 'Analysis',
      options: [
        { flag: '--detector <name>', description: 'Detector to use (typescript, eslint, security, etc.)' },
        { flag: '--json', description: 'Output in JSON format' },
        { flag: '--fix', description: 'Auto-fix issues (when available)' },
      ],
      examples: [
        {
          command: 'pnpm odavl:insight analyze typescript',
          description: 'Analyze TypeScript errors',
        },
        {
          command: 'pnpm odavl:insight analyze security --fix',
          description: 'Find and fix security vulnerabilities',
        },
      ],
    });

    help.addCommand({
      name: 'interactive',
      description: 'Interactive menu with 12 detectors',
      usage: 'pnpm odavl:insight',
      category: 'Analysis',
      examples: [
        {
          command: 'pnpm odavl:insight',
          description: 'Launch interactive detector menu',
        },
      ],
    });

    return help;
  },

  /**
   * Autopilot Help
   */
  Autopilot: (): CLIHelp => {
    const help = new CLIHelp('ODAVL Autopilot', '2.0.0', 'Self-Healing Code Infrastructure');

    help.addCommand({
      name: 'run',
      description: 'Execute full O-D-A-V-L cycle (recommended)',
      usage: 'pnpm odavl:autopilot run [options]',
      category: 'Core',
      options: [
        { flag: '--dry-run', description: 'Preview changes without applying' },
        { flag: '--max-files <n>', description: 'Max files to modify', default: '10' },
        { flag: '--json', description: 'Output in JSON format' },
      ],
      examples: [
        {
          command: 'pnpm odavl:autopilot run',
          description: 'Run full self-healing cycle',
        },
        {
          command: 'pnpm odavl:autopilot run --dry-run',
          description: 'Preview changes without applying',
        },
      ],
    });

    help.addCommand({
      name: 'observe',
      description: 'Collect code quality metrics',
      usage: 'pnpm odavl:autopilot observe',
      category: 'Phases',
      examples: [
        {
          command: 'pnpm odavl:autopilot observe --json',
          description: 'Get metrics in JSON format',
        },
      ],
    });

    help.addCommand({
      name: 'undo',
      description: 'Roll back last automated change',
      usage: 'pnpm odavl:autopilot undo',
      category: 'Safety',
      examples: [
        {
          command: 'pnpm odavl:autopilot undo',
          description: 'Undo last change using smart rollback',
        },
      ],
    });

    return help;
  },

  /**
   * Guardian Help
   */
  Guardian: (): CLIHelp => {
    const help = new CLIHelp('ODAVL Guardian', '2.0.0', 'Pre-Deploy Testing & Monitoring');

    help.addCommand({
      name: 'test',
      description: 'Run full test suite (accessibility + performance + security)',
      usage: 'pnpm odavl:guardian test <url> [options]',
      category: 'Testing',
      options: [
        { flag: '--lang <code>', description: 'Language for testing (en, ar, de)', default: 'en' },
        { flag: '--format <type>', description: 'Output format (cli, json, html)', default: 'cli' },
        { flag: '--output <file>', description: 'Save report to file' },
      ],
      examples: [
        {
          command: 'pnpm odavl:guardian test https://example.com',
          description: 'Run full test suite',
        },
        {
          command: 'pnpm odavl:guardian test https://example.com --lang ar',
          description: 'Test with Arabic language (RTL)',
        },
      ],
    });

    help.addCommand({
      name: 'accessibility',
      description: 'Test WCAG 2.1 Level AA compliance',
      usage: 'pnpm odavl:guardian accessibility <url>',
      category: 'Testing',
      examples: [
        {
          command: 'pnpm odavl:guardian accessibility https://example.com',
          description: 'Check accessibility compliance',
        },
      ],
    });

    help.addCommand({
      name: 'performance',
      description: 'Test Core Web Vitals and performance budgets',
      usage: 'pnpm odavl:guardian performance <url> [options]',
      category: 'Testing',
      options: [
        { flag: '--budget <preset>', description: 'Budget preset (desktop, mobile, mobile-slow-3g, etc.)', default: 'mobile' },
      ],
      examples: [
        {
          command: 'pnpm odavl:guardian performance https://example.com --budget mobile-slow-3g',
          description: 'Test with slow 3G mobile budget',
        },
      ],
    });

    return help;
  },
};

/**
 * Example usage:
 * 
 * // Display main help
 * const help = ODAVLHelp.Autopilot();
 * help.displayMain();
 * 
 * // Display command help
 * help.displayCommand('run');
 */
