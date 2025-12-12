/**
 * ODAVL Insight - Detector Registry
 * 
 * Manages detector loading and feature gating based on subscription tier
 * 
 * @module DetectorRegistry
 */

import { SubscriptionTier } from './license/license-manager.js';

/**
 * Detector Information
 */
export interface DetectorInfo {
  id: string;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
  category: 'basic' | 'advanced' | 'ml' | 'enterprise';
  enabled: boolean;
}

/**
 * Detector Registry
 * 
 * Central registry for all available detectors with tier-based access control
 */
export class DetectorRegistry {
  private static readonly ALL_DETECTORS: Omit<DetectorInfo, 'enabled'>[] = [
    // ========== FREE TIER DETECTORS ==========
    {
      id: 'typescript',
      name: 'TypeScript Detector',
      description: 'Detects TypeScript compilation errors and type issues',
      requiredTier: SubscriptionTier.FREE,
      category: 'basic'
    },
    {
      id: 'eslint',
      name: 'ESLint Detector',
      description: 'Detects linting errors and code style issues',
      requiredTier: SubscriptionTier.FREE,
      category: 'basic'
    },
    {
      id: 'import',
      name: 'Import Detector',
      description: 'Detects missing imports and circular dependencies',
      requiredTier: SubscriptionTier.FREE,
      category: 'basic'
    },

    // ========== PRO TIER DETECTORS ==========
    {
      id: 'security',
      name: 'Security Detector',
      description: 'Detects security vulnerabilities and hardcoded secrets',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'performance',
      name: 'Performance Detector',
      description: 'Detects performance anti-patterns and bottlenecks',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'circular',
      name: 'Circular Dependency Detector',
      description: 'Detects circular dependencies between modules',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'package',
      name: 'Package Detector',
      description: 'Detects outdated dependencies and vulnerabilities',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'build',
      name: 'Build Detector',
      description: 'Detects build configuration issues',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'network',
      name: 'Network Detector',
      description: 'Detects network-related issues and API errors',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'complexity',
      name: 'Complexity Detector',
      description: 'Detects high complexity code and suggests refactoring',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'isolation',
      name: 'Isolation Detector',
      description: 'Detects code isolation and modularity issues',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },

    // ========== ML-POWERED DETECTORS (PRO+) ==========
    {
      id: 'ml-prediction',
      name: 'ML Error Prediction',
      description: 'ML-powered error prediction and fix suggestions',
      requiredTier: SubscriptionTier.PRO,
      category: 'ml'
    },
    {
      id: 'auto-fix',
      name: 'Auto-Fix',
      description: 'Automatic error correction using ML',
      requiredTier: SubscriptionTier.PRO,
      category: 'ml'
    },

    // ========== MULTI-LANGUAGE DETECTORS (PRO+) ==========
    {
      id: 'python',
      name: 'Python Detector',
      description: 'Python-specific error detection (mypy, flake8, bandit)',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'java',
      name: 'Java Detector',
      description: 'Java-specific error detection and best practices',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'go',
      name: 'Go Detector',
      description: 'Go-specific error detection (vet, staticcheck)',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },
    {
      id: 'rust',
      name: 'Rust Detector',
      description: 'Rust-specific error detection (clippy)',
      requiredTier: SubscriptionTier.PRO,
      category: 'advanced'
    },

    // ========== ENTERPRISE DETECTORS ==========
    {
      id: 'custom-rules',
      name: 'Custom Rules Engine',
      description: 'Define organization-specific code quality rules',
      requiredTier: SubscriptionTier.ENTERPRISE,
      category: 'enterprise'
    },
    {
      id: 'audit-logs',
      name: 'Audit Logs',
      description: 'Complete audit trail of all analyses and changes',
      requiredTier: SubscriptionTier.ENTERPRISE,
      category: 'enterprise'
    },
    {
      id: 'compliance',
      name: 'Compliance Checker',
      description: 'Check compliance with industry standards (SOC 2, HIPAA)',
      requiredTier: SubscriptionTier.ENTERPRISE,
      category: 'enterprise'
    }
  ];

  /**
   * Get all available detectors for a subscription tier
   */
  static getAvailableDetectors(userTier: SubscriptionTier): DetectorInfo[] {
    // Tier hierarchy: FREE < PRO < ENTERPRISE
    const tierLevel: Record<SubscriptionTier, number> = {
      [SubscriptionTier.FREE]: 1,
      [SubscriptionTier.PRO]: 2,
      [SubscriptionTier.ENTERPRISE]: 3
    };

    const userLevel = tierLevel[userTier];

    return this.ALL_DETECTORS
      .filter(detector => tierLevel[detector.requiredTier] <= userLevel)
      .map(detector => ({
        ...detector,
        enabled: true
      }));
  }

  /**
   * Get locked detectors (require upgrade)
   */
  static getLockedDetectors(userTier: SubscriptionTier): DetectorInfo[] {
    const tierLevel: Record<SubscriptionTier, number> = {
      [SubscriptionTier.FREE]: 1,
      [SubscriptionTier.PRO]: 2,
      [SubscriptionTier.ENTERPRISE]: 3
    };

    const userLevel = tierLevel[userTier];

    return this.ALL_DETECTORS
      .filter(detector => tierLevel[detector.requiredTier] > userLevel)
      .map(detector => ({
        ...detector,
        enabled: false
      }));
  }

  /**
   * Check if a specific detector is available
   */
  static isDetectorAvailable(detectorId: string, userTier: SubscriptionTier): boolean {
    const detector = this.ALL_DETECTORS.find(d => d.id === detectorId);
    if (!detector) {
      return false;
    }

    const tierLevel: Record<SubscriptionTier, number> = {
      [SubscriptionTier.FREE]: 1,
      [SubscriptionTier.PRO]: 2,
      [SubscriptionTier.ENTERPRISE]: 3
    };

    return tierLevel[userTier] >= tierLevel[detector.requiredTier];
  }

  /**
   * Get detector count by tier
   */
  static getDetectorCountByTier(tier: SubscriptionTier): number {
    return this.getAvailableDetectors(tier).length;
  }

  /**
   * Get upgrade tier for a locked detector
   */
  static getRequiredTierForDetector(detectorId: string): SubscriptionTier | null {
    const detector = this.ALL_DETECTORS.find(d => d.id === detectorId);
    return detector ? detector.requiredTier : null;
  }

  /**
   * Get all detectors (for admin/debugging)
   */
  static getAllDetectors(): Omit<DetectorInfo, 'enabled'>[] {
    return [...this.ALL_DETECTORS];
  }

  /**
   * Get detectors by category
   */
  static getDetectorsByCategory(
    category: DetectorInfo['category'],
    userTier: SubscriptionTier
  ): DetectorInfo[] {
    return this.getAvailableDetectors(userTier).filter(d => d.category === category);
  }
}
