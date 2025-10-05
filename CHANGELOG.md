# ODAVL Changelog

## v0.1.0 (Initial MVP) - 2025-10-05

### 🎉 Initial Release

**Core ODAVL Loop**
- Implemented complete Observe-Decide-Act-Verify-Learn autonomous cycle
- Real-time monitoring of ESLint warnings and TypeScript errors
- Automated decision making and code improvement execution

**Recipes & Trust Learning**
- Recipe-based improvement strategies (remove-unused, format-consistency, esm-hygiene)
- Trust scoring system that learns from successful/failed improvements
- Dynamic recipe selection based on historical performance

**Gates & Attestation**
- Configurable quality gates to prevent code quality degradation
- Cryptographic attestation of successful improvements
- Zero-tolerance policy for new type errors and excessive changes

**Shadow Verify & Undo**
- Shadow verification in isolated environment before applying changes
- Automatic snapshot system for safe rollback capability
- Undo functionality to revert to last known good state

**Doctor UI Panel for VS Code**
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