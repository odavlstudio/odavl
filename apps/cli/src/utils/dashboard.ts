/**
 * Dashboard and reporting utilities for ODAVL CLI
 * @fileoverview Dashboard functionality for ODAVL learning visualization
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { logPhase } from "./core-utils.js";

/**
 * Trust tracking record for recipe performance
 */
interface TrustRecord {
  id: string;
  runs: number;
  success: number;
  trust: number;
}

/**
 * Display learning analytics in CLI format as fallback when web dashboard isn't available.
 * Shows performance metrics, recent activity, and recipe trust scores in ASCII format.
 */
export function showCliDashboard() {
  const ROOT = process.cwd();
  const odavlDir = path.join(ROOT, ".odavl");
  const historyPath = path.join(odavlDir, "history.json");
  const trustPath = path.join(odavlDir, "recipes-trust.json");
  
  console.log("\n" + "=".repeat(60));
  console.log("🤖 ODAVL LEARNING DASHBOARD");
  console.log("=".repeat(60));
  
  // Show history summary
  if (fs.existsSync(historyPath)) {
    const history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    const successful = history.filter((h: { success?: boolean }) => h.success === true).length;
    const successRate = history.length > 0 ? (successful / history.length * 100).toFixed(1) : '0';
    
    console.log(`\n📊 PERFORMANCE METRICS`);
    console.log(`   Success Rate: ${successRate}% (${successful}/${history.length} runs)`);
    
    const recent = history.slice(-3);
    console.log(`\n🕐 RECENT ACTIVITY`);
    recent.forEach((run: { success?: boolean; ts: string; decision: string }) => {
      const status = run.success ? "✅" : "❌";
      const date = new Date(run.ts).toLocaleDateString();
      console.log(`   ${status} ${run.decision} (${date})`);
    });
  }
  
  // Show trust scores
  if (fs.existsSync(trustPath)) {
    const trust = JSON.parse(fs.readFileSync(trustPath, "utf-8"));
    console.log(`\n🧠 RECIPE TRUST SCORES`);
    trust.forEach((recipe: TrustRecord) => {
      const trustPercent = (recipe.trust * 100).toFixed(1);
      const bar = "█".repeat(Math.floor(recipe.trust * 10)) + "░".repeat(10 - Math.floor(recipe.trust * 10));
      console.log(`   ${recipe.id}: ${trustPercent}% [${bar}] (${recipe.success}/${recipe.runs})`);
    });
  }
  
  console.log(`\n💡 TIP: Run 'pnpm dev' in odavl-website/ for full dashboard`);
  console.log("=".repeat(60) + "\n");
}

/**
 * Launch the ODAVL Learning Visualization Dashboard in the browser.
 * Opens a local development server showing real-time learning analytics.
 * Falls back to CLI dashboard if web interface is unavailable.
 */
export function launchDashboard() {
  const ROOT = process.cwd();
  
  logPhase("DASHBOARD", "Starting ODAVL Learning Visualization Dashboard...", "info");
  
  try {
    const websitePath = path.join(ROOT, "odavl-website");
    
    // Check if we're in development mode with pnpm available
    if (fs.existsSync(websitePath) && fs.existsSync(path.join(websitePath, "package.json"))) {
      logPhase("DASHBOARD", "Launching local development server...", "info");
      
      // Start the Next.js development server
      const devCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
      const devProcess = spawnSync(devCommand, ['dev'], {
        cwd: websitePath,
        stdio: 'inherit',
        env: { ...process.env, PORT: '3001' }
      });
      
      if (devProcess.error) {
        throw new Error(`Failed to start development server: ${devProcess.error.message}`);
      }
      
      // Wait a moment for server startup, then open browser
      setTimeout(() => {
        const dashboardUrl = 'http://localhost:3001/dashboard';
        logPhase("DASHBOARD", `Opening dashboard at ${dashboardUrl}`, "success");
        
        // Open browser (cross-platform)
        let openCommand = 'xdg-open'; // Linux default
        if (process.platform === 'darwin') openCommand = 'open';
        if (process.platform === 'win32') openCommand = 'start';
        execSync(`${openCommand} ${dashboardUrl}`, { stdio: 'ignore' });
      }, 3000);
      
    } else {
      // Fallback: show dashboard data in CLI format
      logPhase("DASHBOARD", "Website not available, showing CLI dashboard", "info");
      showCliDashboard();
    }
  } catch (error) {
    logPhase("DASHBOARD", `Error launching dashboard: ${error}`, "error");
    logPhase("DASHBOARD", "Falling back to CLI dashboard", "info");
    showCliDashboard();
  }
}