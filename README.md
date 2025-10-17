# ODAVL – Autonomous Code Quality & Governance for Enterprises

**Secure, compliant, and intelligent code governance directly inside VS Code.**

## Overview

- 🧠 Intelligent ODAVL Cycles (Observe→Decide→Act→Verify→Learn)
- 🔒 Real-Time Security & Policy Gates
- 📊 Enterprise Insights Dashboard
- 🧩 Configurable Risk Budgets & Compliance
- 🧾 Automated Attestation Reports

## Requirements

## Features

- 🧠 Intelligent ODAVL Cycles (Observe→Decide→Act→Verify→Learn)
- 🔒 Real-Time Security & Policy Gates
- 📊 Enterprise Insights Dashboard
- 🧩 Configurable Risk Budgets & Compliance
- 🧾 Automated Attestation Reports

## System Requirements

      gitleaks git --config /home/dev/customgitleaks.toml .
      ```bash

# ODAVL – Autonomous Code Quality & Governance for Enterprises

**Secure, compliant, and intelligent code governance directly inside VS Code.**

## Overview

- 🧠 Intelligent ODAVL Cycles (Observe→Decide→Act→Verify→Learn)
- 🔒 Real-Time Security & Policy Gates
- 📊 Enterprise Insights Dashboard
- 🧩 Configurable Risk Budgets & Compliance
- 🗃️ Automated Attestation Reports

## Features

- 🧠 Intelligent ODAVL Cycles (Observe→Decide→Act→Verify→Learn)
- 🔒 Real-Time Security & Policy Gates
- 📊 Enterprise Insights Dashboard
- 🧩 Configurable Risk Budgets & Compliance
- 🗃️ Automated Attestation Reports

## System Requirements

- VS Code ≥ 1.85.0
- Node ≥ 18
- pnpm ≥ 9

## Install

```bash
code --install-extension odavl.odavl-extension
```

## Marketplace Metadata

- **Repository:** [https://github.com/odavlstudio/odavl](https://github.com/odavlstudio/odavl)
- **Bugs:** [https://github.com/odavlstudio/odavl/issues](https://github.com/odavlstudio/odavl/issues)
- **Homepage:** [https://odavl.com](https://odavl.com)
- **License:** MIT
- **Categories:** Linters, Testing, Other
- **Keywords:** ODAVL, Governance, Security, Code Quality

## Monorepo Structure

```
apps/
  cli/           # @odavl/cli package
  vscode-ext/    # VS Code Doctor extension
.odavl/
  recipes/       # Recipe templates
  gates.yml      # Quality gates configuration
  attestation/   # Cryptographic proofs
  undo/          # Rollback snapshots
reports/         # Metrics and run history
odavl-website/   # Next.js marketing/docs site
```

## Configuration

ODAVL uses YAML and JSON configuration files in `.odavl/` for safety gates, risk policy, and run history. See the documentation for details.

## Documentation

- [Official Docs](https://odavl.org/docs)
- [Quick Start](https://odavl.org/docs/quickstart)
- [API Reference](https://odavl.org/docs/api)

## License

MIT

