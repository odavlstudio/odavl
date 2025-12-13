/**
 * Simple logger utility
 */

import chalk from 'chalk';

export class Logger {
  constructor(private context: string) {}

  info(message: string, ...args: unknown[]): void {
    console.log(chalk.blue(`[${this.context}]`), message, ...args);
  }

  success(message: string, ...args: unknown[]): void {
    console.log(chalk.green(message), ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.log(chalk.yellow(message), ...args);
  }

  error(message: string, error?: unknown): void {
    console.error(chalk.red(message));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
    } else if (error) {
      console.error(chalk.red(String(error)));
    }
  }
}
