/**
 * SARIF Generator - Phase 2.2 Task 6
 * 
 * Generates SARIF v2.1.0 format reports from ODAVL Insight issues.
 * SARIF = Static Analysis Results Interchange Format
 * Compatible with GitHub Code Scanning, VS Code, and other tools.
 * 
 * Extracted from insight-v2.ts for reusability in cloud uploads.
 */

/**
 * Minimal issue interface (same as in analysis-uploader.ts)
 */
export interface Issue {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  detector: string;
  ruleId?: string;
  suggestedFix?: string;
}

/**
 * SARIF v2.1.0 object structure
 */
export interface SarifReport {
  version: string;
  $schema: string;
  runs: Array<{
    tool: {
      driver: {
        name: string;
        version: string;
        informationUri: string;
        rules: Array<{
          id: string;
          shortDescription: { text: string };
          helpUri: string;
        }>;
      };
    };
    results: Array<{
      ruleId: string;
      level: 'error' | 'warning' | 'note';
      message: { text: string };
      locations: Array<{
        physicalLocation: {
          artifactLocation: { uri: string };
          region: {
            startLine: number;
            startColumn: number;
          };
        };
      }>;
    }>;
  }>;
}

/**
 * Generate SARIF v2.1.0 report from issues
 * 
 * @param issues Array of issues to convert
 * @returns SARIF report object
 */
export function generateSarif(issues: Issue[]): SarifReport {
  // Extract unique detectors for rules
  const detectorSet = new Set(issues.map((i) => i.detector));
  const detectors = Array.from(detectorSet);

  const sarif: SarifReport = {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'ODAVL Insight',
            version: '1.0.0',
            informationUri: 'https://odavl.com/insight',
            rules: detectors.map((detector) => ({
              id: detector,
              shortDescription: { text: `${detector} detector` },
              helpUri: `https://docs.odavl.com/insight/detectors/${detector}`,
            })),
          },
        },
        results: issues.map((issue) => ({
          ruleId: issue.detector,
          level:
            issue.severity === 'critical' || issue.severity === 'high'
              ? 'error'
              : issue.severity === 'medium'
                ? 'warning'
                : 'note',
          message: { text: issue.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: issue.file },
                region: {
                  startLine: issue.line,
                  startColumn: issue.column,
                },
              },
            },
          ],
        })),
      },
    ],
  };

  return sarif;
}

/**
 * Estimate SARIF JSON size in bytes
 * 
 * @param sarif SARIF report object
 * @returns Estimated size in bytes
 */
export function estimateSarifSize(sarif: SarifReport): number {
  return Buffer.from(JSON.stringify(sarif), 'utf-8').length;
}
