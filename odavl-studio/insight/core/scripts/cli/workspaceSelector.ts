import { c, type WorkspaceInfo } from '../interactive-cli.js';
import * as readline from 'node:readline/promises';

/**
 * Display workspace selection menu and get user choice
 */
export async function selectWorkspace(
  workspaces: WorkspaceInfo[],
  rl: readline.Interface
): Promise<number> {
  console.log(c('cyan', '─'.repeat(60)));
  workspaces.forEach((ws, i) => {
    console.log(c('cyan', `  ${i + 1}. ${ws.icon} ${c('white', ws.path)}`));
    console.log(c('gray', `     → ${ws.description}`));
    if (i < workspaces.length - 1) console.log('');
  });
  console.log('');
  console.log(c('cyan', `  0. Analyze all workspaces`));
  console.log(c('cyan', `  q. Quit`));

  const answer = await rl.question(c('yellow', '\n> Enter your choice: '));

  if (answer.toLowerCase() === 'q') {
    console.log(c('green', '\n👋 Goodbye!\n'));
    rl.close();
    process.exit(0);
  }

  return parseInt(answer);
}
