/**
 * ODAVL Compliance Framework
 * GDPR, CCPA, PIPL, LGPD compliance utilities
 */

export interface ComplianceConfig {
  framework: 'GDPR' | 'CCPA' | 'PIPL' | 'LGPD';
  region: string;
  dataRetentionDays: number;
  consentRequired: boolean;
  rightToDelete: boolean;
  dataLocalization: boolean;
}

export const COMPLIANCE_FRAMEWORKS: Record<string, ComplianceConfig> = {
  GDPR: {
    framework: 'GDPR',
    region: 'EU',
    dataRetentionDays: 730,
    consentRequired: true,
    rightToDelete: true,
    dataLocalization: false,
  },
  CCPA: {
    framework: 'CCPA',
    region: 'California',
    dataRetentionDays: 365,
    consentRequired: false,
    rightToDelete: true,
    dataLocalization: false,
  },
  PIPL: {
    framework: 'PIPL',
    region: 'China',
    dataRetentionDays: 180,
    consentRequired: true,
    rightToDelete: true,
    dataLocalization: true,
  },
  LGPD: {
    framework: 'LGPD',
    region: 'Brazil',
    dataRetentionDays: 365,
    consentRequired: true,
    rightToDelete: true,
    dataLocalization: false,
  },
};

export class ComplianceValidator {
  private config: ComplianceConfig;
  
  constructor(framework: 'GDPR' | 'CCPA' | 'PIPL' | 'LGPD') {
    this.config = COMPLIANCE_FRAMEWORKS[framework];
  }
  
  validateDataRetention(dataAge: number): boolean {
    return dataAge <= this.config.dataRetentionDays;
  }
  
  requiresConsent(): boolean {
    return this.config.consentRequired;
  }
  
  supportsRightToDelete(): boolean {
    return this.config.rightToDelete;
  }
  
  requiresDataLocalization(): boolean {
    return this.config.dataLocalization;
  }
}

export default ComplianceValidator;
