#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('test-cli')
  .description('Test CLI tool for Guardian validation')
  .version('1.0.0');

program
  .command('hello')
  .description('Say hello')
  .action(() => {
    console.log(chalk.green('Hello from Test CLI!'));
  });

program.parse();
