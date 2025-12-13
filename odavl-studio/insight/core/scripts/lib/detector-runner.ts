/**
 * Detector Runner - Execute all detectors in parallel
 */

import { TSDetector } from '../../src/detector/ts-detector.js';
import { ESLintDetector } from '../../src/detector/eslint-detector.js';
import { SecurityDetector } from '../../src/detector/security-detector.js';
import { PerformanceDetector } from '../../src/detector/performance-detector.js';
import { ComplexityDetector } from '../../src/detector/complexity-detector.js';
import { CircularDependencyDetector } from '../../src/detector/circular-detector.js';
import { ImportDetector } from '../../src/detector/import-detector.js';
import { PackageDetector } from '../../src/detector/package-detector.js';
import { RuntimeDetector } from '../../src/detector/runtime-detector.js';
import { BuildDetector } from '../../src/detector/build-detector.js';
import { NetworkDetector } from '../../src/detector/network-detector.js';
import { ComponentIsolationDetector } from '../../src/detector/isolation-detector.js';
import { PythonTypeDetector } from '../../src/detector/python-type-detector.js';
import { PythonSecurityDetector } from '../../src/detector/python-security-detector.js';
import { PythonComplexityDetector } from '../../src/detector/python-complexity-detector.js';
import { c } from './colors.js';

export interface DetectorResult {
  name: string;
  icon: string;
  count: number;
  issues: any[];
}

const DETECTORS = [
  { name: 'TypeScript', icon: '📘', DetectorClass: TSDetector },
  { name: 'ESLint', icon: '🔧', DetectorClass: ESLintDetector },
  { name: 'Security', icon: '🔒', DetectorClass: SecurityDetector },
  { name: 'Performance', icon: '⚡', DetectorClass: PerformanceDetector },
  { name: 'Complexity', icon: '🧮', DetectorClass: ComplexityDetector },
  { name: 'Circular Deps', icon: '🔄', DetectorClass: CircularDependencyDetector },
  { name: 'Imports', icon: '📦', DetectorClass: ImportDetector },
  { name: 'Packages', icon: '📋', DetectorClass: PackageDetector },
  { name: 'Runtime', icon: '⚙️', DetectorClass: RuntimeDetector },
  { name: 'Build', icon: '🏗️', DetectorClass: BuildDetector },
  { name: 'Network', icon: '🌐', DetectorClass: NetworkDetector },
  { name: 'Isolation', icon: '🔐', DetectorClass: ComponentIsolationDetector },
  { name: 'Python Types', icon: '🐍', DetectorClass: PythonTypeDetector },
  { name: 'Python Security', icon: '🔒🐍', DetectorClass: PythonSecurityDetector },
  { name: 'Python Complexity', icon: '🧮🐍', DetectorClass: PythonComplexityDetector },
];

async function runDetector(
  name: string,
  icon: string,
  DetectorClass: any,
  targetPath: string
): Promise<DetectorResult> {
  try {
    const detector = new DetectorClass(targetPath);
    const issues = await detector.detect(targetPath);
    const issuesArray = Array.isArray(issues) ? issues : [];
    return { name, icon, count: issuesArray.length, issues: issuesArray };
  } catch (error) {
    const msg = (error as Error).message;
    if (!msg.includes('workspaceRoot is required')) {
      console.log(c('gray', `   ${icon} ${name}: Skipped (${msg.substring(0, 60)})`));
    }
    return { name, icon, count: 0, issues: [] };
  }
}

export async function runAllDetectors(fullPath: string): Promise<DetectorResult[]> {
  console.log(c('yellow', '⚡ Running 16 detectors in parallel...\n'));
  
  const promises = DETECTORS.map(d => 
    runDetector(d.name, d.icon, d.DetectorClass, fullPath)
  );
  
  return await Promise.all(promises);
}
