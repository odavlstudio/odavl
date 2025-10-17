// Analyzer for workspace, policy.yml, gates.yml
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function analyzeWorkspace(workspacePath: string): Promise<{ policies: any; gates: any }> {
  const policyPath = path.join(workspacePath, '.odavl', 'policy.yml');
  const gatesPath = path.join(workspacePath, '.odavl', 'gates.yml');
  let policies = {};
  let gates = {};
  try {
    const policyContent = await fs.readFile(policyPath, 'utf8');
    policies = policyContent;
  } catch { }
  try {
    const gatesContent = await fs.readFile(gatesPath, 'utf8');
    gates = gatesContent;
  } catch { }
  return { policies, gates };
}
