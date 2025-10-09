# ODAVL Changelog

All notable changes to the ODAVL autonomous code quality system.

## [v0.1.0-enterprise] - 2025-01-07

### Enterprise Packaging

- Release automation with PowerShell build script (`tools/release.ps1`)
- GitHub Actions workflow for automated releases (`release.yml`)
- Production-ready artifact generation with checksums and manifests
- Multi-format distribution: CLI package, VS Code extension, Docker container

#### Security & Pilot Readiness (Wave 9)

- Comprehensive CVE scanning with npm audit integration (`tools/security-scan.ps1`)
- License compliance checking with GPL/AGPL conflict detection
- Zero-tolerance security gates blocking high-severity vulnerabilities
- Complete pilot deployment guide with emergency procedures

#### Governance Tightening (Wave 8)

- Advanced policy enforcement with configurable risk management limits
- Policy compliance validation script (`tools/policy-guard.ps1`)
- Infrastructure file exceptions for realistic governance enforcement
- Stricter quality gates with security and compliance requirements

#### Golden Repo Stabilization (Wave 7)

- Comprehensive quality validation script (`tools/golden.ps1`)
- GitHub Actions CI/CD pipeline with Node 18/20 matrix testing
- Automated build verification and artifact upload
- Golden repo status maintenance with stability metrics

### 📦 Enterprise Distribution

#### Installation Options

- npm global install: `npm install -g @odavl/cli@latest`
- VS Code extension: Direct VSIX installation
- Docker container: `docker run odavl/cli:latest`

#### Enterprise Features

- 24/7 support with 4-hour critical response
- Compliance reporting and audit logging
- Custom integration APIs for enterprise toolchains
- Dedicated customer success management

## v0.1.0 (Initial MVP) - 2025-10-05

### 🎉 Initial Release

#### Core ODAVL Loop

- Implemented complete Observe-Decide-Act-Verify-Learn autonomous cycle
- Real-time monitoring of ESLint warnings and TypeScript errors
- Automated decision making and code improvement execution

#### Recipes & Trust Learning

- Recipe-based improvement strategies (remove-unused, format-consistency, esm-hygiene)
- Trust scoring system that learns from successful/failed improvements
- Dynamic recipe selection based on historical performance

#### Gates & Attestation

- Configurable quality gates to prevent code quality degradation
- Cryptographic attestation of successful improvements
- Zero-tolerance policy for new type errors and excessive changes

#### Shadow Verify & Undo

- Shadow verification in isolated environment before applying changes
- Automatic snapshot system for safe rollback capability
- Undo functionality to revert to last known good state

#### Doctor UI Panel for VS Code

- Live monitoring extension with real-time cycle visualization
- Color-coded phase indicators (Observe → Decide → Act → Verify → Learn)
- Interactive panel with Run ODAVL and Explain buttons
- Structured JSON logging integration

### 📦 Packages

- `@odavl/cli@0.1.0` - Command-line interface for ODAVL system
- `odavl@0.1.0` - VS Code extension for live monitoring

### 🛠️ Technical Features

- TypeScript with strict mode and comprehensive error handling
- ESLint integration with flat configuration
- pnpm workspace monorepo structure
- Git-based version control with feature branches
- YAML configuration for gates and policies
- JSON-based data persistence for history and attestations

### 🔧 Configuration

- `.odavl/gates.yml` - Quality gate thresholds
- `.odavl/recipes/` - Improvement strategy templates
- `.odavl/attestation/` - Cryptographic proof storage
- `.odavl/undo/` - Rollback snapshot management
- `reports/` - Metrics and cycle history
