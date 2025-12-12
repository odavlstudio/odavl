/**
 * ODAVL Autopilot - File-Type Integration Module
 * Phase P6: Export all file-type aware automation control
 */

export {
  // Core functions
  shouldAllowModification,
  selectFixStrategy,
  calculateWeightedImpact,
  validateRiskWeightedBudget,
  
  // Audit logging
  AutopilotAuditor,
  getAutopilotAuditor,
  
  // Constants
  BLOCKED_FILE_TYPES,
  RISK_WEIGHTS,
  
  // Types
  type FixStrategy,
  type ModificationPermission,
  type FileWithRisk,
  type RiskBudgetValidation,
  type AutopilotAuditLog,
} from './autopilot-filetype-integration';
