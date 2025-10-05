# ODAVL - Self-Healing Code Infrastructure

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

**ODAVL** (Observe-Decide-Act-Verify-Learn) is an autonomous code quality improvement system that continuously monitors and fixes code issues within defined safety constraints.

## 🎯 Features

- **🔍 Observe**: Continuous monitoring of ESLint warnings and TypeScript errors
- **🧠 Decide**: AI-powered decision making using recipe-based trust learning
- **⚡ Act**: Automated code fixes with eslint --fix and other remediation strategies
- **✅ Verify**: Safety gates and shadow verification ensure quality never degrades
- **📚 Learn**: Cryptographic attestation and trust scoring for continuous improvement

## 🚀 Quick Start

```bash
# Install globally
npm install -g @odavl/cli

# Or run directly
npx @odavl/cli run

# Basic usage in your project
odavl run
```

## 📋 Example Output

```bash
[ODAVL] Observe → Decide → Act → Verify → Learn
[OBSERVE] ESLint warnings: 5, Type errors: 0
[DECIDE] Selected recipe: remove-unused (trust 0.9)
[ACT] Running eslint --fix …
[VERIFY] Gates check: PASS ✅
[DONE] ESLint warnings: 5 → 0 (Δ -5) | Type errors: 0 → 0 (Δ 0)
```

## 🔐 Attestation & Trust

ODAVL generates cryptographic attestations for successful improvements:

```json
{
  "planId": "improve-eslint-20251005",
  "timestamp": "2025-10-05T16:33:24.196Z",
  "deltas": { "eslint": -5, "types": 0 },
  "gatesPassed": true,
  "attestation": "verified",
  "signature": "sha256:a1b2c3..."
}
```

## 🎨 VS Code Doctor Mode

Install the ODAVL Doctor extension for live cycle monitoring:

1. Install from VS Code Marketplace (search "ODAVL Doctor")
2. Command Palette → "ODAVL: Doctor Mode"  
3. Click "Run ODAVL Cycle" to see real-time progress
4. View color-coded phase indicators and detailed logs

## 🛡️ Safety & Configuration

ODAVL includes multiple safety mechanisms:

- **Quality Gates**: Zero tolerance for new type errors
- **Shadow Verification**: Test changes in isolated environment
- **Undo System**: Automatic snapshots before modifications
- **Trust Learning**: Recipe success rates inform future decisions

Configure via `.odavl/gates.yml`:

```yaml
eslint:
  deltaMax: 0
typeErrors:
  deltaMax: 0
policy:
  maxFilesTouched: 10
```

## 📦 Project Structure

```text
apps/
  cli/           # @odavl/cli package
  vscode-ext/    # VS Code Doctor extension
.odavl/
  recipes/       # Recipe templates
  gates.yml      # Quality gates configuration
  attestation/   # Cryptographic proofs
  undo/          # Rollback snapshots
reports/         # Metrics and run history
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Created by Mohammad Nawlo

- GitHub: [@Monawlo812](https://github.com/Monawlo812)