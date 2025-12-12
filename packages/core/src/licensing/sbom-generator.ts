/**
 * SBOM Generator - Generate Software Bill of Materials
 * 
 * Purpose: Create SBOM in CycloneDX and SPDX formats
 * Week 29: License Management (File 3/3)
 * 
 * SBOM Standards:
 * - CycloneDX 1.4+: Lightweight, JSON/XML, security-focused
 * - SPDX 2.3: Comprehensive, JSON/RDF/tag-value, ISO/IEC 5962:2021
 * 
 * SBOM Use Cases:
 * - Vulnerability management (CVE scanning)
 * - License compliance
 * - Supply chain security
 * - Regulatory compliance (US Executive Order 14028)
 * 
 * Key Components:
 * - Component inventory (packages, versions, licenses)
 * - Dependency graph (direct vs transitive)
 * - Vulnerability data (CVEs)
 * - License information (SPDX identifiers)
 * - Pedigree (source, build, distribution)
 * 
 * @module @odavl-studio/core/licensing/sbom-generator
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { LicenseFinding, LicenseType } from './license-scanner';

/**
 * SBOM format
 */
export enum SBOMFormat {
  CYCLONEDX_1_4 = 'CycloneDX-1.4',
  CYCLONEDX_1_5 = 'CycloneDX-1.5',
  SPDX_2_3 = 'SPDX-2.3'
}

/**
 * SBOM output format
 */
export enum SBOMOutputFormat {
  JSON = 'json',
  XML = 'xml',
  YAML = 'yaml'
}

/**
 * Component type (CycloneDX)
 */
export enum ComponentType {
  APPLICATION = 'application',
  FRAMEWORK = 'framework',
  LIBRARY = 'library',
  CONTAINER = 'container',
  OPERATING_SYSTEM = 'operating-system',
  DEVICE = 'device',
  FIRMWARE = 'firmware',
  FILE = 'file'
}

/**
 * SBOM component
 */
export interface SBOMComponent {
  type: ComponentType;
  name: string;
  version: string;
  purl?: string; // Package URL (e.g., pkg:npm/express@4.18.2)
  license?: string; // SPDX identifier
  licenses?: Array<{ license: { id: string } }>;
  hashes?: Array<{ alg: string; content: string }>;
  externalReferences?: Array<{
    type: string;
    url: string;
  }>;
  supplier?: string;
  author?: string;
  description?: string;
  dependencies?: string[]; // BOM-REFs of dependencies
}

/**
 * SBOM vulnerability
 */
export interface SBOMVulnerability {
  id: string; // CVE-2024-12345
  source?: { name: string; url: string };
  ratings?: Array<{
    score: number;
    severity: string;
    method: string; // CVSS_V3
    vector?: string;
  }>;
  description?: string;
  recommendations?: string[];
  affects?: Array<{ ref: string }>; // BOM-REF
}

/**
 * SBOM generator configuration
 */
export interface SBOMGeneratorConfig {
  rootPath: string;
  format: SBOMFormat;
  outputFormat?: SBOMOutputFormat;
  includeLicenses?: boolean;
  includeVulnerabilities?: boolean;
  includeDependencyGraph?: boolean;
  includeHashes?: boolean; // SHA-256 hashes
  projectName?: string;
  projectVersion?: string;
  projectDescription?: string;
  supplier?: string;
  author?: string;
  findings?: LicenseFinding[]; // From license scanner
  vulnerabilities?: any[]; // From CVE scanner
}

/**
 * SBOM generation result
 */
export interface SBOMGenerationResult {
  sbom: any; // CycloneDX or SPDX JSON
  format: SBOMFormat;
  outputFormat: SBOMOutputFormat;
  summary: {
    componentCount: number;
    licenseCount: number;
    vulnerabilityCount: number;
    dependencyCount: number;
    hashedComponents: number;
  };
  metadata: {
    generatedAt: Date;
    generatorVersion: string;
    tool: string;
    configUsed: Partial<SBOMGeneratorConfig>;
  };
}

/**
 * SBOM Generator
 */
export class SBOMGenerator {
  private config: Required<SBOMGeneratorConfig>;
  private components: SBOMComponent[] = [];
  private vulnerabilities: SBOMVulnerability[] = [];

  constructor(config: SBOMGeneratorConfig) {
    this.config = {
      rootPath: config.rootPath,
      format: config.format,
      outputFormat: config.outputFormat ?? SBOMOutputFormat.JSON,
      includeLicenses: config.includeLicenses ?? true,
      includeVulnerabilities: config.includeVulnerabilities ?? false,
      includeDependencyGraph: config.includeDependencyGraph ?? true,
      includeHashes: config.includeHashes ?? false,
      projectName: config.projectName ?? 'Unknown Project',
      projectVersion: config.projectVersion ?? '1.0.0',
      projectDescription: config.projectDescription ?? '',
      supplier: config.supplier ?? 'Unknown Supplier',
      author: config.author ?? 'Unknown Author',
      findings: config.findings ?? [],
      vulnerabilities: config.vulnerabilities ?? []
    };
  }

  /**
   * Generate SBOM
   */
  async generate(): Promise<SBOMGenerationResult> {
    console.log(`📋 Generating ${this.config.format} SBOM...`);

    // Build components from license findings
    await this.buildComponents();

    // Build vulnerabilities
    if (this.config.includeVulnerabilities) {
      await this.buildVulnerabilities();
    }

    // Generate SBOM in requested format
    let sbom: any;
    switch (this.config.format) {
      case SBOMFormat.CYCLONEDX_1_4:
        sbom = this.generateCycloneDX14();
        break;
      case SBOMFormat.CYCLONEDX_1_5:
        sbom = this.generateCycloneDX15();
        break;
      case SBOMFormat.SPDX_2_3:
        sbom = this.generateSPDX23();
        break;
      default:
        throw new Error(`Unsupported SBOM format: ${this.config.format}`);
    }

    // Generate summary
    const summary = this.generateSummary();

    return {
      sbom,
      format: this.config.format,
      outputFormat: this.config.outputFormat,
      summary,
      metadata: {
        generatedAt: new Date(),
        generatorVersion: '1.0.0',
        tool: 'ODAVL SBOM Generator',
        configUsed: this.config
      }
    };
  }

  /**
   * Build components from license findings
   */
  private async buildComponents(): Promise<void> {
    const packageJsonPath = path.join(this.config.rootPath, 'package.json');
    let packageJson: any = {};

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Failed to read package.json');
    }

    // Main application component
    const mainComponent: SBOMComponent = {
      type: ComponentType.APPLICATION,
      name: this.config.projectName,
      version: this.config.projectVersion,
      description: this.config.projectDescription,
      supplier: this.config.supplier,
      author: this.config.author,
      purl: this.generatePURL(this.config.projectName, this.config.projectVersion),
      externalReferences: []
    };

    if (packageJson.homepage) {
      mainComponent.externalReferences!.push({
        type: 'website',
        url: packageJson.homepage
      });
    }

    if (packageJson.repository?.url) {
      mainComponent.externalReferences!.push({
        type: 'vcs',
        url: packageJson.repository.url.replace(/^git\+/, '')
      });
    }

    this.components.push(mainComponent);

    // Dependency components from license findings
    for (const finding of this.config.findings) {
      const component: SBOMComponent = {
        type: ComponentType.LIBRARY,
        name: finding.packageName,
        version: finding.version,
        purl: this.generatePURL(finding.packageName, finding.version)
      };

      // License
      if (this.config.includeLicenses && finding.license) {
        component.licenses = [
          {
            license: {
              id: finding.spdxId ?? finding.license
            }
          }
        ];
      }

      // Hashes
      if (this.config.includeHashes) {
        const hash = await this.calculatePackageHash(finding.packageName);
        if (hash) {
          component.hashes = [
            {
              alg: 'SHA-256',
              content: hash
            }
          ];
        }
      }

      // External references
      component.externalReferences = [
        {
          type: 'distribution',
          url: `https://registry.npmjs.org/${finding.packageName}/-/${finding.packageName}-${finding.version}.tgz`
        }
      ];

      this.components.push(component);
    }
  }

  /**
   * Build vulnerabilities
   */
  private async buildVulnerabilities(): Promise<void> {
    for (const vuln of this.config.vulnerabilities) {
      const sbomVuln: SBOMVulnerability = {
        id: vuln.id,
        source: {
          name: vuln.source ?? 'NVD',
          url: `https://nvd.nist.gov/vuln/detail/${vuln.id}`
        },
        description: vuln.description,
        recommendations: vuln.recommendations ?? [],
        affects: []
      };

      // Ratings
      if (vuln.cvssScore) {
        sbomVuln.ratings = [
          {
            score: vuln.cvssScore,
            severity: vuln.severity,
            method: 'CVSSv3',
            vector: vuln.cvssVector
          }
        ];
      }

      // Find affected components
      const affectedComponent = this.components.find(
        c => c.name === vuln.package && c.version === vuln.version
      );
      if (affectedComponent) {
        sbomVuln.affects = [
          { ref: this.generateBOMRef(affectedComponent.name, affectedComponent.version) }
        ];
      }

      this.vulnerabilities.push(sbomVuln);
    }
  }

  /**
   * Generate CycloneDX 1.4 SBOM
   */
  private generateCycloneDX14(): any {
    const metadata = {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: 'ODAVL Studio',
          name: 'ODAVL SBOM Generator',
          version: '1.0.0'
        }
      ],
      component: this.components[0] // Main application
    };

    const components = this.components.slice(1).map(comp => ({
      type: comp.type,
      'bom-ref': this.generateBOMRef(comp.name, comp.version),
      name: comp.name,
      version: comp.version,
      purl: comp.purl,
      licenses: comp.licenses,
      hashes: comp.hashes,
      externalReferences: comp.externalReferences
    }));

    const sbom: any = {
      bomFormat: 'CycloneDX',
      specVersion: '1.4',
      serialNumber: `urn:uuid:${crypto.randomUUID()}`,
      version: 1,
      metadata,
      components
    };

    // Dependency graph
    if (this.config.includeDependencyGraph) {
      sbom.dependencies = this.generateDependencyGraph();
    }

    // Vulnerabilities
    if (this.config.includeVulnerabilities && this.vulnerabilities.length > 0) {
      sbom.vulnerabilities = this.vulnerabilities.map(vuln => ({
        id: vuln.id,
        source: vuln.source,
        ratings: vuln.ratings,
        description: vuln.description,
        recommendation: vuln.recommendations?.join('. '),
        affects: vuln.affects
      }));
    }

    return sbom;
  }

  /**
   * Generate CycloneDX 1.5 SBOM
   */
  private generateCycloneDX15(): any {
    // CycloneDX 1.5 is similar to 1.4 with additional features
    const sbom = this.generateCycloneDX14();
    sbom.specVersion = '1.5';

    // 1.5 additions: formulation, annotations, evidence
    // For simplicity, using same structure as 1.4
    return sbom;
  }

  /**
   * Generate SPDX 2.3 SBOM
   */
  private generateSPDX23(): any {
    const documentNamespace = `https://odavl.studio/sbom/${crypto.randomUUID()}`;
    
    const sbom: any = {
      spdxVersion: 'SPDX-2.3',
      dataLicense: 'CC0-1.0',
      SPDXID: 'SPDXRef-DOCUMENT',
      name: `${this.config.projectName}-${this.config.projectVersion}`,
      documentNamespace,
      creationInfo: {
        created: new Date().toISOString(),
        creators: [
          'Tool: ODAVL-SBOM-Generator-1.0.0'
        ],
        licenseListVersion: '3.21'
      },
      packages: []
    };

    // Main package
    sbom.packages.push({
      SPDXID: 'SPDXRef-Package-' + this.sanitizeSPDXId(this.config.projectName),
      name: this.config.projectName,
      versionInfo: this.config.projectVersion,
      supplier: `Organization: ${this.config.supplier}`,
      downloadLocation: 'NOASSERTION',
      filesAnalyzed: false,
      licenseConcluded: 'NOASSERTION',
      licenseDeclared: 'NOASSERTION',
      copyrightText: 'NOASSERTION'
    });

    // Dependency packages
    for (const comp of this.components.slice(1)) {
      const pkg: any = {
        SPDXID: 'SPDXRef-Package-' + this.sanitizeSPDXId(comp.name),
        name: comp.name,
        versionInfo: comp.version,
        downloadLocation: comp.externalReferences?.[0]?.url ?? 'NOASSERTION',
        filesAnalyzed: false,
        licenseConcluded: 'NOASSERTION',
        copyrightText: 'NOASSERTION'
      };

      // License
      if (comp.licenses && comp.licenses.length > 0) {
        pkg.licenseDeclared = comp.licenses[0].license.id;
      } else {
        pkg.licenseDeclared = 'NOASSERTION';
      }

      // Checksums
      if (comp.hashes && comp.hashes.length > 0) {
        pkg.checksums = comp.hashes.map(h => ({
          algorithm: h.alg,
          checksumValue: h.content
        }));
      }

      // External references
      if (comp.externalReferences) {
        pkg.externalRefs = comp.externalReferences.map(ref => ({
          referenceCategory: 'PACKAGE-MANAGER',
          referenceType: 'purl',
          referenceLocator: comp.purl
        }));
      }

      sbom.packages.push(pkg);
    }

    // Relationships (dependency graph)
    if (this.config.includeDependencyGraph) {
      sbom.relationships = [
        {
          spdxElementId: 'SPDXRef-DOCUMENT',
          relationshipType: 'DESCRIBES',
          relatedSpdxElement: 'SPDXRef-Package-' + this.sanitizeSPDXId(this.config.projectName)
        }
      ];

      // Dependencies
      for (const comp of this.components.slice(1)) {
        sbom.relationships.push({
          spdxElementId: 'SPDXRef-Package-' + this.sanitizeSPDXId(this.config.projectName),
          relationshipType: 'DEPENDS_ON',
          relatedSpdxElement: 'SPDXRef-Package-' + this.sanitizeSPDXId(comp.name)
        });
      }
    }

    return sbom;
  }

  /**
   * Generate Package URL (purl)
   */
  private generatePURL(name: string, version: string): string {
    // Format: pkg:npm/package@version
    return `pkg:npm/${encodeURIComponent(name)}@${version}`;
  }

  /**
   * Generate BOM-REF for CycloneDX
   */
  private generateBOMRef(name: string, version: string): string {
    return `pkg:npm/${name}@${version}`;
  }

  /**
   * Sanitize SPDX ID (alphanumeric, dash, dot only)
   */
  private sanitizeSPDXId(name: string): string {
    return name.replace(/[^a-zA-Z0-9.-]/g, '-');
  }

  /**
   * Calculate package hash (SHA-256)
   */
  private async calculatePackageHash(packageName: string): Promise<string | null> {
    try {
      const packagePath = path.join(
        this.config.rootPath,
        'node_modules',
        packageName,
        'package.json'
      );
      const content = await fs.readFile(packagePath, 'utf-8');
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return null;
    }
  }

  /**
   * Generate dependency graph
   */
  private generateDependencyGraph(): any[] {
    const mainRef = this.generateBOMRef(this.config.projectName, this.config.projectVersion);
    
    const dependencies = [
      {
        ref: mainRef,
        dependsOn: this.components.slice(1).map(c => this.generateBOMRef(c.name, c.version))
      }
    ];

    // Each component with no further dependencies
    for (const comp of this.components.slice(1)) {
      dependencies.push({
        ref: this.generateBOMRef(comp.name, comp.version),
        dependsOn: []
      });
    }

    return dependencies;
  }

  /**
   * Generate summary
   */
  private generateSummary(): SBOMGenerationResult['summary'] {
    const licenseSet = new Set<string>();
    let hashedComponents = 0;

    for (const comp of this.components) {
      if (comp.licenses) {
        for (const lic of comp.licenses) {
          licenseSet.add(lic.license.id);
        }
      }
      if (comp.hashes && comp.hashes.length > 0) {
        hashedComponents++;
      }
    }

    return {
      componentCount: this.components.length,
      licenseCount: licenseSet.size,
      vulnerabilityCount: this.vulnerabilities.length,
      dependencyCount: this.components.length - 1, // Exclude main component
      hashedComponents
    };
  }

  /**
   * Export SBOM to file
   */
  async exportToFile(outputPath: string): Promise<void> {
    const result = await this.generate();
    let content: string;

    switch (this.config.outputFormat) {
      case SBOMOutputFormat.JSON:
        content = JSON.stringify(result.sbom, null, 2);
        break;
      case SBOMOutputFormat.XML:
        // XML conversion not implemented (requires xml2js or similar)
        throw new Error('XML export not yet implemented');
      case SBOMOutputFormat.YAML:
        // YAML conversion not implemented (requires js-yaml)
        throw new Error('YAML export not yet implemented');
      default:
        content = JSON.stringify(result.sbom, null, 2);
    }

    await fs.writeFile(outputPath, content, 'utf-8');
    console.log(`✅ SBOM exported to ${outputPath}`);
  }

  /**
   * Validate SBOM against schema
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    // Basic validation
    const errors: string[] = [];

    if (this.components.length === 0) {
      errors.push('SBOM must contain at least one component');
    }

    if (!this.config.projectName) {
      errors.push('Project name is required');
    }

    if (!this.config.projectVersion) {
      errors.push('Project version is required');
    }

    // CycloneDX-specific validation
    if (this.config.format.startsWith('CycloneDX')) {
      for (const comp of this.components) {
        if (!comp.name) {
          errors.push(`Component missing name: ${JSON.stringify(comp)}`);
        }
        if (!comp.version) {
          errors.push(`Component missing version: ${comp.name}`);
        }
      }
    }

    // SPDX-specific validation
    if (this.config.format === SBOMFormat.SPDX_2_3) {
      // SPDX requires SPDXID, name, versionInfo, downloadLocation
      for (const comp of this.components) {
        if (!comp.name) {
          errors.push('SPDX package missing name');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Convenience function to generate SBOM
 */
export async function generateSBOM(config: SBOMGeneratorConfig): Promise<SBOMGenerationResult> {
  const generator = new SBOMGenerator(config);
  return generator.generate();
}

/**
 * Generate and export SBOM to file
 */
export async function generateSBOMFile(
  config: SBOMGeneratorConfig,
  outputPath: string
): Promise<void> {
  const generator = new SBOMGenerator(config);
  await generator.exportToFile(outputPath);
}

/**
 * Quick SBOM generation for CI/CD
 */
export async function quickSBOM(
  rootPath: string,
  outputPath: string,
  format: SBOMFormat = SBOMFormat.CYCLONEDX_1_4
): Promise<void> {
  const generator = new SBOMGenerator({
    rootPath,
    format,
    projectName: path.basename(rootPath),
    projectVersion: '1.0.0'
  });
  await generator.exportToFile(outputPath);
}
