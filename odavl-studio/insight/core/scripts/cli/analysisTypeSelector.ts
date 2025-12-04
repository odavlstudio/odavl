import { c } from '../interactive-cli.js';
import * as readline from 'node:readline/promises';

export const enum AnalysisType {
  Back = 0,
  Quick = 1,
  Full = 2,
  Smart = 3,
}

/**
 * Display analysis type menu and get user choice
 */
export async function selectAnalysisType(
  rl: readline.Interface
): Promise<AnalysisType> {
  console.log(c('cyan', '─'.repeat(60)));
  console.log(c('cyan', '  1. ⚡ Quick Scan (Problems Panel)'));
  console.log(c('gray', '     → Read from VS Code Problems Panel'));
  console.log(c('gray', '     → TypeScript + ESLint issues only'));
  console.log(c('gray', '     → Duration: ~2 seconds\n'));

  console.log(c('cyan', '  2. 🔍 Full Scan (All 16 Detectors)'));
  console.log(c('gray', '     → Complete analysis with ML enhancement'));
  console.log(c('gray', '     → Security, Performance, Complexity, etc.'));
  console.log(c('gray', '     → Duration: ~35 seconds\n'));

  console.log(c('cyan', '  3. 🎯 Smart Scan (ML-Recommended)'));
  console.log(c('gray', '     → Runs detectors based on file types'));
  console.log(c('gray', '     → Skips Python detectors if no .py files'));
  console.log(c('gray', '     → Duration: ~20 seconds\n'));

  console.log(c('cyan', '  0. Back'));
  console.log(c('cyan', '  q. Quit'));

  const answer = await rl.question(c('yellow', '\n> Enter your choice: '));

  if (answer.toLowerCase() === 'q') {
    console.log(c('green', '\n👋 Goodbye!\n'));
    rl.close();
    process.exit(0);
  }

  return parseInt(answer) as AnalysisType;
}
