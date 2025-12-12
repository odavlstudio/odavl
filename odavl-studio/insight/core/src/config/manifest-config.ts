/**
 * ODAVL Insight - Manifest Configuration Loader
 * Phase P2: ACTIVE manifest-driven behavior
 * 
 * Provides centralized access to Insight configuration from manifest.
 * Implements runtime enforcement of manifest rules.
 */

import { manifest } from '@odavl/core/manifest';
import type { DetectorName } from '../detector/detector-loader.js';

// All stable detectors (core 11)
const ALL_STABLE_DETECTORS: DetectorName[] = [
  'typescript',
  'security',
  'performance',
  'complexity',
  'circular',
  'import',
  'package',
  'runtime',
  'build',
  'network',
  'isolation',
];

/**
 * Phase P2 Task 1.1: Get active detectors based on manifest enable/disable rules
 * 
 * Logic:
 * - If enabled list is non-empty → use it as allowed set (minus disabled)
 * - If enabled is empty/undefined → use all stable detectors (minus disabled)
 * 
 * @returns Array of detector names that should be active
 */
export function getActiveDetectors(): DetectorName[] {
  try {
    const enabled = manifest.insight?.enabled || [];
    const disabled = manifest.insight?.disabled || [];
    
    // If enabled list is non-empty, use it as the base
    if (enabled.length > 0) {
      const active = enabled.filter((d: string) => !disabled.includes(d));
      console.log(`[Insight] Active detectors from manifest.enabled: ${active.join(', ')}`);
      return active as DetectorName[];
    }
    
    // Otherwise use all stable detectors minus disabled
    const active = ALL_STABLE_DETECTORS.filter(d => !disabled.includes(d));
    console.log(`[Insight] Active detectors (all stable minus disabled): ${active.join(', ')}`);
    return active;
  } catch (error) {
    console.warn('[Insight] Manifest unavailable, using all stable detectors');
    return [...ALL_STABLE_DETECTORS];
  }
}

/**
 * Phase P1: Get disabled detectors from manifest
 * @returns Array of detector names that should be disabled
 */
export function getDisabledDetectors(): DetectorName[] {
  try {
    return (manifest.insight?.disabled || []) as DetectorName[];
  } catch (error) {
    return [];
  }
}

/**
 * Phase P1: Get enabled detectors from manifest (legacy, use getActiveDetectors instead)
 * @deprecated Use getActiveDetectors() for Phase P2 behavior
 * @returns Array of detector names from manifest.enabled
 */
export function getEnabledDetectors(): DetectorName[] {
  try {
    const enabled = manifest.insight?.enabled || [];
    return enabled.length > 0 ? (enabled as DetectorName[]) : [...ALL_STABLE_DETECTORS];
  } catch (error) {
    return [...ALL_STABLE_DETECTORS];
  }
}

// Severity ranking for comparison
type Severity = 'critical' | 'high' | 'medium' | 'low';

const SEVERITY_RANKS: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function severityToRank(severity: Severity): number {
  return SEVERITY_RANKS[severity] || 1;
}

/**
 * Phase P2 Task 1.2: Check if severity should be reported based on manifest threshold
 * 
 * @param level Severity level of the finding
 * @returns True if finding should be included in report
 */
export function shouldReportSeverity(level: Severity): boolean {
  try {
    const minSeverity = manifest.insight?.minSeverity || 'low';
    const shouldReport = severityToRank(level) >= severityToRank(minSeverity as Severity);
    
    if (!shouldReport) {
      console.debug(`[Insight] Filtered ${level} finding (below minimum: ${minSeverity})`);
    }
    
    return shouldReport;
  } catch (error) {
    // Fail open: report all severities if manifest unavailable
    return true;
  }
}

/**
 * Phase P1: Get minimum severity level from manifest
 * @returns Minimum severity level ('critical' | 'high' | 'medium' | 'low')
 */
export function getMinSeverity(): 'critical' | 'high' | 'medium' | 'low' {
  try {
    return manifest.insight?.minSeverity || 'medium';
  } catch (error) {
    return 'medium';
  }
}

/**
 * Phase P2 Task 1.3: Get maximum files to analyze from manifest
 * @returns Maximum number of files (-1 means no limit)
 */
export function getMaxFiles(): number {
  try {
    const maxFiles = manifest.insight?.maxFiles;
    return maxFiles !== undefined ? maxFiles : -1; // Default: no limit
  } catch (error) {
    return -1; // No limit on failure
  }
}

/**
 * Phase P2 Task 1.3: Apply max files limit with deterministic truncation
 * 
 * @param files Array of file paths discovered for analysis
 * @returns Truncated array respecting manifest.insight.maxFiles
 */
export function applyMaxFilesLimit(files: string[]): string[] {
  const maxFiles = getMaxFiles();
  
  // No limit specified (-1) or maxFiles >= discovered count
  if (maxFiles === -1 || maxFiles >= files.length) {
    return files;
  }
  
  // Truncate deterministically (sort first for consistency)
  const sorted = [...files].sort();
  const truncated = sorted.slice(0, maxFiles);
  
  console.warn(
    `[Insight] File limit reached: analyzing ${maxFiles} of ${files.length} files (${files.length - maxFiles} skipped)`
  );
  
  // TODO P2: Add audit entry for skipped files
  
  return truncated;
}

/**
 * Phase P1: Get file globs from manifest
 * @returns File glob patterns for include/exclude
 */
export function getFileGlobs(): {
  include: string[];
  exclude: string[];
} {
  try {
    return {
      include: manifest.insight?.fileGlobs?.include || ['**/*.{ts,tsx,js,jsx}'],
      exclude: manifest.insight?.fileGlobs?.exclude || [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/out/**',
      ],
    };
  } catch (error) {
    return {
      include: ['**/*.{ts,tsx,js,jsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/out/**',
      ],
    };
  }
}

/**
 * Phase P1: Get false positive rules from manifest (legacy)
 * @deprecated Use isSuppressedByFalsePositiveRules for Phase P2 behavior
 * @returns Array of false positive rule patterns
 */
export function getFalsePositiveRules(): Array<{
  detector: string;
  pattern: string;
  reason: string;
  expires?: string;
}> {
  try {
    return manifest.insight?.falsePositiveRules || [];
  } catch (error) {
    return [];
  }
}

/**
 * Phase P2 Task 1.5: Check if finding should be suppressed by false positive rules
 * 
 * @param finding Object with detector, message, path properties
 * @returns True if finding is suppressed, false otherwise
 */
export function isSuppressedByFalsePositiveRules(finding: {
  detector: string;
  message: string;
  path?: string;
}): boolean {
  try {
    const rules = getFalsePositiveRules();
    
    for (const rule of rules) {
      // Skip expired rules
      if (rule.expires) {
        const expiryDate = new Date(rule.expires);
        if (expiryDate < new Date()) {
          console.debug(`[Insight] Skipping expired false positive rule: ${rule.detector}/${rule.pattern}`);
          continue;
        }
      }
      
      // Match detector name
      if (rule.detector !== finding.detector) {
        continue;
      }
      
      // Match pattern (regex) against message or path
      try {
        const regex = new RegExp(rule.pattern);
        const matchTarget = finding.message + (finding.path || '');
        
        if (regex.test(matchTarget)) {
          console.debug(
            `[Insight] Suppressed finding via false positive rule: ${rule.detector}/${rule.pattern} (reason: ${rule.reason || 'N/A'})`
          );
          return true;
        }
      } catch (regexError) {
        console.warn(`[Insight] Invalid regex in false positive rule: ${rule.pattern}`, regexError);
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('[Insight] Error checking false positive rules:', error);
    return false; // Fail open: don't suppress if check fails
  }
}

/**
 * Phase P1: Check if detector is enabled
 * @param name Detector name
 * @returns True if detector should run
 */
export function isDetectorEnabled(name: DetectorName): boolean {
  const disabled = getDisabledDetectors();
  
  if (disabled.includes(name)) {
    return false;
  }
  
  const enabled = getEnabledDetectors();
  return enabled.includes(name);
}
