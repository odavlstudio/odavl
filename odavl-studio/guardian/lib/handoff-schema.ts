/**
 * ODAVL Guardian → Autopilot Handoff Schema
 * 
 * Purpose: Define JSON structure for Guardian-to-Autopilot communication
 * Guardian detects issues → generates suggestions → Autopilot executes fixes
 * 
 * Schema Version: 1.0.0
 * Last Updated: 2025-11-30
 */

export interface GuardianAutopilotHandoff {
  /**
   * Schema version for compatibility checking
   */
  schemaVersion: '1.0.0';
  
  /**
   * Source product that generated this handoff
   */
  source: 'odavl-guardian';
  
  /**
   * ISO timestamp of when handoff was created
   */
  timestamp: string;
  
  /**
   * Issue details detected by Guardian
   */
  issue: {
    /**
     * Type of issue detected
     */
    type: 'runtime-error' | 'visual-regression' | 'performance-issue' | 'security-vulnerability';
    
    /**
     * Root cause analysis from AI
     */
    rootCause: string;
    
    /**
     * Whether issue is platform-specific (Windows/Mac/Linux)
     */
    isPlatformSpecific: boolean;
    
    /**
     * Files affected by this issue
     */
    affectedFiles: string[];
    
    /**
     * AI confidence score (0-1)
     */
    confidence: number;
    
    /**
     * Issue severity
     */
    severity?: 'critical' | 'high' | 'medium' | 'low';
  };
  
  /**
   * AI-generated fix suggestion
   * ⚠️ Guardian does NOT execute these - Autopilot does
   */
  suggestedFix: {
    /**
     * Files to modify/create/delete
     */
    files: FileFix[];
    
    /**
     * Test plan to verify fix worked
     */
    testPlan: string[];
    
    /**
     * Steps to verify the fix manually
     */
    verificationSteps: string[];
  };
  
  /**
   * AI reasoning for the diagnosis
   */
  reasoning: string;
  
  /**
   * Next steps for user/Autopilot
   */
  nextSteps: string[];
  
  /**
   * Optional: Guardian run metadata
   */
  metadata?: {
    guardianVersion?: string;
    analysisType?: 'runtime' | 'visual' | 'static';
    platform?: string;
    os?: string;
  };
}

export interface FileFix {
  /**
   * Relative path to file (from workspace root)
   */
  path: string;
  
  /**
   * Action to perform
   */
  action: 'modify' | 'create' | 'delete';
  
  /**
   * Code before fix (for modify action)
   */
  before?: string;
  
  /**
   * Code after fix (for modify/create actions)
   */
  after?: string;
  
  /**
   * Explanation of why this fix is needed
   */
  explanation: string;
  
  /**
   * Optional: Line number range for modify action
   */
  lineRange?: {
    start: number;
    end: number;
  };
}

/**
 * Example Handoff JSON:
 * 
 * {
 *   "schemaVersion": "1.0.0",
 *   "source": "odavl-guardian",
 *   "timestamp": "2025-11-30T19:45:00.000Z",
 *   "issue": {
 *     "type": "runtime-error",
 *     "rootCause": "Missing 'use client' directive in React component using context hooks",
 *     "isPlatformSpecific": false,
 *     "affectedFiles": ["src/components/Dashboard.tsx"],
 *     "confidence": 0.95,
 *     "severity": "critical"
 *   },
 *   "suggestedFix": {
 *     "files": [{
 *       "path": "src/components/Dashboard.tsx",
 *       "action": "modify",
 *       "before": "export default function Dashboard() {",
 *       "after": "\"use client\";\n\nexport default function Dashboard() {",
 *       "explanation": "Add 'use client' directive for Next.js 13+ App Router compatibility with React hooks"
 *     }],
 *     "testPlan": [
 *       "Open dashboard panel in extension",
 *       "Check VS Code console for errors",
 *       "Verify dashboard renders correctly"
 *     ],
 *     "verificationSteps": [
 *       "Dashboard should open without crashes",
 *       "No 'useContext' errors in console",
 *       "All UI elements functional"
 *     ]
 *   },
 *   "reasoning": "Next.js 13+ App Router requires 'use client' directive in components that use React hooks like useContext, useState, etc. Without this directive, the component runs on server where context is not available.",
 *   "nextSteps": [
 *     "1. Review suggested fix above",
 *     "2. Run: odavl autopilot run",
 *     "3. Autopilot will safely apply fixes with O-D-A-V-L cycle",
 *     "4. Verify with test plan"
 *   ],
 *   "metadata": {
 *     "guardianVersion": "4.0.0",
 *     "analysisType": "runtime",
 *     "platform": "extension",
 *     "os": "Windows"
 *   }
 * }
 */

/**
 * Type guard to validate handoff structure
 */
export function isValidHandoff(obj: any): obj is GuardianAutopilotHandoff {
  return (
    obj &&
    obj.schemaVersion === '1.0.0' &&
    obj.source === 'odavl-guardian' &&
    typeof obj.timestamp === 'string' &&
    obj.issue &&
    typeof obj.issue.rootCause === 'string' &&
    typeof obj.issue.confidence === 'number' &&
    obj.suggestedFix &&
    Array.isArray(obj.suggestedFix.files) &&
    Array.isArray(obj.suggestedFix.testPlan) &&
    Array.isArray(obj.suggestedFix.verificationSteps)
  );
}

/**
 * Helper to create handoff file path
 */
export function getHandoffFilePath(workspaceRoot: string): string {
  return `${workspaceRoot}/.odavl/guardian/handoff-to-autopilot.json`;
}
