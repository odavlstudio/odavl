import { exec } from 'child_process';

export function runCLI(command: string, cwd: string) {
  return new Promise<string>((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) return reject(stderr || error.message);
      resolve(stdout);
    });
  });
}
