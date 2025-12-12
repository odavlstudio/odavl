import {
  ManifestValidationError,
  clearManifestCache,
  getManifestPath,
  getSchemaPath,
  getWorkspaceRoot,
  loadManifest,
  loadManifestSync,
  manifest
} from "./chunk-ARIV4AEN.js";

// src/enhanced-errors.ts
var EnhancedError = class extends Error {
  context;
  constructor(context) {
    super(context.message);
    this.name = "EnhancedError";
    this.context = context;
  }
  /**
   * Format error with colors and helpful information
   */
  format() {
    const { code, message, severity, location, suggestion, learnMore, quickFix } = this.context;
    const colors = {
      critical: "\x1B[41m\x1B[37m",
      // Red background, white text
      high: "\x1B[31m",
      // Red
      medium: "\x1B[33m",
      // Yellow
      low: "\x1B[36m",
      // Cyan
      reset: "\x1B[0m",
      bold: "\x1B[1m",
      dim: "\x1B[2m"
    };
    const severityColor = colors[severity];
    const severityLabel = severity.toUpperCase().padEnd(8);
    let output = "";
    output += `
${severityColor}${colors.bold} ${severityLabel} ${colors.reset} ${colors.bold}${code}${colors.reset}
`;
    output += `${colors.dim}\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501${colors.reset}

`;
    output += `${message}
`;
    if (location) {
      output += `
${colors.dim}Location:${colors.reset} ${location.file}`;
      if (location.line) {
        output += `:${location.line}`;
        if (location.column) {
          output += `:${location.column}`;
        }
      }
      output += "\n";
    }
    if (suggestion) {
      output += `
${colors.bold}\u{1F4A1} Suggested Fix:${colors.reset}
`;
      output += `   ${suggestion}
`;
    }
    if (quickFix) {
      output += `
${colors.bold}\u26A1 Quick Fix:${colors.reset}
`;
      output += `   ${colors.dim}$${colors.reset} ${quickFix}
`;
    }
    if (learnMore) {
      output += `
${colors.dim}\u{1F4DA} Learn more: ${learnMore}${colors.reset}
`;
    }
    return output;
  }
};
var ErrorMessages = {
  // Autopilot Errors
  AUTOPILOT_NO_RECIPES: (recipesDir) => ({
    code: "AUTOPILOT_001",
    message: `No recipes found in ${recipesDir}`,
    severity: "high",
    suggestion: "Create your first recipe or check if the recipes directory exists",
    quickFix: "pnpm odavl:autopilot init --create-sample-recipes",
    learnMore: "docs/autopilot/recipes.md"
  }),
  AUTOPILOT_RISK_BUDGET_EXCEEDED: (filesModified, maxFiles) => ({
    code: "AUTOPILOT_002",
    message: `Risk budget exceeded: attempting to modify ${filesModified} files (max: ${maxFiles})`,
    severity: "critical",
    suggestion: `Increase max_files_per_cycle in .odavl/gates.yml or split into smaller changes`,
    quickFix: "pnpm odavl:autopilot run --max-files 20",
    learnMore: "docs/autopilot/safety.md#risk-budget"
  }),
  AUTOPILOT_PROTECTED_PATH: (path) => ({
    code: "AUTOPILOT_003",
    message: `Cannot modify protected path: ${path}`,
    severity: "critical",
    suggestion: "Remove this path from forbidden_paths in .odavl/gates.yml if intentional",
    learnMore: "docs/autopilot/safety.md#protected-paths"
  }),
  AUTOPILOT_VERIFICATION_FAILED: (beforeIssues, afterIssues) => ({
    code: "AUTOPILOT_004",
    message: `Verification failed: quality did not improve (${beforeIssues} \u2192 ${afterIssues} issues)`,
    severity: "high",
    suggestion: "Changes will be rolled back automatically. Check .odavl/ledger/ for details",
    quickFix: "pnpm odavl:autopilot undo",
    learnMore: "docs/autopilot/verification.md"
  }),
  AUTOPILOT_ML_MODEL_NOT_FOUND: () => ({
    code: "AUTOPILOT_005",
    message: "ML trust predictor model not found. Falling back to heuristic scoring.",
    severity: "medium",
    suggestion: "Train the ML model for better recipe selection accuracy",
    quickFix: "pnpm ml:train",
    learnMore: "docs/autopilot/ml-trust-prediction.md"
  }),
  // Insight Errors
  INSIGHT_DETECTOR_FAILED: (detector, error) => ({
    code: "INSIGHT_001",
    message: `Detector "${detector}" failed: ${error}`,
    severity: "high",
    suggestion: "Check if required dependencies are installed (ESLint, TypeScript, etc.)",
    quickFix: "pnpm install",
    learnMore: "docs/insight/detectors.md"
  }),
  INSIGHT_NO_ISSUES_FOUND: () => ({
    code: "INSIGHT_002",
    message: "No issues detected in the codebase",
    severity: "low",
    suggestion: "\u2728 Your code quality is excellent! Consider running specific detectors for deeper analysis.",
    learnMore: "docs/insight/detectors.md"
  }),
  INSIGHT_CRITICAL_VULNERABILITY: (vulnerability, location) => ({
    code: "INSIGHT_003",
    message: `Critical security vulnerability detected: ${vulnerability}`,
    severity: "critical",
    location: { file: location },
    suggestion: "Address this vulnerability immediately before deployment",
    quickFix: "pnpm odavl:insight security --fix",
    learnMore: "docs/insight/security.md"
  }),
  // Guardian Errors
  GUARDIAN_SITE_UNREACHABLE: (url) => ({
    code: "GUARDIAN_001",
    message: `Cannot reach site: ${url}`,
    severity: "critical",
    suggestion: "Check if the URL is correct and the site is running",
    quickFix: "curl -I " + url,
    learnMore: "docs/guardian/troubleshooting.md"
  }),
  GUARDIAN_WCAG_VIOLATION: (violation, level) => ({
    code: "GUARDIAN_002",
    message: `WCAG ${level} violation: ${violation}`,
    severity: "high",
    suggestion: "Fix accessibility issues to ensure compliance with WCAG 2.1 standards",
    learnMore: "https://www.w3.org/WAI/WCAG21/quickref/"
  }),
  GUARDIAN_PERFORMANCE_BUDGET_EXCEEDED: (metric, actual, budget) => ({
    code: "GUARDIAN_003",
    message: `Performance budget exceeded: ${metric} is ${actual}ms (budget: ${budget}ms)`,
    severity: "high",
    suggestion: "Optimize resources, enable compression, or use a CDN",
    learnMore: "docs/guardian/performance.md"
  }),
  GUARDIAN_CSP_MISSING: () => ({
    code: "GUARDIAN_004",
    message: "Content Security Policy (CSP) header is missing",
    severity: "medium",
    suggestion: "Add CSP header to prevent XSS and other injection attacks",
    quickFix: `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'`,
    learnMore: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
  }),
  // General Errors
  CONFIGURATION_NOT_FOUND: (configPath) => ({
    code: "CONFIG_001",
    message: `Configuration file not found: ${configPath}`,
    severity: "medium",
    suggestion: "Create a configuration file or run the setup wizard",
    quickFix: "pnpm setup",
    learnMore: "docs/configuration.md"
  }),
  DEPENDENCIES_NOT_INSTALLED: () => ({
    code: "DEPS_001",
    message: "Dependencies are not installed",
    severity: "critical",
    suggestion: "Install dependencies before running ODAVL commands",
    quickFix: "pnpm install"
  }),
  BUILD_REQUIRED: (package_) => ({
    code: "BUILD_001",
    message: `Package "${package_}" is not built`,
    severity: "high",
    suggestion: "Build the platform before running commands",
    quickFix: "pnpm build"
  }),
  PERMISSION_DENIED: (path) => ({
    code: "PERM_001",
    message: `Permission denied: ${path}`,
    severity: "critical",
    suggestion: "Check file/directory permissions or run with appropriate privileges"
  }),
  NETWORK_ERROR: (url, error) => ({
    code: "NET_001",
    message: `Network error while accessing ${url}: ${error}`,
    severity: "high",
    suggestion: "Check your internet connection and try again"
  })
};
function displayError(context) {
  const error = new EnhancedError(context);
  console.error(error.format());
}
function displaySuccess(message, details) {
  const colors = {
    green: "\x1B[32m",
    bold: "\x1B[1m",
    dim: "\x1B[2m",
    reset: "\x1B[0m"
  };
  console.log("");
  console.log(`${colors.green}${colors.bold}\u2705 SUCCESS${colors.reset} ${message}`);
  if (details) {
    console.log(`${colors.dim}   ${details}${colors.reset}`);
  }
  console.log("");
}
function displayWarning(message, suggestion) {
  const colors = {
    yellow: "\x1B[33m",
    bold: "\x1B[1m",
    dim: "\x1B[2m",
    reset: "\x1B[0m"
  };
  console.log("");
  console.log(`${colors.yellow}${colors.bold}\u26A0\uFE0F  WARNING${colors.reset} ${message}`);
  if (suggestion) {
    console.log(`${colors.dim}   \u{1F4A1} ${suggestion}${colors.reset}`);
  }
  console.log("");
}
function displayInfo(message, details) {
  const colors = {
    cyan: "\x1B[36m",
    bold: "\x1B[1m",
    dim: "\x1B[2m",
    reset: "\x1B[0m"
  };
  console.log("");
  console.log(`${colors.cyan}${colors.bold}\u2139\uFE0F  INFO${colors.reset} ${message}`);
  if (details) {
    console.log(`${colors.dim}   ${details}${colors.reset}`);
  }
  console.log("");
}

// src/progress.ts
var Progress = class {
  current = 0;
  total;
  width;
  completeChar;
  incompleteChar;
  renderThrottle;
  lastRender = 0;
  callback;
  constructor(options) {
    this.total = options.total;
    this.width = options.width || 40;
    this.completeChar = options.complete || "\u2588";
    this.incompleteChar = options.incomplete || "\u2591";
    this.renderThrottle = options.renderThrottle || 16;
    this.callback = options.callback;
  }
  /**
   * Update progress
   */
  tick(amount = 1) {
    this.current = Math.min(this.current + amount, this.total);
    const now = Date.now();
    if (now - this.lastRender >= this.renderThrottle || this.isComplete()) {
      this.render();
      this.lastRender = now;
      if (this.callback) {
        this.callback(this);
      }
    }
  }
  /**
   * Set absolute progress
   */
  update(current) {
    const diff = current - this.current;
    if (diff > 0) {
      this.tick(diff);
    }
  }
  /**
   * Check if progress is complete
   */
  isComplete() {
    return this.current >= this.total;
  }
  /**
   * Get percentage (0-100)
   */
  getPercentage() {
    return Math.round(this.current / this.total * 100);
  }
  /**
   * Render progress bar
   */
  render() {
    const percentage = this.getPercentage();
    const filled = Math.round(this.width * this.current / this.total);
    const empty = this.width - filled;
    const bar = this.completeChar.repeat(filled) + this.incompleteChar.repeat(empty);
    const colors = {
      cyan: "\x1B[36m",
      green: "\x1B[32m",
      yellow: "\x1B[33m",
      reset: "\x1B[0m",
      bold: "\x1B[1m"
    };
    let color = colors.cyan;
    if (percentage === 100) color = colors.green;
    else if (percentage >= 75) color = colors.cyan;
    else if (percentage >= 50) color = colors.yellow;
    process.stdout.write(
      `\r${color}${colors.bold}\u2595${bar}\u258F${colors.reset} ${percentage}% (${this.current}/${this.total})`
    );
    if (this.isComplete()) {
      process.stdout.write("\n");
    }
  }
  /**
   * Complete immediately
   */
  complete() {
    this.current = this.total;
    this.render();
  }
};
var Spinner = class {
  frames;
  interval;
  currentFrame = 0;
  timer;
  message;
  constructor(message = "Loading...", frames) {
    this.message = message;
    this.frames = frames || ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
    this.interval = 80;
  }
  /**
   * Start spinning
   */
  start() {
    this.currentFrame = 0;
    this.render();
    this.timer = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
      this.render();
    }, this.interval);
  }
  /**
   * Update message
   */
  update(message) {
    this.message = message;
    this.render();
  }
  /**
   * Stop with success
   */
  succeed(message) {
    this.stop("\x1B[32m\u2713\x1B[0m", message);
  }
  /**
   * Stop with failure
   */
  fail(message) {
    this.stop("\x1B[31m\u2717\x1B[0m", message);
  }
  /**
   * Stop with warning
   */
  warn(message) {
    this.stop("\x1B[33m\u26A0\x1B[0m", message);
  }
  /**
   * Stop with info
   */
  info(message) {
    this.stop("\x1B[36m\u2139\x1B[0m", message);
  }
  /**
   * Stop spinning
   */
  stop(symbol, message) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = void 0;
    }
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    console.log(`${symbol} ${message || this.message}`);
  }
  /**
   * Render current frame
   */
  render() {
    const frame = this.frames[this.currentFrame];
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`\x1B[36m${frame}\x1B[0m ${this.message}`);
  }
};
var MultiProgress = class {
  bars = /* @__PURE__ */ new Map();
  spinners = /* @__PURE__ */ new Map();
  /**
   * Add progress bar
   */
  addBar(id, options) {
    const bar = new Progress(options);
    this.bars.set(id, bar);
    return bar;
  }
  /**
   * Add spinner
   */
  addSpinner(id, message) {
    const spinner = new Spinner(message);
    this.spinners.set(id, spinner);
    return spinner;
  }
  /**
   * Get bar by ID
   */
  getBar(id) {
    return this.bars.get(id);
  }
  /**
   * Get spinner by ID
   */
  getSpinner(id) {
    return this.spinners.get(id);
  }
  /**
   * Complete all
   */
  completeAll() {
    for (const bar of this.bars.values()) {
      bar.complete();
    }
    for (const spinner of this.spinners.values()) {
      spinner.succeed();
    }
  }
};
var ProgressHelpers = {
  /**
   * Show progress for file operations
   */
  showFileProgress(files, operation) {
    return new Promise(async (resolve, reject) => {
      const bar = new Progress({
        total: files.length,
        width: 40,
        callback: (progress) => {
          if (progress.isComplete()) {
            resolve();
          }
        }
      });
      console.log(`
\u{1F4C1} Processing ${files.length} files:
`);
      for (const file of files) {
        try {
          await operation(file);
          bar.tick();
        } catch (error) {
          reject(error);
          break;
        }
      }
    });
  },
  /**
   * Show spinner for async operation
   */
  async withSpinner(message, operation) {
    const spinner = new Spinner(message);
    spinner.start();
    try {
      const result = await operation();
      spinner.succeed();
      return result;
    } catch (error) {
      spinner.fail(`${message} failed`);
      throw error;
    }
  },
  /**
   * Show progress for array of tasks
   */
  async showTaskProgress(tasks) {
    const bar = new Progress({
      total: tasks.length,
      width: 40
    });
    console.log(`
\u26A1 Running ${tasks.length} tasks:
`);
    const results = [];
    for (const task of tasks) {
      console.log(`
   ${task.name}...`);
      const result = await task.fn();
      results.push(result);
      bar.tick();
    }
    return results;
  },
  /**
   * Show estimated time remaining
   */
  showETAProgress(total, operation) {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      let current = 0;
      const bar = new Progress({
        total,
        width: 40,
        callback: (progress) => {
          const elapsed = Date.now() - startTime;
          const rate = current / (elapsed / 1e3);
          const remaining = (total - current) / rate;
          if (!isNaN(remaining) && isFinite(remaining)) {
            const eta = Math.round(remaining);
            process.stdout.write(` ETA: ${eta}s`);
          }
          if (progress.isComplete()) {
            const totalTime = Math.round((Date.now() - startTime) / 1e3);
            console.log(`
\u2705 Completed in ${totalTime}s
`);
            resolve();
          }
        }
      });
      console.log(`
\u23F1\uFE0F  Processing ${total} items:
`);
      for (let i = 0; i < total; i++) {
        try {
          await operation(i);
          current++;
          bar.tick();
        } catch (error) {
          reject(error);
          break;
        }
      }
    });
  }
};

// src/cli-help.ts
var CLIHelp = class {
  productName;
  version;
  description;
  commands = /* @__PURE__ */ new Map();
  constructor(productName, version, description) {
    this.productName = productName;
    this.version = version;
    this.description = description;
  }
  /**
   * Add command
   */
  addCommand(info) {
    this.commands.set(info.name, info);
  }
  /**
   * Display main help screen
   */
  displayMain() {
    const colors = {
      cyan: "\x1B[36m",
      green: "\x1B[32m",
      yellow: "\x1B[33m",
      blue: "\x1B[34m",
      magenta: "\x1B[35m",
      bold: "\x1B[1m",
      dim: "\x1B[2m",
      reset: "\x1B[0m"
    };
    console.log("");
    console.log(`${colors.bold}${colors.cyan}\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}\u2551                                           \u2551${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}\u2551     ${this.productName.padEnd(33)}\u2551${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}\u2551                                           \u2551${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D${colors.reset}`);
    console.log("");
    console.log(`${colors.dim}Version: ${this.version}${colors.reset}`);
    console.log(`${colors.dim}${this.description}${colors.reset}`);
    console.log("");
    const categories = /* @__PURE__ */ new Map();
    for (const [name, info] of this.commands) {
      const category = info.category || "General";
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(info);
    }
    console.log(`${colors.bold}${colors.yellow}COMMANDS${colors.reset}`);
    console.log("");
    for (const [category, cmds] of categories) {
      if (categories.size > 1) {
        console.log(`  ${colors.bold}${colors.blue}${category}${colors.reset}`);
        console.log("");
      }
      for (const cmd of cmds) {
        const name = cmd.name.padEnd(18);
        console.log(`  ${colors.green}${name}${colors.reset}${colors.dim}${cmd.description}${colors.reset}`);
        if (cmd.aliases && cmd.aliases.length > 0) {
          console.log(`  ${" ".repeat(18)}${colors.dim}Aliases: ${cmd.aliases.join(", ")}${colors.reset}`);
        }
      }
      console.log("");
    }
    console.log(`${colors.bold}${colors.yellow}OPTIONS${colors.reset}`);
    console.log("");
    console.log(`  ${colors.green}--help${colors.reset}             Show this help message`);
    console.log(`  ${colors.green}--version${colors.reset}          Show version number`);
    console.log(`  ${colors.green}--json${colors.reset}             Output in JSON format`);
    console.log(`  ${colors.green}--verbose${colors.reset}          Verbose output`);
    console.log("");
    console.log(`${colors.bold}${colors.yellow}EXAMPLES${colors.reset}`);
    console.log("");
    console.log(`  ${colors.dim}# Show help for a specific command${colors.reset}`);
    console.log(`  ${colors.cyan}pnpm ${this.getCliName()} <command> --help${colors.reset}`);
    console.log("");
    console.log(`  ${colors.dim}# Quick start${colors.reset}`);
    console.log(`  ${colors.cyan}pnpm ${this.getCliName()} --help${colors.reset}`);
    console.log("");
    console.log(`${colors.dim}For more information, visit: https://odavl.studio/docs${colors.reset}`);
    console.log("");
  }
  /**
   * Display command-specific help
   */
  displayCommand(commandName) {
    const command = this.commands.get(commandName);
    if (!command) {
      console.error(`
\u274C Unknown command: ${commandName}
`);
      console.log(`Run "${this.getCliName()} --help" to see available commands.
`);
      return;
    }
    const colors = {
      cyan: "\x1B[36m",
      green: "\x1B[32m",
      yellow: "\x1B[33m",
      bold: "\x1B[1m",
      dim: "\x1B[2m",
      reset: "\x1B[0m"
    };
    console.log("");
    console.log(`${colors.bold}${colors.cyan}${this.productName} - ${command.name}${colors.reset}`);
    console.log(`${colors.dim}${command.description}${colors.reset}`);
    console.log("");
    if (command.usage) {
      console.log(`${colors.bold}${colors.yellow}USAGE${colors.reset}`);
      console.log(`  ${colors.cyan}${command.usage}${colors.reset}`);
      console.log("");
    }
    if (command.options && command.options.length > 0) {
      console.log(`${colors.bold}${colors.yellow}OPTIONS${colors.reset}`);
      console.log("");
      for (const option of command.options) {
        const flag = option.flag.padEnd(20);
        console.log(`  ${colors.green}${flag}${colors.reset}${option.description}`);
        if (option.default) {
          console.log(`  ${" ".repeat(20)}${colors.dim}Default: ${option.default}${colors.reset}`);
        }
      }
      console.log("");
    }
    if (command.examples && command.examples.length > 0) {
      console.log(`${colors.bold}${colors.yellow}EXAMPLES${colors.reset}`);
      console.log("");
      for (const example of command.examples) {
        console.log(`  ${colors.dim}# ${example.description}${colors.reset}`);
        console.log(`  ${colors.cyan}${example.command}${colors.reset}`);
        console.log("");
      }
    }
    if (command.aliases && command.aliases.length > 0) {
      console.log(`${colors.bold}${colors.yellow}ALIASES${colors.reset}`);
      console.log(`  ${colors.dim}${command.aliases.join(", ")}${colors.reset}`);
      console.log("");
    }
    console.log(`${colors.dim}For more information: https://odavl.studio/docs/${commandName}${colors.reset}`);
    console.log("");
  }
  /**
   * Get CLI name from product name
   */
  getCliName() {
    const map = {
      "ODAVL Insight": "odavl:insight",
      "ODAVL Autopilot": "odavl:autopilot",
      "ODAVL Guardian": "odavl:guardian"
    };
    return map[this.productName] || "odavl";
  }
};
var ODAVLHelp = {
  /**
   * Insight Help
   */
  Insight: () => {
    const help = new CLIHelp("ODAVL Insight", "2.0.0", "ML-Powered Error Detection");
    help.addCommand({
      name: "analyze",
      description: "Analyze codebase with specific detector",
      usage: "pnpm odavl:insight analyze [detector]",
      category: "Analysis",
      options: [
        { flag: "--detector <name>", description: "Detector to use (typescript, eslint, security, etc.)" },
        { flag: "--json", description: "Output in JSON format" },
        { flag: "--fix", description: "Auto-fix issues (when available)" }
      ],
      examples: [
        {
          command: "pnpm odavl:insight analyze typescript",
          description: "Analyze TypeScript errors"
        },
        {
          command: "pnpm odavl:insight analyze security --fix",
          description: "Find and fix security vulnerabilities"
        }
      ]
    });
    help.addCommand({
      name: "interactive",
      description: "Interactive menu with 12 detectors",
      usage: "pnpm odavl:insight",
      category: "Analysis",
      examples: [
        {
          command: "pnpm odavl:insight",
          description: "Launch interactive detector menu"
        }
      ]
    });
    return help;
  },
  /**
   * Autopilot Help
   */
  Autopilot: () => {
    const help = new CLIHelp("ODAVL Autopilot", "2.0.0", "Self-Healing Code Infrastructure");
    help.addCommand({
      name: "run",
      description: "Execute full O-D-A-V-L cycle (recommended)",
      usage: "pnpm odavl:autopilot run [options]",
      category: "Core",
      options: [
        { flag: "--dry-run", description: "Preview changes without applying" },
        { flag: "--max-files <n>", description: "Max files to modify", default: "10" },
        { flag: "--json", description: "Output in JSON format" }
      ],
      examples: [
        {
          command: "pnpm odavl:autopilot run",
          description: "Run full self-healing cycle"
        },
        {
          command: "pnpm odavl:autopilot run --dry-run",
          description: "Preview changes without applying"
        }
      ]
    });
    help.addCommand({
      name: "observe",
      description: "Collect code quality metrics",
      usage: "pnpm odavl:autopilot observe",
      category: "Phases",
      examples: [
        {
          command: "pnpm odavl:autopilot observe --json",
          description: "Get metrics in JSON format"
        }
      ]
    });
    help.addCommand({
      name: "undo",
      description: "Roll back last automated change",
      usage: "pnpm odavl:autopilot undo",
      category: "Safety",
      examples: [
        {
          command: "pnpm odavl:autopilot undo",
          description: "Undo last change using smart rollback"
        }
      ]
    });
    return help;
  },
  /**
   * Guardian Help
   */
  Guardian: () => {
    const help = new CLIHelp("ODAVL Guardian", "2.0.0", "Pre-Deploy Testing & Monitoring");
    help.addCommand({
      name: "test",
      description: "Run full test suite (accessibility + performance + security)",
      usage: "pnpm odavl:guardian test <url> [options]",
      category: "Testing",
      options: [
        { flag: "--lang <code>", description: "Language for testing (en, ar, de)", default: "en" },
        { flag: "--format <type>", description: "Output format (cli, json, html)", default: "cli" },
        { flag: "--output <file>", description: "Save report to file" }
      ],
      examples: [
        {
          command: "pnpm odavl:guardian test https://example.com",
          description: "Run full test suite"
        },
        {
          command: "pnpm odavl:guardian test https://example.com --lang ar",
          description: "Test with Arabic language (RTL)"
        }
      ]
    });
    help.addCommand({
      name: "accessibility",
      description: "Test WCAG 2.1 Level AA compliance",
      usage: "pnpm odavl:guardian accessibility <url>",
      category: "Testing",
      examples: [
        {
          command: "pnpm odavl:guardian accessibility https://example.com",
          description: "Check accessibility compliance"
        }
      ]
    });
    help.addCommand({
      name: "performance",
      description: "Test Core Web Vitals and performance budgets",
      usage: "pnpm odavl:guardian performance <url> [options]",
      category: "Testing",
      options: [
        { flag: "--budget <preset>", description: "Budget preset (desktop, mobile, mobile-slow-3g, etc.)", default: "mobile" }
      ],
      examples: [
        {
          command: "pnpm odavl:guardian performance https://example.com --budget mobile-slow-3g",
          description: "Test with slow 3G mobile budget"
        }
      ]
    });
    return help;
  }
};

// src/feature-flags.ts
var FEATURES = {
  /** CVE Scanner - Not yet implemented (stub only) */
  CVE_SCANNER: false,
  /** Brain ML Coordination - All functions are stubs */
  BRAIN_ML_ENABLED: false,
  /** OMS Risk Scoring - Package missing */
  OMS_RISK_SCORING: false,
  /** Python Detection - Experimental (mypy/bandit/radon) */
  PYTHON_DETECTION: false,
  /** Next.js Detector - Not implemented */
  NEXTJS_DETECTOR: false
};

// src/index.ts
var ODAVL_VERSION = "1.0.0";
var ODAVL_API_URL = process.env.ODAVL_API_URL || "https://api.odavl.studio";
function formatDate(date) {
  return date.toISOString();
}
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
export {
  CLIHelp,
  EnhancedError,
  ErrorMessages,
  FEATURES,
  ManifestValidationError,
  MultiProgress,
  ODAVLHelp,
  ODAVL_API_URL,
  ODAVL_VERSION,
  Progress,
  ProgressHelpers,
  Spinner,
  clearManifestCache,
  displayError,
  displayInfo,
  displaySuccess,
  displayWarning,
  formatDate,
  generateId,
  getManifestPath,
  getSchemaPath,
  getWorkspaceRoot,
  loadManifest,
  loadManifestSync,
  manifest
};
